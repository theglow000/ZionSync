import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    const details = await db.collection("serviceDetails").find({}).toArray();
    
    return NextResponse.json(details);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");
    
    // Upsert: Update if exists, insert if doesn't
    const result = await db.collection("serviceDetails").updateOne(
      { date: body.date },
      { $set: {
          date: body.date,
          sermonTitle: body.sermonTitle,
          gospelReading: body.gospelReading,
          hymnOne: body.hymnOne,
          sermonHymn: body.sermonHymn,
          closingHymn: body.closingHymn,
          notes: body.notes,
          completed: body.completed
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}