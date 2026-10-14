import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { readJsonBody } from "@/lib/apiSchemas";
import { normalizeTitle } from "@/lib/songHistory";
import { syncSongUsageForDate } from "@/lib/songUsageSync";

export async function POST(request) {
  try {
    const parsedBody = await readJsonBody(request);
    if (!parsedBody.success) return parsedBody.response;
    const { sourceId, targetId } = parsedBody.data;

    if (!sourceId || !targetId) {
      return NextResponse.json(
        {
          error: "Source and target song IDs are required",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("church");

    // Get both songs
    const sourceSong = await db.collection("songs").findOne({
      _id: new ObjectId(sourceId),
    });
    const targetSong = await db.collection("songs").findOne({
      _id: new ObjectId(targetId),
    });

    if (!sourceSong || !targetSong) {
      return NextResponse.json(
        {
          error: "One or both songs not found",
        },
        { status: 404 },
      );
    }

    // Get usage history for source song
    const sourceUsage = await db.collection("song_usage").findOne({
      title: sourceSong.title,
    });

    // If source song has usage history, merge it with target song's usage history
    if (sourceUsage) {
      const targetUsage = await db.collection("song_usage").findOne({
        title: targetSong.title,
      });

      if (targetUsage) {
        // Merge usage histories
        await db.collection("song_usage").updateOne(
          { title: targetSong.title },
          {
            $push: {
              uses: {
                $each: sourceUsage.uses,
              },
            },
          },
        );

        // Delete the source usage history
        await db.collection("song_usage").deleteOne({
          title: sourceSong.title,
        });
      } else {
        // If target song has no usage history, rename source song's usage to target song's title
        await db.collection("song_usage").updateOne(
          { title: sourceSong.title },
          {
            $set: {
              title: targetSong.title,
              type: targetSong.type,
            },
          },
        );
      }
    }

    // Services that picked the merged-away song now name the kept one.
    // Song history follows the picks, so without this the next save of any
    // such date would move its history back under the old title.
    await renamePicks(db, sourceSong, targetSong);

    // Delete the source song
    await db.collection("songs").deleteOne({
      _id: new ObjectId(sourceId),
    });

    return NextResponse.json({
      success: true,
      message: "Songs merged successfully",
    });
  } catch (e) {
    console.error("Error merging songs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function renamePicks(db, sourceSong, targetSong) {
  const from = normalizeTitle(sourceSong.title);
  const facts = {
    title: targetSong.title,
    type: targetSong.type,
    number: targetSong.number || "",
    hymnal: targetSong.hymnal || "",
    author: targetSong.author || "",
  };

  const services = await db.collection("service_songs").find({}).toArray();
  for (const service of services) {
    const $set = {};
    for (const [slot, sel] of Object.entries(service.selections || {})) {
      if (normalizeTitle(sel?.title) === from)
        $set[`selections.${slot}`] = { ...sel, ...facts };
    }
    if (!Object.keys($set).length) continue;
    await db
      .collection("service_songs")
      .updateOne({ date: service.date }, { $set });
    try {
      const selections = { ...service.selections };
      for (const key of Object.keys($set))
        selections[key.replace("selections.", "")] = $set[key];
      await syncSongUsageForDate(db, service.date, selections);
    } catch (syncError) {
      console.error("Song history sync failed:", syncError);
    }
  }

  const details = await db.collection("serviceDetails").find({}).toArray();
  for (const doc of details) {
    const $set = {};
    (doc.elements || []).forEach((el, i) => {
      if (normalizeTitle(el?.selection?.title) !== from) return;
      $set[`elements.${i}.selection`] = { ...el.selection, ...facts };
      if (el.content?.includes(el.selection.title))
        $set[`elements.${i}.content`] = el.content.replace(
          el.selection.title,
          targetSong.title,
        );
    });
    if (Object.keys($set).length)
      await db
        .collection("serviceDetails")
        .updateOne({ date: doc.date }, { $set });
  }
}
