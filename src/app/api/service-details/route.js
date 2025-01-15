import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Fetching service details...');
    const client = await clientPromise;
    const db = client.db("church");
    const details = await db.collection("serviceDetails").find({}).toArray();
    console.log('Service details fetched:', details.length, 'documents');
    return NextResponse.json(details);
  } catch (e) {
    console.error('GET Error:', e);
    return NextResponse.json([]);  // Return empty array on error
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received update:', body);
    
    if (!body.date) {
      throw new Error('Date is required');
    }

    const client = await clientPromise;
    const db = client.db("church");
    
    const updateDoc = {
      date: body.date,
      sermonTitle: body.sermonTitle || '',
      gospelReading: body.gospelReading || '',
      hymnOne: body.hymnOne || '',
      sermonHymn: body.sermonHymn || '',
      closingHymn: body.closingHymn || '',
      notes: body.notes || '',
      lastUpdated: new Date().toISOString()
    };

    await db.collection("serviceDetails").updateOne(
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