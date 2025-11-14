import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const type = searchParams.get("type");
    const query = searchParams.get("query");

    const client = await clientPromise;
    const db = client.db("church");

    // Build query object
    let queryObj = {};

    // Filter by season if specified
    if (season) {
      queryObj.seasonalTags = season;
    }

    // Filter by type if specified
    if (type && (type === "hymn" || type === "contemporary")) {
      queryObj.type = type;
    }

    // Text search if query is provided
    if (query) {
      queryObj.$or = [
        { title: { $regex: query, $options: "i" } },
        { author: { $regex: query, $options: "i" } },
      ];
    }

    // Get reference songs
    const referenceSongs = await db
      .collection("reference_songs")
      .find(queryObj)
      .sort({ title: 1 })
      .toArray();

    return NextResponse.json(referenceSongs);
  } catch (e) {
    console.error("Error in GET /api/reference-songs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Create a new reference song
export async function POST(request) {
  try {
    const songData = await request.json();

    // Validate required fields
    if (!songData.title) {
      return NextResponse.json(
        { message: "Song title is required" },
        { status: 400 },
      );
    }

    if (!songData.type || !["hymn", "contemporary"].includes(songData.type)) {
      return NextResponse.json(
        { message: "Song type must be 'hymn' or 'contemporary'" },
        { status: 400 },
      );
    }

    if (!songData.seasonalTags || songData.seasonalTags.length === 0) {
      return NextResponse.json(
        { message: "At least one seasonal tag is required" },
        { status: 400 },
      );
    }

    // Additional validation for hymns
    if (songData.type === "hymn" && !songData.number) {
      return NextResponse.json(
        { message: "Hymn number is required for hymns" },
        { status: 400 },
      );
    }

    // Additional validation for contemporary songs
    if (songData.type === "contemporary" && !songData.author) {
      return NextResponse.json(
        { message: "Author/artist is required for contemporary songs" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("church");

    // Remove _id if present (to avoid insertion errors)
    if (songData._id) delete songData._id;

    // Add timestamps
    songData.created = new Date().toISOString();
    songData.lastUpdated = new Date().toISOString();

    // Insert the song
    const result = await db.collection("reference_songs").insertOne(songData);

    return NextResponse.json({
      message: "Reference song created successfully",
      id: result.insertedId,
      success: true,
    });
  } catch (e) {
    console.error("Error creating reference song:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
