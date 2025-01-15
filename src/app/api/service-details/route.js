// /api/service-details/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    const details = await db.collection("serviceDetails").find({}).toArray();
    return NextResponse.json(details);
  } catch (e) {
    console.error('GET Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");
    
    // Create the update document matching MongoDB structure
    const updateDoc = {
      date: body.date,
      sermonTitle: body.sermonTitle || '',
      sermonHymn: body.sermonHymn || '',
      gospelReading: body.gospelReading || '',
      hymnOne: body.hymnOne || '',
      closingHymn: body.closingHymn || '',
      notes: body.notes || '',
      lastUpdated: new Date().toISOString()
    };

    const result = await db.collection("serviceDetails").updateOne(
      { date: body.date },
      { $set: updateDoc },
      { upsert: true }
    );

    // Return the updated document
    const updated = await db.collection("serviceDetails").findOne({ date: body.date });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('POST Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}