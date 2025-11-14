import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const client = await clientPromise;
    const db = client.db("church");

    if (date) {
      // Get selections for a specific date
      const selections = await db
        .collection("worship_selections")
        .findOne({ date });
      return NextResponse.json(selections || null);
    } else {
      // Get all song selections
      const selections = await db
        .collection("worship_selections")
        .find({})
        .sort({ date: 1 })
        .toArray();
      return NextResponse.json(selections);
    }
  } catch (e) {
    console.error("Error in GET /api/worship-songs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    // Update or create song selections for a service
    const result = await db.collection("worship_selections").updateOne(
      { date: body.date },
      {
        $set: {
          date: body.date,
          selections: {
            opening: body.selections.opening,
            dayHymn: body.selections.dayHymn,
            sending: body.selections.sending,
          },
          selectedBy: body.selectedBy,
          status: body.status || "pending",
          lastUpdated: new Date(),
        },
      },
      { upsert: true },
    );

    // If this is a new selection or the song hasn't been used before,
    // update the usage history
    if (result.upsertedId || result.modifiedCount > 0) {
      const songs = [
        body.selections.opening,
        body.selections.dayHymn,
        body.selections.sending,
      ].filter(Boolean);

      for (const song of songs) {
        if (song.title) {
          await db.collection("song_history").updateOne(
            { title: song.title },
            {
              $push: {
                usageDates: {
                  $each: [body.date],
                  $position: 0,
                },
              },
              $set: {
                lastUsed: new Date(),
                isHymn: song.isHymn || false,
                hymnNumber: song.hymnNumber,
                hymnalVersion: song.hymnalVersion,
                author: song.author,
              },
            },
            { upsert: true },
          );
        }
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Error in POST /api/worship-songs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Get song usage history and check for recent uses
export async function PUT(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    const songHistory = await db
      .collection("song_history")
      .findOne({ title: body.title });

    if (!songHistory) {
      return NextResponse.json({ recentlyUsed: false });
    }

    // Check if song was used in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentUses = songHistory.usageDates.filter((date) => {
      const [month, day, year] = date.split("/").map((num) => parseInt(num));
      const usageDate = new Date(2000 + year, month - 1, day);
      return usageDate > oneMonthAgo;
    });

    return NextResponse.json({
      recentlyUsed: recentUses.length > 0,
      lastUsedDates: recentUses,
    });
  } catch (e) {
    console.error("Error in PUT /api/worship-songs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
