import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");

    // Get base team members
    const teamMembers = await db
      .collection("av_team_members")
      .find({})
      .toArray();

    // Get assignments
    const assignments = await db
      .collection("av_assignments")
      .find({})
      .toArray();

    // Get completed status
    const completed = await db.collection("av_completed").find({}).toArray();

    return NextResponse.json({
      teamMembers,
      assignments,
      completed,
    });
  } catch (e) {
    console.error("Error in GET /api/av-team:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    if (body.type === "signup") {
      const result = await db.collection("av_assignments").updateOne(
        { date: body.date },
        {
          $set: {
            [`team_member_${body.position}`]: body.name,
            lastUpdated: new Date(),
          },
        },
        { upsert: true },
      );
      return NextResponse.json(result);
    }

    if (body.type === "completed") {
      const result = await db
        .collection("av_completed")
        .updateOne(
          { date: body.date },
          { $set: { completed: body.completed } },
          { upsert: true },
        );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid request type" },
      { status: 400 },
    );
  } catch (e) {
    console.error("Error in POST /api/av-team:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
