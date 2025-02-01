import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    console.log('Fetching service details...');
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const client = await clientPromise;
    const db = client.db("church");

    // If date is provided, fetch specific document, otherwise fetch all
    let details;
    if (date) {
      details = await db.collection("serviceDetails").findOne({ date });
      console.log('Service details fetched for date:', date, details);
      return NextResponse.json(details || null);
    } else {
      details = await db.collection("serviceDetails").find({}).toArray();
      console.log('All service details fetched:', details.length, 'documents');
      return NextResponse.json(details);
    }
  } catch (e) {
    console.error('GET Error:', e);
    return NextResponse.json(null);
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
      content: body.content,
      type: body.type,
      setting: body.setting,
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