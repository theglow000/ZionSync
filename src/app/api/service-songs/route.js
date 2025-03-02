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

    // Update service_songs collection first
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

    // Then update serviceDetails with the selections
    const serviceDetails = await db.collection("serviceDetails").findOne({ date: body.date });
    if (serviceDetails?.elements) {
      let currentSongIndex = 0;
      
      const updatedElements = serviceDetails.elements.map(element => {
        if (element.type === 'song_hymn') {
          const matchingSong = Object.values(body.selections)[currentSongIndex];
          currentSongIndex++;

          if (matchingSong) {
            // Extract only the prefix part, removing any existing song details
            const prefix = element.content.split(':')[0].split(' - ')[0].trim();
            
            // Format the song details without duplicating the title
            let songDetails;
            if (matchingSong.type === 'hymn') {
              songDetails = `${matchingSong.title} #${matchingSong.number} (${formatHymnalName(matchingSong.hymnal)})`;
            } else {
              songDetails = matchingSong.author ? 
                `${matchingSong.title} - ${matchingSong.author}` : 
                matchingSong.title;
            }

            // Combine prefix with formatted song details
            const formattedContent = `${prefix}: ${songDetails}`;

            return {
              ...element,
              content: formattedContent,
              selection: {
                ...matchingSong,
                originalPrefix: prefix
              }
            };
          }
        }
        return element;
      });

      // Update the database with the new elements
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

// Helper function to format hymnal names
const formatHymnalName = (hymnal) => {
  if (!hymnal) return '';
  return hymnal.charAt(0).toUpperCase() + hymnal.slice(1);
};