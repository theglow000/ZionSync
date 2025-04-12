import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Get a specific reference song by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid song ID" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("church");
    
    const song = await db.collection("reference_songs").findOne({ _id: new ObjectId(id) });
    
    if (!song) {
      return NextResponse.json({ message: "Song not found" }, { status: 404 });
    }
    
    return NextResponse.json(song);
  } catch (e) {
    console.error(`Error getting reference song ${params?.id}:`, e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

// Update a reference song
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid song ID" }, { status: 400 });
    }
    
    // Validate required fields
    if (!updateData.title) {
      return NextResponse.json({ message: "Song title is required" }, { status: 400 });
    }
    
    if (!updateData.type || !['hymn', 'contemporary'].includes(updateData.type)) {
      return NextResponse.json({ message: "Song type must be 'hymn' or 'contemporary'" }, { status: 400 });
    }
    
    if (!updateData.seasonalTags || updateData.seasonalTags.length === 0) {
      return NextResponse.json({ message: "At least one seasonal tag is required" }, { status: 400 });
    }
    
    // Additional validation for hymns
    if (updateData.type === 'hymn' && !updateData.number) {
      return NextResponse.json({ message: "Hymn number is required for hymns" }, { status: 400 });
    }
    
    // Additional validation for contemporary songs
    if (updateData.type === 'contemporary' && !updateData.author) {
      return NextResponse.json({ message: "Author/artist is required for contemporary songs" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("church");
    
    // Remove _id from update data if present
    if (updateData._id) delete updateData._id;
    
    // Add last updated timestamp
    updateData.lastUpdated = new Date().toISOString();
    
    const result = await db.collection("reference_songs").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Song not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      message: "Reference song updated successfully",
      success: true
    });
  } catch (e) {
    console.error(`Error updating reference song ${params?.id}:`, e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

// Delete a reference song
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid song ID" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("church");
    
    const result = await db.collection("reference_songs").deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Song not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      message: "Reference song deleted successfully",
      success: true
    });
  } catch (e) {
    console.error(`Error deleting reference song ${params?.id}:`, e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}