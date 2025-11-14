import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * GET /api/service-calendar/available-years
 * Returns array of years for which service calendars have been generated
 * Used by year selector to show available options
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");

    // Query serviceCalendar collection for all years
    const calendars = await db
      .collection("serviceCalendar")
      .find({}, { projection: { year: 1, _id: 0 } })
      .sort({ year: 1 })
      .toArray();

    // Extract just the year numbers
    const years = calendars.map((cal) => cal.year);

    return NextResponse.json(years);
  } catch (error) {
    console.error("Error fetching available years:", error);
    return NextResponse.json(
      { error: "Failed to fetch available years" },
      { status: 500 },
    );
  }
}
