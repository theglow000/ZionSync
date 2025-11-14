/**
 * Override Service Calendar API Route
 *
 * Allows admin to manually override individual service details
 */

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * PATCH /api/service-calendar/override
 * Body: { year, dateString, overrides, reason, userId }
 *
 * Updates a specific service with admin overrides
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { year, dateString, overrides, reason, userId } = body;

    // Validate required fields
    if (!year || !dateString) {
      return NextResponse.json(
        { error: "Year and dateString are required" },
        { status: 400 },
      );
    }

    if (!overrides || typeof overrides !== "object") {
      return NextResponse.json(
        { error: "Overrides object is required" },
        { status: 400 },
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Override reason is required for audit trail" },
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

    // Validate allowed override fields
    const allowedOverrides = [
      "seasonName",
      "seasonColor",
      "specialDayName",
      "isActive",
    ];

    const invalidFields = Object.keys(overrides).filter(
      (key) => !allowedOverrides.includes(key),
    );

    if (invalidFields.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid override fields",
          invalidFields,
          allowedFields: allowedOverrides,
        },
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

    // Build update object
    const updateFields = {};
    Object.keys(overrides).forEach((key) => {
      updateFields[`services.${serviceIndex}.${key}`] = overrides[key];
    });

    // Mark as overridden with audit trail
    updateFields[`services.${serviceIndex}.isOverridden`] = true;
    updateFields[`services.${serviceIndex}.overrideReason`] = reason;
    updateFields[`services.${serviceIndex}.overriddenBy`] = userId || "unknown";
    updateFields[`services.${serviceIndex}.overriddenAt`] = new Date();

    // Update metadata if service was disabled
    if (overrides.isActive === false) {
      updateFields["metadata.overriddenCount"] =
        (calendar.metadata.overriddenCount || 0) + 1;
    }

    // Perform the update
    const result = await serviceCalendarCollection.updateOne(
      { year },
      { $set: updateFields },
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update service" },
        { status: 500 },
      );
    }

    console.log(`✅ Overridden service ${dateString} in year ${year}`);

    // Fetch the updated service
    const updatedCalendar = await serviceCalendarCollection.findOne({ year });
    const updatedService = updatedCalendar.services[serviceIndex];

    return NextResponse.json({
      success: true,
      message: `Successfully overridden service for ${dateString}`,
      service: {
        date: updatedService.date,
        dateString: updatedService.dateString,
        dayOfWeek: updatedService.dayOfWeek,
        season: updatedService.season,
        seasonName: updatedService.seasonName,
        seasonColor: updatedService.seasonColor,
        specialDay: updatedService.specialDay,
        specialDayName: updatedService.specialDayName,
        isOverridden: updatedService.isOverridden,
        overrideReason: updatedService.overrideReason,
        overriddenBy: updatedService.overriddenBy,
        overriddenAt: updatedService.overriddenAt,
        isActive: updatedService.isActive,
      },
    });
  } catch (error) {
    console.error("Error overriding service:", error);
    return NextResponse.json(
      { error: "Failed to override service", details: error.message },
      { status: 500 },
    );
  }
}
