import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const client = await clientPromise;
    const db = client.db("church");

    // If includeDeleted is true, get all users; otherwise only get active users
    const query = includeDeleted ? {} : { deleted: { $ne: true } };
    const users = await db.collection("av_users").find(query).toArray();

    return NextResponse.json(users);
  } catch (e) {
    console.error("Error in GET /api/av-users:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    // Check if user already exists (including deleted users)
    const existingUser = await db
      .collection("av_users")
      .findOne({ name: body.name });

    if (existingUser) {
      // If user was previously deleted, reactivate them
      if (existingUser.deleted) {
        await db.collection("av_users").updateOne(
          { name: body.name },
          {
            $set: { deleted: false },
            $unset: { deletedAt: "" },
          },
        );
        return NextResponse.json({ ...existingUser, deleted: false });
      }
      return NextResponse.json(existingUser);
    }

    // Add new user
    const result = await db.collection("av_users").insertOne({
      name: body.name,
      timestamp: new Date(),
      deleted: false,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("Error in POST /api/av-users:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    // Soft delete: Mark user as deleted instead of removing them
    const deleteUserResult = await db.collection("av_users").updateOne(
      { name: body.name },
      {
        $set: {
          deleted: true,
          deletedAt: new Date(),
        },
      },
    );

    // Get current date for comparison (set to start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Clean up any assignments for this user - only remove from FUTURE service dates
    // We preserve past assignments for historical record keeping
    const assignments = await db
      .collection("av_assignments")
      .find({
        $or: [
          { team_member_1: body.name },
          { team_member_2: body.name },
          { team_member_3: body.name },
        ],
      })
      .toArray();

    let assignmentsUpdated = 0;

    // Update each assignment individually to only clear the specific position
    for (const assignment of assignments) {
      // Parse the date string (format: "MM/DD/YY")
      const [month, day, year] = assignment.date.split("/").map(Number);
      const assignmentDate = new Date(2000 + year, month - 1, day);
      assignmentDate.setHours(0, 0, 0, 0);

      // Only clear if this is a future date (today or later)
      if (assignmentDate >= today) {
        const updateFields = { lastUpdated: new Date() };

        if (assignment.team_member_1 === body.name) {
          updateFields.team_member_1 = null;
        }
        if (assignment.team_member_2 === body.name) {
          updateFields.team_member_2 = null;
        }
        if (assignment.team_member_3 === body.name) {
          updateFields.team_member_3 = null;
        }

        await db
          .collection("av_assignments")
          .updateOne({ _id: assignment._id }, { $set: updateFields });
        assignmentsUpdated++;
      }
      // else: Skip past dates to preserve historical record
    }

    return NextResponse.json({
      success: true,
      deleted: deleteUserResult.deletedCount > 0,
      assignmentsUpdated: assignmentsUpdated,
    });
  } catch (e) {
    console.error("Error in DELETE /api/av-users:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
