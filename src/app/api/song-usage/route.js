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

    // Standardize date comparison for the search
    const currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0);
    const cutoffDate = new Date(currentDate);
    cutoffDate.setMonth(currentDate.getMonth() - monthsBack);

    console.log('API: Searching for song:', songTitle);
    console.log('Date range:', cutoffDate, 'to', currentDate);

    const songUsage = await db.collection("song_usage").findOne({ 
      title: songTitle,
      "uses.dateUsed": {
        $gte: cutoffDate,
        $lte: currentDate
      }
    });

    if (!songUsage || !songUsage.uses) {
      return NextResponse.json([]);
    }

    // Filter and format the usage data
    const formattedUsage = songUsage.uses
      .filter(use => {
        const useDate = new Date(use.dateUsed);
        return useDate >= cutoffDate && useDate <= currentDate;
      })
      .map(use => ({
        title: songTitle,
        dateUsed: new Date(use.dateUsed).toISOString(),
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
    
    if (!body.title?.trim()) {
      return NextResponse.json({ message: 'No song title provided' });
    }

    // Standardize the date format when saving
    const [month, day, year] = body.date.split('/').map(Number);
    const standardizedDate = new Date(2000 + year, month - 1, day);
    standardizedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    const client = await clientPromise;
    const db = client.db("church");

    // Remove existing usage with standardized date comparison
    await db.collection("song_usage").updateMany(
      {
        "uses.dateUsed": {
          $gte: new Date(standardizedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(standardizedDate.setHours(23, 59, 59, 999))
        },
        "uses.service": body.service 
      },
      { 
        $pull: { 
          uses: { 
            dateUsed: {
              $gte: new Date(standardizedDate.setHours(0, 0, 0, 0)),
              $lt: new Date(standardizedDate.setHours(23, 59, 59, 999))
            },
            service: body.service 
          } 
        } 
      }
    );

    // Add new usage with standardized date
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
            dateUsed: standardizedDate,
            service: body.service,
            addedBy: body.addedBy
          }
        }
      },
      { upsert: true }
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error('Error recording song usage:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}