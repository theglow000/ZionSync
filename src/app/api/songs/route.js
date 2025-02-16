import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    const songs = await db.collection("songs").find({}).toArray();
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
    const existingSong = await db.collection("songs").findOne({ title: body.title });
    if (existingSong) {
      const result = await db.collection("songs").updateOne(
        { title: body.title },
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