import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    const signups = await db.collection("signups").find({}).toArray();
    console.log('Fetched signups:', signups); // Add this line
    return NextResponse.json(signups);
  } catch (e) {
    console.error('GET error:', e); // Add this line
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Attempting to save signup:', body); // Add this line
    const client = await clientPromise;
    const db = client.db("church");
    
    const result = await db.collection("signups").insertOne({
      date: body.date,
      name: body.name,
      timestamp: new Date()
    });
    
    console.log('Save result:', result); // Add this line
    return NextResponse.json(result);
  } catch (e) {
    console.error('POST error:', e); // Add this line
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
export async function DELETE(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");
    
    const result = await db.collection("signups").deleteOne({
      date: body.date,
      name: body.name
    });
    
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}