// /api/worship-assignments/route.js

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Single formatDate function for consistency
function formatDate(dateStr) {
  try {
    if (!dateStr) return null;

    let date;
    // Handle M/D/YY format
    if (dateStr.includes("/")) {
      const [month, day, year] = dateStr
        .split("/")
        .map((num) => parseInt(num, 10));
      // Keep two-digit year format for consistency with UI
      return `${month}/${day}/${year < 100 ? year : year % 100}`;
    } else {
      // Handle other date formats
      date = new Date(dateStr);
      if (isNaN(date)) return null;
      const year = date.getFullYear() % 100; // Convert to two-digit year
      return `${date.getMonth() + 1}/${date.getDate()}/${year}`;
    }
  } catch (e) {
    console.error("Date formatting error:", e);
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"), 10)
      : null;

    const client = await clientPromise;
    const db = client.db("church");

    // Single date query
    if (date) {
      const formattedDate = formatDate(date);
      const assignment = await db
        .collection("worship_assignments")
        .findOne({ date: formattedDate });
      return NextResponse.json(assignment || null);
    }

    // Date range query
    if (startDate || endDate) {
      const query = {};
      if (startDate) query.date = { $gte: formatDate(startDate) };
      if (endDate) query.date = { ...query.date, $lte: formatDate(endDate) };

      const assignments = await db
        .collection("worship_assignments")
        .find(query)
        .sort({ date: 1 })
        .toArray();

      // Deduplicate assignments by date
      const uniqueAssignments = Array.from(
        new Map(
          assignments.map((item) => [
            item.date,
            {
              date: item.date,
              team: item.team,
              lastUpdated: item.lastUpdated,
              service: item.service || null, // Preserve special service times
            },
          ]),
        ).values(),
      );

      return NextResponse.json(uniqueAssignments);
    }

    // Get all assignments
    const assignments = await db
      .collection("worship_assignments")
      .find({})
      .sort({ date: 1 })
      .toArray();

    // Deduplicate assignments by date while preserving all fields
    const uniqueAssignments = Array.from(
      new Map(
        assignments.map((item) => [
          item.date,
          {
            date: item.date,
            team: item.team,
            lastUpdated: item.lastUpdated,
          },
        ]),
      ).values(),
    );

    // Apply limit if provided
    const finalAssignments = limit
      ? uniqueAssignments.slice(0, limit)
      : uniqueAssignments;

    return NextResponse.json(finalAssignments);
  } catch (e) {
    console.error("Error in GET /api/worship-assignments:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const formattedDate = formatDate(body.date);

    // Missing database connection
    const client = await clientPromise; // Add this line
    const db = client.db("church"); // Add this line

    const updateData = {
      date: formattedDate,
      lastUpdated: new Date().toISOString(),
      ...(body.team && { team: body.team }),
      ...(body.songsApproved !== undefined && {
        songsApproved: Boolean(body.songsApproved),
      }),
    };

    const result = await db
      .collection("worship_assignments")
      .updateOne(
        { date: formattedDate },
        { $set: updateData },
        { upsert: true },
      );

    return NextResponse.json({
      success: true,
      data: updateData,
    });
  } catch (e) {
    console.error("Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { date, songsApproved, partialApproval } = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection("assignments").updateOne(
      { date },
      {
        $set: {
          songsApproved,
          partialApproval,
          lastUpdated: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
