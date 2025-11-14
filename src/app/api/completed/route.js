import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    const completed = await db.collection("completed").find({}).toArray();

    return NextResponse.json(completed);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    const result = await db
      .collection("completed")
      .updateOne(
        { date: body.date },
        { $set: { completed: body.completed } },
        { upsert: true },
      );

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
