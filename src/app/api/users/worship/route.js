// /api/worship-users/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");

    // Get users from worship_users collection
    const users = await db.collection("worship_users").find({}).toArray();

    return NextResponse.json({
      users: users || [],
      success: true,
    });
  } catch (e) {
    console.error("Error in GET /api/worship-users:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    // Check if user already exists
    const existingUser = await db.collection("worship_users").findOne({
      name: body.name,
    });

    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Add new individual user
    const result = await db.collection("worship_users").insertOne({
      name: body.name,
      role: body.role || "team_member",
      created: new Date(),
      lastUpdated: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        name: body.name,
        role: body.role || "team_member",
        _id: result.insertedId,
      },
    });
  } catch (e) {
    console.error("Error in POST /api/worship-users:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    const result = await db.collection("worship_users").deleteOne({
      name: body.name,
    });

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount > 0,
    });
  } catch (e) {
    console.error("Error in DELETE /api/worship-users:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
