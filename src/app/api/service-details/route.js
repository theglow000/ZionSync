import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    console.log('Fetching service details...');
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const client = await clientPromise;
    const db = client.db("church");

    let details;
    if (date) {
      details = await db.collection("serviceDetails").findOne({ date });
      // If we have content but no elements, parse the content
      if (details?.content && !details.elements) {
        details.elements = parseServiceContent(details.content);
        // Save the parsed elements back to the database
        await db.collection("serviceDetails").updateOne(
          { date },
          { $set: { elements: details.elements } }
        );
      }
      console.log('Single service details:', {
        date,
        content: details?.content?.substring(0, 50) + '...',
        elementCount: details?.elements?.length
      });
      return NextResponse.json(details || null);
    } else {
      details = await db.collection("serviceDetails").find({}).toArray();
      // Parse any documents that have content but no elements
      for (let detail of details) {
        if (detail.content && !detail.elements) {
          detail.elements = parseServiceContent(detail.content);
          // Save the parsed elements back to the database
          await db.collection("serviceDetails").updateOne(
            { date: detail.date },
            { $set: { elements: detail.elements } }
          );
        }
      }
      console.log('All service details:', details.map(d => ({
        date: d.date,
        hasContent: !!d.content,
        elementCount: d.elements?.length
      })));
      return NextResponse.json(details);
    }
  } catch (e) {
    console.error('GET Error:', e);
    return NextResponse.json(null);
  }
}

// Update the parseServiceContent function to match
const parseServiceContent = (content) => {
  return content.split('\n').map(line => {
    let type = 'liturgy';
    const lowerLine = line.toLowerCase().trim();
    
    // Reading detection
    if (lowerLine.includes('reading:') ||
        lowerLine.includes('lesson:') ||
        lowerLine.includes('psalm:') ||
        lowerLine.includes('gospel:')) {
      type = 'reading';
    }
    // Message/Sermon detection
    else if (lowerLine.includes('sermon:') ||
             lowerLine.includes('message:') ||
             lowerLine.includes('children')) {
      type = 'message';
    }
    // Song/Hymn detection
    else if (lowerLine.includes('hymn:') ||
             lowerLine.includes('song:') ||
             lowerLine.includes('anthem:')) {
      type = 'song_hymn';
    }
    // Liturgical song detection
    else if (
      lowerLine.includes('kyrie') ||
      lowerLine.includes('alleluia') ||
      lowerLine.includes('create in me') ||
      lowerLine.includes('lamb of god') ||
      lowerLine.includes('this is the feast') ||
      lowerLine.includes('glory to god') ||
      lowerLine.includes('change my heart')
    ) {
      type = 'liturgical_song';
    }

    return {
      type,
      content: line,
      selection: null
    };
  });
};

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('POST received:', {
      date: body.date,
      hasContent: !!body.content,
      hasElements: !!body.elements,
      elementCount: body.elements?.length
    });

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
      elements: body.elements,
      lastUpdated: new Date().toISOString()
    };

    console.log('Saving document:', updateDoc);

    const result = await db.collection("serviceDetails").updateOne(
      { date: body.date },
      { $set: updateDoc },
      { upsert: true }
    );

    console.log('MongoDB update result:', result);

    // Return the updated document
    const updated = await db.collection("serviceDetails").findOne({ date: body.date });
    console.log('Updated document:', updated);
    return NextResponse.json(updated);
  } catch (e) {
    console.error('POST Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("church");

    const result = await db.collection("serviceDetails").deleteOne({ date });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Service details not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service details deleted successfully' });
  } catch (e) {
    console.error('DELETE Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}