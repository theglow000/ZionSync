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
    console.log('Saving service details...');
    const body = await request.json();
    console.log('Request body:', body);
    
    const client = await clientPromise;
    const db = client.db("church");
    
    // Upsert: Update if exists, insert if doesn't
    const result = await db.collection("serviceDetails").updateOne(
      { date: body.date },
      { $set: {
          date: body.date,
          sermonTitle: body.sermonTitle || '',
          gospelReading: body.gospelReading || '',
          hymnOne: body.hymnOne || '',
          sermonHymn: body.sermonHymn || '',
          closingHymn: body.closingHymn || '',
          notes: body.notes || '',
          completed: body.completed,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log('Update result:', result);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Error saving service details:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}