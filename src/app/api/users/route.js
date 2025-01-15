import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await clientPromise;
    console.log('Connected to MongoDB');
    const db = client.db("church");
    console.log('Accessing church database');
    const users = await db.collection("users").find({}).toArray();
    console.log('Successfully fetched users:', users.length);
    return NextResponse.json(users);
  } catch (e) {
    console.error('Error in GET /api/users:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('Attempting to add new user...');
    const body = await request.json();
    console.log('Request body:', body);
    const client = await clientPromise;
    const db = client.db("church");
    
    const result = await db.collection("users").insertOne({
      name: body.name,
      timestamp: new Date()
    });
    
    console.log('User added successfully:', result);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Error in POST /api/users:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    console.log('Attempting to delete user...');
    const body = await request.json();
    console.log('Delete request body:', body);
    const client = await clientPromise;
    const db = client.db("church");
    
    // Delete user
    const deleteUserResult = await db.collection("users").deleteOne({ name: body.name });
    console.log('User deletion result:', deleteUserResult);
    
    // Also delete all signups for this user
    const deleteSignupsResult = await db.collection("signups").deleteMany({ name: body.name });
    console.log('Related signups deletion result:', deleteSignupsResult);
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error in DELETE /api/users:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}