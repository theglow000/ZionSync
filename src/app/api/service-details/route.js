import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Fetching service details...');
    const client = await clientPromise;
    const db = client.db("church");
    const details = await db.collection("serviceDetails").find({}).toArray();
    console.log('Service details fetched:', details);
    return NextResponse.json(details);
  } catch (e) {
    console.error('Error fetching service details:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received update request:', body);
    
    if (!body.date) {
      throw new Error('Date is required');
    }

    const client = await clientPromise;
    const db = client.db("church");
    
    // Create a clean update document with only the fields we want to store
    const updateDoc = {
      date: body.date,
      sermonTitle: body.sermonTitle || '',
      gospelReading: body.gospelReading || '',
      hymnOne: body.hymnOne || '',
      sermonHymn: body.sermonHymn || '',
      closingHymn: body.closingHymn || '',
      notes: body.notes || '',
      lastUpdated: new Date()
    };

    // Use replaceOne instead of updateOne to ensure clean document state
    const result = await db.collection("serviceDetails").replaceOne(
      { date: body.date },
      updateDoc,
      { upsert: true }
    );

    console.log('Update result:', result);
    
    // Return the updated document
    const updated = await db.collection("serviceDetails").findOne({ date: body.date });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Error saving service details:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}