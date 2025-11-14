import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb.js";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const requestData = await request.json();
    const { referenceSongId, serviceDate, position, songData } = requestData;

    if (!referenceSongId || !serviceDate || !position) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("church");

    // 1. Get reference song data
    const referenceSong = songData;

    if (!referenceSong || !referenceSong.title) {
      return NextResponse.json(
        { message: "Reference song data is missing or invalid" },
        { status: 400 },
      );
    }

    // 2. Check if this song already exists in the song library
    let existingSong = null;
    let songId = null;
    let wasExisting = false;

    // IMPROVED LOOKUP: Try multiple strategies to find a matching song

    // First try a case-insensitive exact match on title and type
    existingSong = await db.collection("songs").findOne({
      title: { $regex: new RegExp(`^${referenceSong.title}$`, "i") },
      type: referenceSong.type,
    });

    // If it's a hymn with number and hymnal, try matching on those too
    if (
      !existingSong &&
      referenceSong.type === "hymn" &&
      referenceSong.number &&
      referenceSong.hymnal
    ) {
      existingSong = await db.collection("songs").findOne({
        type: "hymn",
        number: referenceSong.number,
        hymnal: referenceSong.hymnal,
      });
    }

    if (existingSong) {
      // Use the existing song
      songId = existingSong._id;
      wasExisting = true;
    } else {
      // Add the reference song to the song library
      const newSong = {
        title: referenceSong.title,
        type: referenceSong.type,
        number: referenceSong.number || "",
        hymnal: referenceSong.hymnal || "",
        author: referenceSong.author || "",
        hymnaryLink:
          referenceSong.type === "hymn" &&
          referenceSong.number &&
          referenceSong.hymnal
            ? `https://hymnary.org/hymn/${referenceSong.hymnal}${referenceSong.number}`
            : "",
        songSelectLink: "",
        youtubeLink: referenceSong.youtube || "",
        notes: referenceSong.notes || "",
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        addedFromReference: true,
      };

      // Insert the new song into the collection
      const result = await db.collection("songs").insertOne(newSong);
      songId = result.insertedId;
      existingSong = newSong; // Use this song data for insertion
    }

    // 3. Get the service to update
    const serviceDetails = await db
      .collection("serviceDetails")
      .findOne({ date: serviceDate });

    if (!serviceDetails) {
      return NextResponse.json(
        { message: `No service found for date: ${serviceDate}` },
        { status: 404 },
      );
    }

    // 4. Map positions to element indices
    // Find the element to update (based on the position ID format song_X)
    let elementIndex = -1;
    const songPositionMappings = [];

    if (serviceDetails.elements) {
      let songPositionCounter = 0;

      for (let i = 0; i < serviceDetails.elements.length; i++) {
        const element = serviceDetails.elements[i];

        if (element.type === "song_hymn") {
          const currentPositionId = `song_${songPositionCounter}`;
          songPositionMappings.push({
            positionId: currentPositionId,
            elementIndex: i,
          });

          if (currentPositionId === position) {
            elementIndex = i;
          }

          songPositionCounter++;
        }
      }
    }

    if (elementIndex === -1) {
      return NextResponse.json(
        {
          message: `Position ${position} not found in service for date ${serviceDate}`,
        },
        { status: 400 },
      );
    }

    // 5. Update the service with the song selection
    const songSelection = {
      type: existingSong.type,
      title: existingSong.title,
      number: existingSong.number || "",
      hymnal: existingSong.hymnal || "",
      author: existingSong.author || "",
      sheetMusic: existingSong.hymnaryLink || existingSong.songSelectLink || "",
      youtube: existingSong.youtubeLink || "",
      notes: existingSong.notes || "",
    };

    // Create updated elements array with the song selection
    const updatedElements = [...serviceDetails.elements];
    updatedElements[elementIndex] = {
      ...updatedElements[elementIndex],
      selection: songSelection,
      reference:
        existingSong.type === "hymn" &&
        existingSong.number &&
        existingSong.hymnal
          ? `#${existingSong.number} - ${existingSong.hymnal}`
          : existingSong.author
            ? `by ${existingSong.author}`
            : "",
    };

    // Update serviceDetails collection
    await db.collection("serviceDetails").updateOne(
      { date: serviceDate },
      {
        $set: {
          elements: updatedElements,
          lastUpdated: new Date().toISOString(),
        },
      },
    );

    // 6. Update service_songs collection for compatibility
    // Find the position number from the mapping
    const positionMatch = songPositionMappings.find(
      (m) => m.positionId === position,
    );
    const positionNumber = positionMatch
      ? parseInt(position.replace("song_", ""), 10)
      : -1;

    if (positionNumber !== -1) {
      const serviceKey = `song_${positionNumber}`;
      const updateObject = {};
      updateObject[`selections.${serviceKey}`] = songSelection;

      await db.collection("service_songs").updateOne(
        { date: serviceDate },
        {
          $set: updateObject,
          $setOnInsert: {
            timestamp: new Date().toISOString(),
            updatedBy: null,
          },
        },
        { upsert: true },
      );
    }

    // 7. Record song usage for analytics
    await db.collection("song_usage").updateOne(
      { title: existingSong.title, type: existingSong.type },
      {
        $push: {
          uses: {
            dateUsed: new Date(serviceDate),
            service: serviceDetails.type || "regular",
            addedBy: "Reference Panel",
          },
        },
        $setOnInsert: {
          songData: {
            number: existingSong.number || "",
            hymnal: existingSong.hymnal || "",
            author: existingSong.author || "",
            sheetMusic: existingSong.hymnaryLink || "",
            youtube: existingSong.youtubeLink || "",
            notes: existingSong.notes || "",
          },
          title: existingSong.title,
          type: existingSong.type,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      message: `Successfully added "${existingSong.title}" to the service on ${serviceDate}`,
      success: true,
      songId: songId,
      wasExisting: wasExisting,
    });
  } catch (error) {
    console.error("Error importing reference song:", error);
    return NextResponse.json(
      { message: "Failed to import song", error: error.message },
      { status: 500 },
    );
  }
}
