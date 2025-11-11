/**
 * Generate Service Calendar API Route
 * 
 * Generates services for a specific year using the ServiceGenerator algorithm
 */

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateServicesForYear } from '@/lib/ServiceGenerator';

/**
 * POST /api/service-calendar/generate
 * Body: { year: 2025, overwrite: false }
 * 
 * Generates services for a year and saves to database
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { year, overwrite = false } = body;

    // Validate year
    if (!year || typeof year !== 'number') {
      return NextResponse.json(
        { error: 'Year is required and must be a number' },
        { status: 400 }
      );
    }

    if (year < 2024 || year > 2100) {
      return NextResponse.json(
        { error: 'Year must be between 2024 and 2100' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db("church");
    const serviceCalendarCollection = db.collection('serviceCalendar');

    // Check if year already exists
    const existing = await serviceCalendarCollection.findOne({ year });
    
    if (existing && !overwrite) {
      return NextResponse.json(
        { 
          error: `Services for year ${year} already exist. Set overwrite=true to replace them.`,
          existingServices: existing.metadata.totalServices,
          generatedAt: existing.generatedAt
        },
        { status: 409 }
      );
    }

    // Generate services using the algorithm
    console.log(`Generating services for ${year}...`);
    const yearData = generateServicesForYear(year);

    if (!yearData.validated) {
      return NextResponse.json(
        { 
          error: 'Generated services failed validation',
          validationErrors: yearData.validationErrors,
          validationWarnings: yearData.validationWarnings
        },
        { status: 500 }
      );
    }

    // Prepare document for database
    const calendarDocument = {
      year: yearData.year,
      generatedAt: new Date(),
      algorithmVersion: yearData.algorithmVersion,
      services: yearData.services.map(service => ({
        date: service.date,
        dateString: service.dateString,
        dayOfWeek: service.dayOfWeek,
        season: service.season,
        seasonName: service.seasonName,
        seasonColor: service.seasonColor,
        specialDay: service.specialDay,
        specialDayName: service.specialDayName,
        isRegularSunday: service.isRegularSunday,
        isSpecialWeekday: service.isSpecialWeekday,
        isOverridden: false,
        overrideReason: null,
        overriddenBy: null,
        overriddenAt: null
      })),
      keyDates: yearData.keyDates,
      metadata: yearData.metadata,
      validated: yearData.validated,
      validationErrors: yearData.validationErrors || []
    };

    // Save to database (upsert if overwriting)
    if (overwrite && existing) {
      await serviceCalendarCollection.replaceOne(
        { year },
        calendarDocument
      );
      console.log(`✅ Replaced services for ${year}`);
    } else {
      await serviceCalendarCollection.insertOne(calendarDocument);
      console.log(`✅ Created services for ${year}`);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully generated ${yearData.metadata.totalServices} services for ${year}`,
      year: yearData.year,
      metadata: yearData.metadata,
      keyDates: Object.keys(yearData.keyDates).reduce((acc, key) => {
        acc[key] = yearData.keyDates[key]?.toDateString();
        return acc;
      }, {}),
      generatedAt: calendarDocument.generatedAt,
      overwritten: overwrite && existing !== null
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating service calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate service calendar', details: error.message },
      { status: 500 }
    );
  }
}
