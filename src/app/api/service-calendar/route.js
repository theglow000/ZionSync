/**
 * Service Calendar API Routes
 *
 * Endpoints for managing algorithmically-generated service dates
 */

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * GET /api/service-calendar?year=2025&includeInactive=false
 *
 * Fetch all services for a specific year from the database
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year"));
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Validate year parameter
    if (!year || isNaN(year)) {
      return NextResponse.json(
        { error: "Year parameter is required and must be a valid number" },
        { status: 400 },
      );
    }

    if (year < 2024 || year > 2100) {
      return NextResponse.json(
        { error: "Year must be between 2024 and 2100" },
        { status: 400 },
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db("church");
    const serviceCalendarCollection = db.collection("serviceCalendar");

    // Fetch services for the year
    const calendar = await serviceCalendarCollection.findOne({ year });

    if (!calendar) {
      return NextResponse.json(
        { error: `No services found for year ${year}. Generate them first.` },
        { status: 404 },
      );
    }

    // Filter services if includeInactive is false
    let services = calendar.services;
    if (!includeInactive) {
      services = services.filter(
        (s) => !s.isOverridden || s.isActive !== false,
      );
    }

    // Return services with metadata
    return NextResponse.json({
      year: calendar.year,
      services: services.map((s) => ({
        date: s.date,
        dateString: s.dateString,
        dayOfWeek: s.dayOfWeek,
        season: s.season,
        seasonName: s.seasonName,
        seasonColor: s.seasonColor,
        specialDay: s.specialDay,
        specialDayName: s.specialDayName,
        isRegularSunday: s.isRegularSunday,
        isSpecialWeekday: s.isSpecialWeekday,
        isOverridden: s.isOverridden,
        overrideReason: s.overrideReason,
      })),
      metadata: calendar.metadata,
      keyDates: calendar.keyDates,
      generatedAt: calendar.generatedAt,
      algorithmVersion: calendar.algorithmVersion,
      validated: calendar.validated,
    });
  } catch (error) {
    console.error("Error fetching service calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch service calendar", details: error.message },
      { status: 500 },
    );
  }
}
