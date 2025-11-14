import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    const users = await db.collection("av_users").find({}).toArray();
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

    // Check if user already exists
    const existingUser = await db
      .collection("av_users")
      .findOne({ name: body.name });
    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Add new user
    const result = await db.collection("av_users").insertOne({
      name: body.name,
      timestamp: new Date(),
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

    // Delete user from av_users collection
    const deleteUserResult = await db.collection("av_users").deleteOne({
      name: body.name,
    });

    // Clean up any assignments for this user across all positions
    const deleteAssignmentsResult = await db
      .collection("av_assignments")
      .updateMany(
        {
          $or: [
            { team_member_1: body.name },
            { team_member_2: body.name },
            { team_member_3: body.name },
          ],
        },
        {
          $set: {
            team_member_1: null,
            team_member_2: null,
            team_member_3: null,
            lastUpdated: new Date(),
          },
        },
      );

    return NextResponse.json({
      success: true,
      deleted: deleteUserResult.deletedCount > 0,
      assignmentsUpdated: deleteAssignmentsResult.modifiedCount,
    });
  } catch (e) {
    console.error("Error in DELETE /api/av-users:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
