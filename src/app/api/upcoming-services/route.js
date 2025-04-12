import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getLiturgicalInfo } from '@/lib/LiturgicalCalendarService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 8; // Default to 8 upcoming services
    
    const client = await clientPromise;
    const db = client.db("church");
    
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    
    // Parse today's date to MM/DD/YY format for string comparison
    const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear() % 100}`;
    
    console.log('Looking for services after date:', todayFormatted);
    
    // Query the serviceDetails collection for upcoming services
    // This matches your actual collection name from the investigation
    const allServices = await db.collection("serviceDetails")
      .find({})
      .toArray();
    
    console.log(`Found ${allServices.length} total services in serviceDetails collection`);
    
    // Filter for dates on or after today - we need to manually compare date strings
    // because MongoDB can't do proper date comparison when they're stored as strings
    let upcomingServices = allServices
      .filter(service => {
        // Ensure we have a date
        if (!service.date) return false;
        
        // Parse date strings and convert to comparable format
        try {
          const serviceParts = service.date.split('/').map(p => parseInt(p, 10));
          const todayParts = todayFormatted.split('/').map(p => parseInt(p, 10));
          
          // Format: [month, day, year]
          if (serviceParts.length !== 3 || todayParts.length !== 3) return false;
          
          // Compare years first
          if (serviceParts[2] > todayParts[2]) return true;
          if (serviceParts[2] < todayParts[2]) return false;
          
          // Years are equal, compare months
          if (serviceParts[0] > todayParts[0]) return true;
          if (serviceParts[0] < todayParts[0]) return false;
          
          // Months are equal, compare days
          return serviceParts[1] >= todayParts[1];
        } catch (e) {
          console.error('Error comparing dates:', service.date, e);
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by date, converting string dates to comparable values
        try {
          const aParts = a.date.split('/').map(p => parseInt(p, 10));
          const bParts = b.date.split('/').map(p => parseInt(p, 10));
          
          // Compare years first
          if (aParts[2] !== bParts[2]) return aParts[2] - bParts[2];
          // Then months
          if (aParts[0] !== bParts[0]) return aParts[0] - bParts[0];
          // Then days
          return aParts[1] - bParts[1];
        } catch (e) {
          console.error('Error sorting dates:', a.date, b.date, e);
          return 0;
        }
      })
      .slice(0, limit);
    
    console.log(`Found ${upcomingServices.length} upcoming services`);
    if (upcomingServices.length > 0) {
      console.log("First 3 upcoming services:", upcomingServices.slice(0, 3).map(s => s.date));
    }
    
    // Format the services for the frontend
    const formattedServices = upcomingServices.map(service => {
      return {
        date: service.date,
        title: service.title || `${service.liturgical?.seasonName || 'Sunday'} Service - ${service.date}`,
        liturgical: service.liturgical || null,
        type: service.type || 'regular',
        elements: service.elements || []
      };
    });
    
    return NextResponse.json(formattedServices);
  } catch (e) {
    console.error('Error in GET /api/upcoming-services:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}