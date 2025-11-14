/**
 * Revert Service Calendar API Route
 *
 * Reverts a single service back to its original liturgical calendar state
 */

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getLiturgicalInfo } from "@/lib/LiturgicalCalendarService";

/**
 * POST /api/service-calendar/revert
 * Body: { year, dateString }
 *
 * Reverts a specific service to its original calculated state
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { year, dateString } = body;

    // Validate required fields
    if (!year || !dateString) {
      return NextResponse.json(
        { error: "Year and dateString are required" },
        { status: 400 },
      );
    }

    // Validate year
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

    // Find the calendar year
    const calendar = await serviceCalendarCollection.findOne({ year });

    if (!calendar) {
      return NextResponse.json(
        { error: `No services found for year ${year}` },
        { status: 404 },
      );
    }

    // Find the specific service
    const serviceIndex = calendar.services.findIndex(
      (s) => s.dateString === dateString,
    );

    if (serviceIndex === -1) {
      return NextResponse.json(
        { error: `Service not found for date ${dateString} in year ${year}` },
        { status: 404 },
      );
    }

    // Regenerate just this one service using LiturgicalCalendarService
    // Use the existing date object from the service (already a proper Date)
    const existingService = calendar.services[serviceIndex];
    const serviceDate = new Date(existingService.date);

    const liturgicalInfo = getLiturgicalInfo(serviceDate);

    if (!liturgicalInfo) {
      return NextResponse.json(
        { error: "Could not regenerate original service data" },
        { status: 500 },
      );
    }

    // Build the reverted service object matching ServiceGenerator format
    const dayOfWeek = serviceDate.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    const isSpecialWeekday = dayOfWeek !== "Sunday";

    const revertedService = {
      date: serviceDate,
      dateString: dateString,
      dayOfWeek: dayOfWeek,
      season: liturgicalInfo.seasonId,
      seasonName: liturgicalInfo.season.name,
      seasonColor: liturgicalInfo.color,
      specialDay: liturgicalInfo.specialDayId || null,
      specialDayName: liturgicalInfo.specialDay
        ? liturgicalInfo.specialDay.name
        : null,
      isRegularSunday: !isSpecialWeekday,
      isSpecialWeekday: isSpecialWeekday,
      elements: calendar.services[serviceIndex].elements || [], // Keep existing elements/songs
      isActive: true,
      isOverridden: false,
      overrideReason: null,
      overriddenBy: null,
      overriddenAt: null,
    };

    // Update just this one service
    const updateResult = await serviceCalendarCollection.updateOne(
      { year },
      { $set: { [`services.${serviceIndex}`]: revertedService } },
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to revert service" },
        { status: 500 },
      );
    }

    console.log(
      `✅ Reverted service ${dateString} in year ${year} to original state`,
    );

    return NextResponse.json({
      success: true,
      message: `Successfully reverted service for ${dateString}`,
      service: revertedService,
    });
  } catch (error) {
    console.error("Error reverting service:", error);
    return NextResponse.json(
      { error: "Failed to revert service", details: error.message },
      { status: 500 },
    );
  }
}
