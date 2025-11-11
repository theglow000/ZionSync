import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/service-dates?year={year}&upcomingOnly={true|false}
 * 
 * Bridge endpoint that fetches service dates from serviceCalendar collection (Sprint 4.1)
 * This endpoint does NOT modify serviceDetails collection (critical - polling depends on it)
 * 
 * Components will merge this data with serviceDetails data client-side
 * 
 * Query Parameters:
 * - year (required): Year to fetch services for (2024-2100)
 * - upcomingOnly (optional): If true, filter for dates >= today
 * 
 * Returns: Array of service objects with liturgical metadata
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const upcomingOnly = searchParams.get('upcomingOnly') === 'true';
    
    // Validate year parameter
    const year = parseInt(yearParam);
    if (!year || isNaN(year) || year < 2024 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year parameter. Must be between 2024 and 2100.' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("church");
    
    // Fetch from serviceCalendar collection (Sprint 4.1)
    const calendar = await db.collection("serviceCalendar")
      .findOne({ year });
    
    // Return 404 if year not generated yet
    if (!calendar) {
      return NextResponse.json(
        { 
          error: `Services for ${year} have not been generated yet.`,
          message: 'Please generate services in Settings > Calendar Manager.',
          year
        },
        { status: 404 }
      );
    }
    
    let services = calendar.services || [];
    
    // Optional: Filter for upcoming services only
    if (upcomingOnly && services.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      services = services.filter(service => {
        try {
          // Parse date string (format: M/D/YY)
          const [month, day, yearShort] = service.dateString.split('/').map(num => parseInt(num, 10));
          const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
          const serviceDate = new Date(fullYear, month - 1, day);
          serviceDate.setHours(0, 0, 0, 0);
          
          return serviceDate >= today;
        } catch (error) {
          console.error('Error parsing service date:', service.dateString, error);
          return false;
        }
      });
    }
    
    // Format response for compatibility with components
    // Components expect: { date, day, title, liturgical, type }
    const formattedServices = services.map(service => ({
      date: service.dateString,          // e.g., "1/5/25"
      day: service.dayOfWeek,            // e.g., "Sunday"
      title: service.specialDayName || service.seasonName || 'Sunday Worship',
      liturgical: {
        season: service.season,          // e.g., "EPIPHANY"
        seasonName: service.seasonName,  // e.g., "Epiphany"
        color: service.seasonColor,      // e.g., "#118AB2"
        specialDay: service.specialDay,  // e.g., "BAPTISM_OF_OUR_LORD"
        specialDayName: service.specialDayName // e.g., "Baptism of Our Lord"
      },
      type: service.isSpecialWeekday ? 'special' : 'regular',
      isSpecialWeekday: service.isSpecialWeekday,
      isRegularSunday: service.isRegularSunday
    }));
    
    return NextResponse.json(formattedServices);
    
  } catch (error) {
    console.error('Error fetching service dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service dates', details: error.message },
      { status: 500 }
    );
  }
}
