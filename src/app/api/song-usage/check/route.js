import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const dateStr = searchParams.get('date');
    
    if (!title || !dateStr) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }
    
    // Parse the date parts
    let dateToCheck;
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/').map(Number);
      dateToCheck = new Date(2000 + year, month - 1, day);
    } else {
      dateToCheck = new Date(dateStr);
    }
    
    // Set to start and end of day for range query
    const startOfDay = new Date(dateToCheck);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateToCheck);
    endOfDay.setHours(23, 59, 59, 999);
    
    const client = await clientPromise;
    const db = client.db("church");
    
    // Check if this song is already recorded for this date
    const existingRecord = await db.collection("song_usage").findOne({
      title: title,
      "uses.dateUsed": {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    return NextResponse.json({ 
      exists: !!existingRecord,
      title,
      date: dateStr
    });
  } catch (e) {
    console.error('Error checking song usage:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
