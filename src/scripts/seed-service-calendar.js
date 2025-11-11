/**
 * Seed Database with Generated Service Dates
 * 
 * This script generates service dates algorithmically and stores them
 * in the serviceCalendar collection. Run this to replace hardcoded DATES_2025.
 * 
 * Usage: node src/scripts/seed-service-calendar.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

import clientPromise from '../lib/mongodb.js';
import { generateServicesForYear } from '../lib/ServiceGenerator.js';

async function seedServiceCalendar() {
  console.log('🌱 Seeding Service Calendar Database...\n');
  
  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db('zionsync');
    const serviceCalendarCollection = db.collection('serviceCalendar');
    console.log('✅ Connected to MongoDB\n');
    
    // Generate services for 2025
    console.log('📅 Generating services for 2025...');
    const yearData = generateServicesForYear(2025);
    
    console.log(`   Generated ${yearData.services.length} services`);
    console.log(`   - Regular Sundays: ${yearData.metadata.regularSundays}`);
    console.log(`   - Special Weekdays: ${yearData.metadata.specialWeekdays}`);
    console.log(`   - Validation: ${yearData.validated ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!yearData.validated) {
      console.error('\n❌ Validation failed:');
      yearData.validationErrors.forEach(error => console.error(`   - ${error}`));
      return;
    }
    
    if (yearData.validationWarnings && yearData.validationWarnings.length > 0) {
      console.warn('\n⚠️  Validation warnings:');
      yearData.validationWarnings.forEach(warning => console.warn(`   - ${warning}`));
    }
    
    // Check if 2025 already exists
    const existing = await serviceCalendarCollection.findOne({ year: 2025 });
    
    if (existing) {
      console.log('\n⚠️  2025 already exists in database');
      console.log('   Deleting old data...');
      await serviceCalendarCollection.deleteOne({ year: 2025 });
    }
    
    // Save to database
    console.log('\n💾 Saving to database...');
    const calendar = {
      year: yearData.year,
      generatedAt: yearData.generatedAt,
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
        isOverridden: service.isOverridden,
        overrideReason: service.overrideReason,
        overriddenBy: service.overriddenBy,
        overriddenAt: service.overriddenAt
      })),
      keyDates: yearData.keyDates,
      metadata: yearData.metadata,
      validated: yearData.validated,
      validationErrors: yearData.validationErrors
    };
    
    await serviceCalendarCollection.insertOne(calendar);
    console.log('✅ Saved to serviceCalendar collection\n');
    
    // Display summary
    console.log('📊 SERVICE CALENDAR SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Year: ${calendar.year}`);
    console.log(`Total Services: ${calendar.metadata.totalServices}`);
    console.log(`Regular Sundays: ${calendar.metadata.regularSundays}`);
    console.log(`Special Weekdays: ${calendar.metadata.specialWeekdays}`);
    console.log(`Algorithm Version: ${calendar.algorithmVersion}`);
    console.log(`Generated: ${calendar.generatedAt.toLocaleString()}`);
    console.log('=' .repeat(60));
    
    // Display key dates
    console.log('\n🗓️  KEY LITURGICAL DATES FOR 2025');
    console.log('=' .repeat(60));
    
    const keyDatesDisplay = [
      { label: 'Advent Starts', key: 'adventStart' },
      { label: 'Christmas Eve', key: 'christmasEve' },
      { label: 'Christmas Day', key: 'christmasDay' },
      { label: 'Epiphany', key: 'epiphany' },
      { label: 'Ash Wednesday', key: 'ashWednesday' },
      { label: 'Palm Sunday', key: 'palmSunday' },
      { label: 'Maundy Thursday', key: 'maundyThursday' },
      { label: 'Good Friday', key: 'goodFriday' },
      { label: 'Easter Sunday', key: 'easter' },
      { label: 'Ascension', key: 'ascension' },
      { label: 'Pentecost', key: 'pentecost' },
      { label: 'Trinity Sunday', key: 'trinity' },
      { label: 'Reformation Sunday', key: 'reformationSunday' },
      { label: 'All Saints Day', key: 'allSaintsDay' },
      { label: 'Christ the King', key: 'christTheKing' }
    ];
    
    keyDatesDisplay.forEach(({ label, key }) => {
      if (calendar.keyDates[key]) {
        const date = calendar.keyDates[key];
        const formatted = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        console.log(`${label.padEnd(22)}: ${formatted}`);
      }
    });
    
    console.log('=' .repeat(60));
    
    // Display first few services
    console.log('\n📝 FIRST 10 SERVICES');
    console.log('=' .repeat(60));
    
    calendar.services.slice(0, 10).forEach((service, index) => {
      const dateStr = service.date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const dayOfWeek = service.dayOfWeek.padEnd(9);
      const seasonName = service.seasonName.padEnd(15);
      const specialDay = service.specialDayName || '—';
      
      console.log(`${(index + 1).toString().padStart(2)}. ${dateStr.padEnd(8)} ${dayOfWeek} ${seasonName} ${specialDay}`);
    });
    
    console.log('   ...');
    console.log('=' .repeat(60));
    
    console.log('\n✅ SEED COMPLETE - 2025 services ready!\n');
    console.log('💡 Next steps:');
    console.log('   1. Update API to fetch from database instead of DATES_2025');
    console.log('   2. Create admin UI to manage service overrides');
    console.log('   3. Generate additional years (2026, 2027, etc.)');
    console.log('   4. Deprecate hardcoded DATES_2025 array\n');
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connection
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  seedServiceCalendar();
}

export default seedServiceCalendar;
