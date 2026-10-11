import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getLiturgicalInfo } from "@/lib/LiturgicalCalendarService";
import { readJsonBody } from "@/lib/apiSchemas";
import { classifyLine } from "@/lib/elementClassifier";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const client = await clientPromise;
    const db = client.db("church");

    let details;
    if (date) {
      details = await db.collection("serviceDetails").findOne({ date });
      // If we have content but no elements, parse the content
      if (details?.content && !details.elements) {
        details.elements = parseServiceContent(details.content);
        // Save the parsed elements back to the database
        await db
          .collection("serviceDetails")
          .updateOne({ date }, { $set: { elements: details.elements } });
      }

      // Add liturgical information if not already present
      if (details && !details.liturgical) {
        // Parse date string to Date object (assuming format M/D/YY)
        // For example: 1/5/25 -> January 5, 2025
        const [month, day, yearShort] = date
          .split("/")
          .map((num) => parseInt(num, 10));
        // Convert 2-digit year to 4-digit (assuming 20xx for years less than 50)
        const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
        const serviceDate = new Date(fullYear, month - 1, day); // month is 0-indexed in JS Date

        // Get liturgical information using our service
        const liturgicalInfo = getLiturgicalInfo(serviceDate);

        // Add liturgical information to the details
        details.liturgical = {
          season: liturgicalInfo.seasonId,
          seasonName: liturgicalInfo.season.name,
          color: liturgicalInfo.color,
          specialDay: liturgicalInfo.specialDayId,
          specialDayName: liturgicalInfo.specialDay?.name || null,
        };

        // Save liturgical info back to database
        await db
          .collection("serviceDetails")
          .updateOne({ date }, { $set: { liturgical: details.liturgical } });
      }

      return NextResponse.json(details || null);
    } else {
      details = await db.collection("serviceDetails").find({}).toArray();
      // Process each document
      for (let detail of details) {
        // Skip documents without a date field
        if (!detail.date) continue;

        if (detail.content && !detail.elements) {
          detail.elements = parseServiceContent(detail.content);
          // Save the parsed elements back to the database
          await db
            .collection("serviceDetails")
            .updateOne(
              { date: detail.date },
              { $set: { elements: detail.elements } },
            );
        }

        // Add liturgical information if not already present
        if (!detail.liturgical) {
          // Parse date string to Date object (assuming format M/D/YY)
          const [month, day, yearShort] = detail.date
            .split("/")
            .map((num) => parseInt(num, 10));
          // Convert 2-digit year to 4-digit
          const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
          const serviceDate = new Date(fullYear, month - 1, day);

          // Get liturgical information using our service
          const liturgicalInfo = getLiturgicalInfo(serviceDate);

          // Add liturgical information to the details
          detail.liturgical = {
            season: liturgicalInfo.seasonId,
            seasonName: liturgicalInfo.season.name,
            color: liturgicalInfo.color,
            specialDay: liturgicalInfo.specialDayId,
            specialDayName: liturgicalInfo.specialDay?.name || null,
          };

          // Save liturgical info back to database
          await db
            .collection("serviceDetails")
            .updateOne(
              { date: detail.date },
              { $set: { liturgical: detail.liturgical } },
            );
        }
      }

      return NextResponse.json(details);
    }
  } catch (e) {
    console.error("GET Error:", e);
    return NextResponse.json([]);
  }
}

// Elements for a document stored before elements existed
const parseServiceContent = (content) =>
  content.split("\n").map((line) => ({
    type: classifyLine(line),
    content: line,
    selection: null,
  }));

export async function POST(request) {
  try {
    const parsedBody = await readJsonBody(request);
    if (!parsedBody.success) return parsedBody.response;
    const body = parsedBody.data;

    if (!body.date) {
      throw new Error("Date is required");
    }

    const client = await clientPromise;
    const db = client.db("church");

    // Add liturgical information to the POST data
    if (!body.liturgical) {
      // Parse date string to Date object (assuming format M/D/YY)
      const [month, day, yearShort] = body.date
        .split("/")
        .map((num) => parseInt(num, 10));
      // Convert 2-digit year to 4-digit
      const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
      const serviceDate = new Date(fullYear, month - 1, day);

      // Get liturgical information using our service
      const liturgicalInfo = getLiturgicalInfo(serviceDate);

      // Add liturgical information to the body
      body.liturgical = {
        season: liturgicalInfo.seasonId,
        seasonName: liturgicalInfo.season.name,
        color: liturgicalInfo.color,
        specialDay: liturgicalInfo.specialDayId,
        specialDayName: liturgicalInfo.specialDay?.name || null,
      };
    }

    const updateDoc = {
      date: body.date,
      content: body.content,
      type: body.type,
      setting: body.setting,
      elements: body.elements,
      liturgical: body.liturgical,
      lastUpdated: new Date().toISOString(),
    };

    await db
      .collection("serviceDetails")
      .updateOne({ date: body.date }, { $set: updateDoc }, { upsert: true });

    // Return the updated document
    const updated = await db
      .collection("serviceDetails")
      .findOne({ date: body.date });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("POST Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  // Existing DELETE method remains unchanged
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("church");

    const result = await db.collection("serviceDetails").deleteOne({ date });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Service details not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Service details deleted successfully",
    });
  } catch (e) {
    console.error("DELETE Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
