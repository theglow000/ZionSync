import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const client = await clientPromise;
    const db = client.db("church");

    if (date) {
      const selections = await db.collection("service_songs").findOne({ date });
      return NextResponse.json(selections || {});
    }

    const selections = await db.collection("service_songs").find({}).toArray();
    return NextResponse.json(selections);
  } catch (e) {
    console.error('Error in GET /api/service-songs:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    // 1. Update service_songs (no changes needed here)
    await db.collection("service_songs").updateOne(
      { date: body.date },
      { 
        $set: {
          date: body.date,
          selections: body.selections,
          updatedBy: body.updatedBy,
          timestamp: new Date()
        }
      },
      { upsert: true }
    );

    // 2. Update serviceDetails with the selections
    const serviceDetails = await db.collection("serviceDetails").findOne({ date: body.date });
    if (serviceDetails?.elements) {
      const updatedElements = serviceDetails.elements.map(element => {
        // Check if element is a song that needs updating
        if (element.type === 'song_hymn') {
          // Find matching song from selections
          const songMatch = Object.entries(body.selections).find(([_, song]) => {
            // Match based on content (e.g., "Opening Hymn: Blessed Assurance")
            return element.content.toLowerCase().includes(song.title.toLowerCase());
          });

          if (songMatch) {
            const [_, songData] = songMatch;
            return {
              ...element,
              selection: songData
            };
          }
        }
        return element;
      });

      await db.collection("serviceDetails").updateOne(
        { date: body.date },
        { $set: { elements: updatedElements } }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error in POST /api/service-songs:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}