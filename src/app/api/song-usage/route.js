// /src/app/api/song-usage/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const songTitle = searchParams.get('title');
  const monthsBack = parseInt(searchParams.get('months') || '3');

  try {
    const client = await clientPromise;
    const db = client.db("church");

    console.log('API: Searching for song:', songTitle);

    // Get the song usage document
    const songUsage = await db.collection("song_usage").findOne({ 
      title: songTitle,
      // Add case-insensitive search
      $expr: { $eq: [{ $toLower: "$title" }, songTitle.toLowerCase()] }
    });
    console.log('API: Found song usage document:', songUsage);

    if (!songUsage || !songUsage.uses) {
      return NextResponse.json([]);
    }

    // Transform dates correctly
    const formattedUsage = songUsage.uses.map(use => ({
      title: songTitle,
      dateUsed: new Date(use.dateUsed).toISOString(), // Ensure consistent date format
      service: use.service,
      addedBy: use.addedBy
    }));

    console.log('API: Returning formatted usage:', formattedUsage);
    return NextResponse.json(formattedUsage);

  } catch (e) {
    console.error('Error getting song usage:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Don't process empty songs
    if (!body.title?.trim()) {
      return NextResponse.json({ message: 'No song title provided' });
    }

    const client = await clientPromise;
    const db = client.db("church");

    // First, remove any existing usage for this date and service
    await db.collection("song_usage").updateMany(
      { "uses.dateUsed": new Date(body.date), "uses.service": body.service },
      { 
        $pull: { 
          uses: { 
            dateUsed: new Date(body.date), 
            service: body.service 
          } 
        } 
      }
    );

    // Then add the new usage
    const result = await db.collection("song_usage").updateOne(
      { title: body.title },
      {
        $setOnInsert: {
          title: body.title,
          type: body.type,
          songData: {
            number: body.number,
            hymnal: body.hymnal,
            author: body.author,
            sheetMusic: body.type === 'hymn' ? body.hymnaryLink : body.songSelectLink,
            youtube: body.youtubeLink,
            notes: body.notes
          }
        },
        $push: {
          uses: {
            dateUsed: new Date(body.date),
            service: body.service,
            addedBy: body.addedBy
          }
        }
      },
      { upsert: true }
    );

    // Clean up: Remove songs that have no uses
    await db.collection("song_usage").deleteMany({
      "uses": { $size: 0 }
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('Error recording song usage:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}