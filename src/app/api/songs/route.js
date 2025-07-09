import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { validateSongData, validateQueryParams, songQuerySchema, createValidationResponse } from '@/lib/validation';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Only validate query parameters if they are provided
    const hasQueryParams = searchParams.has('recent') || searchParams.has('months');
    let recent = false;
    let months = 3;
    
    if (hasQueryParams) {
      // Validate query parameters
      const queryValidation = validateQueryParams(songQuerySchema, {
        recent: searchParams.get('recent'),
        months: searchParams.get('months')
      });
      
      if (!queryValidation.success) {
        return createValidationResponse(queryValidation.errors);
      }
      
      ({ recent, months } = queryValidation.data);
    }
    
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
    
    // Validate input data
    const validation = validateSongData(body);
    if (!validation.success) {
      return createValidationResponse(validation.errors);
    }
    
    const validatedData = validation.data;
    const client = await clientPromise;
    const db = client.db("church");

    // Structured song data with songOrder field for Proclaim presentation planning
    const songData = {
      title: validatedData.title,
      type: validatedData.type,
      notes: validatedData.notes,
      youtubeLink: validatedData.youtubeLink,
      songOrder: validatedData.songOrder, // For Proclaim component order (Chorus, Verse 1, etc.)
      seasonalTags: validatedData.seasonalTags,
      seasonalTagsConfidence: validatedData.seasonalTagsConfidence,
      usageCount: 0, // Initialize usage count for analytics

      // Type-specific fields
      ...(validatedData.type === 'hymn' ? {
        number: validatedData.number,
        hymnal: validatedData.hymnal,
        hymnaryLink: validatedData.hymnaryLink
      } : {
        author: validatedData.author,
        songSelectLink: validatedData.songSelectLink
      })
    };

    // Check if song already exists
    const existingSong = validatedData._id 
      ? await db.collection("songs").findOne({ _id: new ObjectId(validatedData._id) })
      : await db.collection("songs").findOne({ title: validatedData.title });
      
    if (existingSong) {
      const result = await db.collection("songs").updateOne(
        validatedData._id ? { _id: new ObjectId(validatedData._id) } : { title: validatedData.title },
        {
          $set: {
            ...songData,
            lastUpdated: new Date(),
            // Preserve existing usage count when updating
            usageCount: existingSong.usageCount || 0
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