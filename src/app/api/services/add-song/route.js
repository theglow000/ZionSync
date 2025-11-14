import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb.js";

export async function POST(request) {
  try {
    const { songId, serviceDate, position, notes } = await request.json();

    if (!songId || !serviceDate || !position) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("church");

    // 1. Get the song details from song ID
    const song = await db.collection("songs").findOne({ _id: songId });

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // 2. Get the service details
    let serviceDetails = await db
      .collection("service_details")
      .findOne({ date: serviceDate });

    if (!serviceDetails) {
      // If no service details exist yet, create a basic structure
      serviceDetails = {
        date: serviceDate,
        elements: [],
        type: "default",
      };
    }

    // 3. Format position name for display
    let positionLabel = position;
    if (position === "opening") positionLabel = "Opening Song";
    else if (position === "offertory") positionLabel = "Offertory";
    else if (position === "communion") positionLabel = "Communion";
    else if (position === "closing") positionLabel = "Closing Song";
    else if (position === "general") positionLabel = "Song";

    // 4. Format song details based on type
    const songDetails =
      song.type === "hymn"
        ? `${song.title} #${song.number} (${song.hymnal ? song.hymnal.charAt(0).toUpperCase() + song.hymnal.slice(1) : "Hymnal"})`
        : song.author
          ? `${song.title} - ${song.author}`
          : song.title;

    // 5. Find if there's already a song in this position
    const existingElementIndex = serviceDetails.elements.findIndex(
      (element) =>
        element.type === "song_hymn" && element.position === position,
    );

    // 6. Create the song element
    const songElement = {
      type: "song_hymn",
      position: position,
      content: `${positionLabel}: ${songDetails}`,
      selection: {
        _id: song._id,
        title: song.title,
        type: song.type,
        number: song.number || "",
        hymnal: song.hymnal || "",
        author: song.author || "",
        sheetMusic:
          song.type === "hymn" ? song.hymnaryLink : song.songSelectLink,
        youtube: song.youtubeLink || "",
        notes: notes || song.notes || "",
        content: positionLabel, // Store original label
      },
    };

    // 7. Update or add the song element
    if (existingElementIndex >= 0) {
      serviceDetails.elements[existingElementIndex] = songElement;
    } else {
      serviceDetails.elements.push(songElement);
    }

    // 8. Save updated service details
    await db
      .collection("service_details")
      .updateOne(
        { date: serviceDate },
        { $set: serviceDetails },
        { upsert: true },
      );

    // 9. Update service_songs collection
    await db.collection("service_songs").updateOne(
      { date: serviceDate },
      {
        $set: {
          [`selections.${position}`]: songElement.selection,
        },
      },
      { upsert: true },
    );

    // 10. Record song usage
    await db.collection("song_usage").insertOne({
      title: song.title,
      type: song.type,
      dateUsed: serviceDate,
      service: serviceDetails.type || "default",
      addedBy: "Rediscovery Panel",
      number: song.number || "",
      hymnal: song.hymnal || "",
      author: song.author || "",
      hymnaryLink: song.hymnaryLink || "",
      songSelectLink: song.songSelectLink || "",
      youtubeLink: song.youtubeLink || "",
      notes: notes || song.notes || "",
    });

    return NextResponse.json({
      success: true,
      message: `${song.title} added to service on ${serviceDate}`,
      serviceDate,
      songTitle: song.title,
    });
  } catch (error) {
    console.error("Error adding song to service:", error);
    return NextResponse.json(
      { error: "Failed to add song to service", message: error.message },
      { status: 500 },
    );
  }
}
