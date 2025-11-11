/**
 * Validate Service Calendar API Route
 * 
 * Validates existing services against the algorithm to detect discrepancies
 */

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateServicesForYear } from '@/lib/ServiceGenerator';

/**
 * GET /api/service-calendar/validate?year=2025
 * 
 * Validates stored services against freshly generated services
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year'));

    // Validate year parameter
    if (!year || isNaN(year)) {
      return NextResponse.json(
        { error: 'Year parameter is required and must be a valid number' },
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

    // Fetch existing services
    const existingCalendar = await serviceCalendarCollection.findOne({ year });

    if (!existingCalendar) {
      return NextResponse.json(
        { error: `No services found for year ${year}. Generate them first.` },
        { status: 404 }
      );
    }

    // Generate fresh services using current algorithm
    console.log(`Validating services for ${year}...`);
    const freshData = generateServicesForYear(year);

    // Compare stored vs generated
    const issues = [];
    const warnings = [];

    // Check service count
    if (existingCalendar.services.length !== freshData.services.length) {
      issues.push({
        type: 'SERVICE_COUNT_MISMATCH',
        message: `Service count mismatch: stored=${existingCalendar.services.length}, expected=${freshData.services.length}`
      });
    }

    // Check each service date
    const storedDates = new Set(existingCalendar.services.map(s => s.dateString));
    const expectedDates = new Set(freshData.services.map(s => s.dateString));

    // Find missing dates (in generated but not stored)
    freshData.services.forEach(generated => {
      if (!storedDates.has(generated.dateString)) {
        issues.push({
          type: 'MISSING_SERVICE',
          date: generated.dateString,
          message: `Missing service: ${generated.dateString} (${generated.specialDayName || generated.seasonName})`
        });
      }
    });

    // Find extra dates (in stored but not generated)
    existingCalendar.services.forEach(stored => {
      if (!expectedDates.has(stored.dateString) && !stored.isOverridden) {
        warnings.push({
          type: 'EXTRA_SERVICE',
          date: stored.dateString,
          message: `Extra service not in algorithm: ${stored.dateString}`
        });
      }
    });

    // Check liturgical metadata for matching dates
    existingCalendar.services.forEach(stored => {
      const generated = freshData.services.find(g => g.dateString === stored.dateString);
      
      if (generated) {
        // Check if season matches
        if (stored.season !== generated.season && !stored.isOverridden) {
          warnings.push({
            type: 'SEASON_MISMATCH',
            date: stored.dateString,
            message: `Season mismatch on ${stored.dateString}: stored="${stored.season}", expected="${generated.season}"`
          });
        }

        // Check if special day matches
        if (stored.specialDay !== generated.specialDay && !stored.isOverridden) {
          warnings.push({
            type: 'SPECIAL_DAY_MISMATCH',
            date: stored.dateString,
            message: `Special day mismatch on ${stored.dateString}: stored="${stored.specialDay}", expected="${generated.specialDay}"`
          });
        }
      }
    });

    // Check key dates
    Object.keys(freshData.keyDates).forEach(key => {
      const storedDate = existingCalendar.keyDates?.[key];
      const expectedDate = freshData.keyDates[key];
      
      if (storedDate && expectedDate) {
        const storedStr = new Date(storedDate).toDateString();
        const expectedStr = expectedDate.toDateString();
        
        if (storedStr !== expectedStr) {
          issues.push({
            type: 'KEY_DATE_MISMATCH',
            keyDate: key,
            message: `Key date mismatch for ${key}: stored="${storedStr}", expected="${expectedStr}"`
          });
        }
      }
    });

    // Check algorithm version
    if (existingCalendar.algorithmVersion !== freshData.algorithmVersion) {
      warnings.push({
        type: 'ALGORITHM_VERSION_MISMATCH',
        message: `Algorithm version changed: stored="${existingCalendar.algorithmVersion}", current="${freshData.algorithmVersion}"`
      });
    }

    // Determine overall validation status
    const isValid = issues.length === 0;
    const hasWarnings = warnings.length > 0;

    return NextResponse.json({
      year,
      valid: isValid,
      issues,
      warnings,
      summary: {
        storedServices: existingCalendar.services.length,
        expectedServices: freshData.services.length,
        overriddenServices: existingCalendar.services.filter(s => s.isOverridden).length,
        issueCount: issues.length,
        warningCount: warnings.length
      },
      recommendation: isValid && !hasWarnings
        ? 'Services are accurate and up to date'
        : issues.length > 0
        ? 'Critical issues found. Regenerate services to fix.'
        : 'Minor warnings found. Review and regenerate if needed.',
      storedGeneratedAt: existingCalendar.generatedAt,
      storedAlgorithmVersion: existingCalendar.algorithmVersion,
      currentAlgorithmVersion: freshData.algorithmVersion
    });

  } catch (error) {
    console.error('Error validating service calendar:', error);
    return NextResponse.json(
      { error: 'Failed to validate service calendar', details: error.message },
      { status: 500 }
    );
  }
}
