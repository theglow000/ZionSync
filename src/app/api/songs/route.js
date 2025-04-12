import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const recent = searchParams.get('recent') === 'true';
    const months = parseInt(searchParams.get('months') || '3'); // Default to 3 months for recent
    
    const client = await clientPromise;
    const db = client.db("church");
    
    let query = {};
    
    // If requesting recent songs, filter by creation date
    if (recent) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      query = {
        created: { $gte: startDate }
      };
    }
    
    const songs = await db.collection("songs")
      .find(query)
      .sort({ created: -1 })
      .toArray();
      
    return NextResponse.json(songs);
  } catch (e) {
    console.error('Error in GET /api/songs:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    // Structured song data
    const songData = {
      title: body.title,
      type: body.type, // 'hymn' or 'contemporary'
      notes: body.notes || '',
      youtubeLink: body.youtubeLink || '',
      // Add seasonal tags array
      seasonalTags: body.seasonalTags || [],
      // Add confidence score for auto-tagging
      seasonalTagsConfidence: body.seasonalTagsConfidence || {},

      // Hymn-specific fields
      ...(body.type === 'hymn' ? {
        number: body.number || '',
        hymnal: body.hymnal || '',
        hymnaryLink: body.hymnaryLink || ''
      } : {
        // Contemporary-specific fields
        author: body.author || '',
        songSelectLink: body.songSelectLink || ''
      })
    };

    // Check if song already exists
    const existingSong = body._id 
      ? await db.collection("songs").findOne({ _id: new ObjectId(body._id) })
      : await db.collection("songs").findOne({ title: body.title });
      
    if (existingSong) {
      const result = await db.collection("songs").updateOne(
        body._id ? { _id: new ObjectId(body._id) } : { title: body.title },
        {
          $set: {
            ...songData,
            lastUpdated: new Date()
          }
        }
      );
      return NextResponse.json(result);
    }

    // Add new song
    const result = await db.collection("songs").insertOne({
      ...songData,
      created: new Date(),
      lastUpdated: new Date()
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('Error in POST /api/songs:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("church");
    
    // First, get the song to be deleted to know its title
    const songToDelete = await db.collection("songs").findOne({
      _id: new ObjectId(id)
    });
    
    if (!songToDelete) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    
    // Check if this song has usage history
    const usageHistory = await db.collection("song_usage").findOne({
      title: songToDelete.title
    });
    
    // Delete the song from the songs collection
    const result = await db.collection("songs").deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    
    // If this song has usage history, handle it by marking as deleted 
    // but preserving the history for analytics
    if (usageHistory) {
      await db.collection("song_usage").updateOne(
        { title: songToDelete.title },
        { 
          $set: { 
            status: "deleted",
            deletedAt: new Date(),
            originalData: songToDelete
          } 
        }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      hadUsageHistory: !!usageHistory
    });
  } catch (e) {
    console.error('Error in DELETE /api/songs:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}