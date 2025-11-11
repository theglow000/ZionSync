import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Add PUT method for updating existing services
export async function PUT(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    // Ensure we have an ID
    if (!body.id) {
      throw new Error('Service ID is required');
    }

    const updateDoc = {
      name: body.name,
      elements: body.elements,
      order: body.order,
      template: body.elements.map(el => el.content).join('\n'),
      updatedAt: new Date()
    };

    const result = await db.collection("custom_services").updateOne(
      { id: body.id },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Return the updated document
    const updated = await db.collection("custom_services").findOne({ id: body.id });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Error in PUT /api/custom-services:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET custom services
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    const services = await db.collection("custom_services").find({}).toArray();
    return NextResponse.json(services);
  } catch (e) {
    console.error('Error in GET /api/custom-services:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Update POST method to include better error handling
export async function POST(request) {
  try {
    const body = await request.json();

    const serviceDoc = {
      id: body.id,
      name: body.name,
      elements: body.elements,
      order: body.order,
      template: body.template,
      createdAt: new Date()
    };

    const client = await clientPromise;
    const db = client.db("church");
    const result = await db.collection("custom_services").insertOne(serviceDoc);

    // Important: Return the complete document
    return NextResponse.json({
      ...serviceDoc,
      _id: result.insertedId
    });
  } catch (e) {
    console.error('Error in POST /api/custom-services:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE custom service
export async function DELETE(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("church");

    const result = await db.collection("custom_services").deleteOne({
      id: body.id // Use the string ID we created in POST
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (e) {
    console.error('Error in DELETE /api/custom-services:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}