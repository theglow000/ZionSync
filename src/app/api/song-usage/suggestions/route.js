import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import songSuggestionEngine from "@/lib/SongSuggestionEngine.js";
import {
  validateQueryParams,
  suggestionQuerySchema,
  createValidationResponse,
} from "@/lib/validation";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryValidation = validateQueryParams(suggestionQuerySchema, {
      limit: searchParams.get("limit"),
      unusedMonths: searchParams.get("unusedMonths"),
      type: searchParams.get("type"),
      season: searchParams.get("season"),
      refresh: searchParams.get("refresh"),
    });

    if (!queryValidation.success) {
      return createValidationResponse(queryValidation.errors);
    }

    const {
      limit,
      unusedMonths,
      type,
      season: seasonId,
      refresh: forceRefresh,
    } = queryValidation.data;

    // Connect to database
    const client = await clientPromise;
    const db = client.db("church");

    // Get all songs from the database
    const allSongs = await db.collection("songs").find({}).toArray();

    // Get usage analytics data
    const usageData = await db
      .collection("song_usage")
      .aggregate([
        // Group by song title to calculate frequency and last used
        {
          $group: {
            _id: "$title",
            count: { $sum: 1 },
            lastUsed: { $max: "$dateUsed" },
          },
        },

        // Project to the desired output format
        {
          $project: {
            _id: 0,
            title: "$_id",
            count: 1,
            lastUsed: 1,
          },
        },

        // Sort by count descending
        { $sort: { count: -1 } },
      ])
      .toArray();

    // Format analytics data
    const formattedUsageData = {
      frequency: usageData,
    };

    // Replace the manual filtering code with the actual engine call
    const suggestions = await songSuggestionEngine.getSuggestions({
      allSongs,
      usageData: { frequency: usageData },
      currentDate: new Date().toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
      }),
      seasonId,
      unusedMonths,
      type,
      balanceTypes: true,
      limit,
      forceRefresh,
    });

    // Return the suggestions
    return NextResponse.json({
      suggestions,
      count: suggestions.length,
      unusedMonths,
      seasonId: seasonId || "auto-detected",
    });
  } catch (error) {
    console.error("Error getting song suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get song suggestions", message: error.message },
      { status: 500 },
    );
  }
}
