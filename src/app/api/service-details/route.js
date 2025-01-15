// in /api/service-details/route.js
export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");
    
    // Log the incoming data
    console.log('Attempting to save service details:', {
      date: body.date,
      fields: Object.keys(body)
    });

    // First, check if a document exists for this date
    const existing = await db.collection("serviceDetails").findOne({ date: body.date });
    console.log('Existing document:', existing);
    
    const result = await db.collection("serviceDetails").updateOne(
      { date: body.date },
      { $set: {
          date: body.date,
          sermonTitle: body.sermonTitle,
          gospelReading: body.gospelReading,
          hymnOne: body.hymnOne,
          sermonHymn: body.sermonHymn,
          closingHymn: body.closingHymn,
          notes: body.notes
        }
      },
      { upsert: true }
    );

    // Verify what was saved
    const savedDoc = await db.collection("serviceDetails").findOne({ date: body.date });
    console.log('Document after save:', savedDoc);
    
    return NextResponse.json(result);
  } catch (e) {
    console.error('Error in service-details POST:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    
    // Log the query operation
    console.log('Fetching all service details');
    const details = await db.collection("serviceDetails").find({}).toArray();
    console.log('Found service details:', details.length, 'documents');
    console.log('Sample document:', details[0]);
    
    return NextResponse.json(details);
  } catch (e) {
    console.error('Error in service-details GET:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}