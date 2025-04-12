import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getLiturgicalInfo } from '@/lib/LiturgicalCalendarService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const client = await clientPromise;
    const db = client.db("church");

    if (date) {
      const selections = await db.collection("service_songs").findOne({ date });
      
      // If we have selections but no liturgical info, add it
      if (selections && !selections.liturgical) {
        // Parse date string to Date object (assuming format M/D/YY)
        const [month, day, yearShort] = date.split('/').map(num => parseInt(num, 10));
        // Convert 2-digit year to 4-digit
        const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
        const serviceDate = new Date(fullYear, month - 1, day);
        
        // Get liturgical information using our service
        const liturgicalInfo = getLiturgicalInfo(serviceDate);
        
        // Add liturgical information to the selections
        selections.liturgical = {
          season: liturgicalInfo.seasonId,
          seasonName: liturgicalInfo.season.name,
          color: liturgicalInfo.color,
          specialDay: liturgicalInfo.specialDayId
        };
        
        // Save liturgical info back to database
        await db.collection("service_songs").updateOne(
          { date },
          { $set: { liturgical: selections.liturgical } }
        );
      }
      
      return NextResponse.json(selections || {});
    }

    const selections = await db.collection("service_songs").find({}).toArray();
    
    // Add liturgical information to all selections
    for (let selection of selections) {
      if (!selection.liturgical) {
        // Parse date string to Date object (assuming format M/D/YY)
        const [month, day, yearShort] = selection.date.split('/').map(num => parseInt(num, 10));
        // Convert 2-digit year to 4-digit
        const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
        const serviceDate = new Date(fullYear, month - 1, day);
        
        // Get liturgical information using our service
        const liturgicalInfo = getLiturgicalInfo(serviceDate);
        
        // Add liturgical information to the selection
        selection.liturgical = {
          season: liturgicalInfo.seasonId,
          seasonName: liturgicalInfo.season.name,
          color: liturgicalInfo.color,
          specialDay: liturgicalInfo.specialDayId
        };
        
        // Save liturgical info back to database
        await db.collection("service_songs").updateOne(
          { date: selection.date },
          { $set: { liturgical: selection.liturgical } }
        );
      }
    }
    
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
    
    // Add liturgical information to new selections
    if (!body.liturgical) {
      // Parse date string to Date object (assuming format M/D/YY)
      const [month, day, yearShort] = body.date.split('/').map(num => parseInt(num, 10));
      // Convert 2-digit year to 4-digit
      const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
      const serviceDate = new Date(fullYear, month - 1, day);
      
      // Get liturgical information using our service
      const liturgicalInfo = getLiturgicalInfo(serviceDate);
      
      // Add liturgical information to the body
      body.liturgical = {
        season: liturgicalInfo.seasonId,
        seasonName: liturgicalInfo.season.name,
        color: liturgicalInfo.color,
        specialDay: liturgicalInfo.specialDayId
      };
    }

    // Update service_songs collection first
    await db.collection("service_songs").updateOne(
      { date: body.date },
      {
        $set: {
          date: body.date,
          selections: body.selections,
          liturgical: body.liturgical, // Include liturgical info
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

      // Update the database with the new elements and liturgical info
      await db.collection("serviceDetails").updateOne(
        { date: body.date },
        { 
          $set: { 
            elements: updatedElements,
            liturgical: body.liturgical // Sync liturgical info with service details
          } 
        }
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