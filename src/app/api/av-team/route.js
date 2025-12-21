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
      // Build query with composite key: date + serviceTime
      const query = { date: body.date };
      if (body.serviceTime) {
        query.serviceTime = body.serviceTime;
      } else {
        // For regular services, ensure serviceTime is null
        query.serviceTime = null;
      }

      const updateFields = {
        [`team_member_${body.position}`]: body.name,
        lastUpdated: new Date(),
      };

      // Ensure serviceTime is stored (null for regular services)
      if (body.serviceTime) {
        updateFields.serviceTime = body.serviceTime;
      } else {
        updateFields.serviceTime = null;
      }

      const result = await db
        .collection("av_assignments")
        .updateOne(query, { $set: updateFields }, { upsert: true });
      return NextResponse.json(result);
    }

    if (body.type === "completed") {
      // Completed status can also be per service time
      const query = { date: body.date };
      if (body.serviceTime) {
        query.serviceTime = body.serviceTime;
      } else {
        query.serviceTime = null;
      }

      const result = await db.collection("av_completed").updateOne(
        query,
        {
          $set: {
            completed: body.completed,
            serviceTime: body.serviceTime || null,
          },
        },
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

export async function DELETE(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    // Build query with composite key: date + serviceTime
    const query = { date: body.date };
    if (body.serviceTime) {
      query.serviceTime = body.serviceTime;
    } else {
      query.serviceTime = null;
    }

    // Delete assignment for this specific service time
    const assignmentResult = await db
      .collection("av_assignments")
      .deleteOne(query);

    // Delete completed status for this specific service time
    const completedResult = await db
      .collection("av_completed")
      .deleteOne(query);

    return NextResponse.json({
      deletedAssignments: assignmentResult.deletedCount,
      deletedCompleted: completedResult.deletedCount,
    });
  } catch (e) {
    console.error("Error in DELETE /api/av-team:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
