// /src/app/api/song-usage/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createValidationResponse } from "@/lib/validation";
import { z } from "zod";
import { readJsonBody } from "@/lib/apiSchemas";
import { normalizeTitle } from "@/lib/songHistory";
import {
  updateSongRotationStatus,
  updateAllSongsRotationStatus,
} from "@/lib/songRotation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const songTitle = searchParams.get("title");
  const songId = searchParams.get("songId");
  const monthsBack = parseInt(searchParams.get("months") || "3");
  const includeRotation = searchParams.get("rotation") === "true";

  try {
    const client = await clientPromise;
    const db = client.db("church");

    // Standardize date comparison for the search
    const currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0);
    const cutoffDate = new Date(currentDate);
    cutoffDate.setMonth(currentDate.getMonth() - monthsBack);

    if (includeRotation) {
      // Get the song data first to include rotation information
      const song = songId
        ? await db
            .collection("songs")
            .findOne(
              ObjectId.isValid(songId)
                ? { _id: new ObjectId(songId) }
                : { _id: null },
            )
        : await db.collection("songs").findOne({ title: songTitle });

      if (!song) {
        return NextResponse.json(
          { message: "Song not found" },
          { status: 404 },
        );
      }

      // Then get usage information
      const songUsage = await db.collection("song_usage").findOne({
        title: song.title,
        "uses.dateUsed": {
          $gte: cutoffDate,
          $lte: currentDate,
        },
      });

      // Format the usage data similar to the original function
      const formattedUsage =
        songUsage && songUsage.uses
          ? songUsage.uses
              .filter((use) => {
                const useDate = new Date(use.dateUsed);
                return useDate >= cutoffDate && useDate <= currentDate;
              })
              .map((use) => ({
                title: songUsage.title,
                dateUsed: new Date(use.dateUsed).toISOString(),
                service: use.service,
                addedBy: use.addedBy,
              }))
          : [];

      // Include rotation status in the response
      return NextResponse.json({
        song: {
          title: song.title,
          _id: song._id,
          type: song.type,
          rotationStatus: song.rotationStatus || {
            isLearning: false,
            isInRotation: false,
          },
        },
        usage: formattedUsage,
      });
    } else {
      // Original functionality. History can sit under a different spelling
      // of the same title ("Standing on the Promises " with a trailing
      // space), so gather every record that normalizes to it.
      const key = normalizeTitle(songTitle);
      const records = (
        await db.collection("song_usage").find({}).toArray()
      ).filter((d) => key && normalizeTitle(d.title) === key);
      const songUsage = { uses: records.flatMap((d) => d.uses || []) };

      if (!songUsage.uses.length) {
        return NextResponse.json([]);
      }

      // Filter and format the usage data
      const formattedUsage = songUsage.uses
        .filter((use) => {
          const useDate = new Date(use.dateUsed);
          return useDate >= cutoffDate && useDate <= currentDate;
        })
        .map((use) => ({
          title: songTitle,
          dateUsed: new Date(use.dateUsed).toISOString(),
          service: use.service,
          addedBy: use.addedBy,
        }));

      return NextResponse.json(formattedUsage);
    }
  } catch (e) {
    console.error("Error getting song usage:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const parsedBody = await readJsonBody(request);
    if (!parsedBody.success) return parsedBody.response;
    const body = parsedBody.data;

    // Validate input data
    const validation = z
      .object({
        title: z
          .string()
          .min(1, "Title is required")
          .max(200, "Title must be less than 200 characters"),
        date: z
          .string()
          .regex(
            /^\d{1,2}\/\d{1,2}\/\d{2}$/,
            "Date must be in MM/DD/YY format",
          ),
        service: z
          .string()
          .max(100, "Service name must be less than 100 characters")
          .optional()
          .default(""),
        addedBy: z
          .string()
          .max(100, "Added by must be less than 100 characters")
          .optional()
          .default(""),
      })
      .safeParse(body);

    if (!validation.success) {
      return createValidationResponse(
        validation.error.errors?.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        ) || ["Validation failed"],
      );
    }

    const validatedData = validation.data;

    // Standardize the date format when saving
    const [month, day, year] = validatedData.date.split("/").map(Number);
    const standardizedDate = new Date(2000 + year, month - 1, day);
    standardizedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    const client = await clientPromise;
    const db = client.db("church");

    // Remove existing usage with standardized date comparison
    await db.collection("song_usage").updateMany(
      {
        "uses.dateUsed": {
          $gte: new Date(standardizedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(standardizedDate.setHours(23, 59, 59, 999)),
        },
        "uses.service": validatedData.service,
      },
      {
        $pull: {
          uses: {
            dateUsed: {
              $gte: new Date(standardizedDate.setHours(0, 0, 0, 0)),
              $lt: new Date(standardizedDate.setHours(23, 59, 59, 999)),
            },
            service: validatedData.service,
          },
        },
      },
    );

    // Add new usage with standardized date
    const result = await db.collection("song_usage").updateOne(
      { title: validatedData.title },
      {
        $setOnInsert: {
          title: validatedData.title,
          type: body.type,
          songData: {
            number: body.number,
            hymnal: body.hymnal,
            author: body.author,
            sheetMusic:
              body.type === "hymn" ? body.hymnaryLink : body.songSelectLink,
            youtube: body.youtubeLink,
            notes: body.notes,
          },
        },
        $push: {
          uses: {
            dateUsed: standardizedDate,
            service: validatedData.service,
            addedBy: validatedData.addedBy,
          },
        },
      },
      { upsert: true },
    );

    // Update the song rotation status after adding the usage
    await updateSongRotationStatus(validatedData.title, db);

    // Update the usage count in the songs collection for analytics efficiency
    await db
      .collection("songs")
      .updateOne({ title: validatedData.title }, { $inc: { usageCount: 1 } });

    return NextResponse.json(result);
  } catch (e) {
    console.error("Error recording song usage:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Add a new endpoint for updating rotation status for all songs
export async function PUT() {
  try {
    const client = await clientPromise;
    const db = client.db("church");

    const result = await updateAllSongsRotationStatus(db);

    return NextResponse.json(result);
  } catch (e) {
    console.error("Error updating song rotation status:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
