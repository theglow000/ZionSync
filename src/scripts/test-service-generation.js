/**
 * Test Service Generation (Without Database)
 * 
 * This script tests the ServiceGenerator to verify it produces correct results
 * without needing database connectivity.
 * 
 * Usage: node src/scripts/test-service-generation.js
 */

import { generateServicesForYear } from '../lib/ServiceGenerator.js';

console.log('🧪 Testing Service Generation Algorithm...\n');

try {
  // Generate services for 2025
  console.log('📅 Generating services for 2025...');
  const yearData = generateServicesForYear(2025);
  
  console.log(`✅ Generated ${yearData.services.length} services`);
  console.log(`   - Regular Sundays: ${yearData.metadata.regularSundays}`);
  console.log(`   - Special Weekdays: ${yearData.metadata.specialWeekdays}`);
  console.log(`   - Validation: ${yearData.validated ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!yearData.validated) {
    console.error('\n❌ Validation failed:');
    yearData.validationErrors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  if (yearData.validationWarnings && yearData.validationWarnings.length > 0) {
    console.warn('\n⚠️  Validation warnings:');
    yearData.validationWarnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  // Display summary
  console.log('\n📊 SERVICE CALENDAR SUMMARY');
  console.log('='.repeat(60));
  console.log(`Year: ${yearData.year}`);
  console.log(`Total Services: ${yearData.metadata.totalServices}`);
  console.log(`Regular Sundays: ${yearData.metadata.regularSundays}`);
  console.log(`Special Weekdays: ${yearData.metadata.specialWeekdays}`);
  console.log(`Algorithm Version: ${yearData.algorithmVersion}`);
  console.log(`Generated: ${yearData.generatedAt.toLocaleString()}`);
  console.log('='.repeat(60));
  
  // Display key dates
  console.log('\n🗓️  KEY LITURGICAL DATES FOR 2025');
  console.log('='.repeat(60));
  
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
    if (yearData.keyDates[key]) {
      const date = yearData.keyDates[key];
      const formatted = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      console.log(`${label.padEnd(22)}: ${formatted}`);
    }
  });
  
  console.log('='.repeat(60));
  
  // Display first 10 services
  console.log('\n📝 FIRST 10 SERVICES');
  console.log('='.repeat(60));
  
  yearData.services.slice(0, 10).forEach((service, index) => {
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
  console.log('='.repeat(60));
  
  // Display special weekday services
  console.log('\n🌟 SPECIAL WEEKDAY SERVICES (Non-Sunday)');
  console.log('='.repeat(60));
  
  const specialWeekdays = yearData.services.filter(s => s.isSpecialWeekday);
  
  specialWeekdays.forEach((service, index) => {
    const dateStr = service.date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const dayOfWeek = service.dayOfWeek.padEnd(9);
    const specialDay = service.specialDayName || service.specialDay;
    
    console.log(`${(index + 1).toString().padStart(2)}. ${dateStr.padEnd(8)} ${dayOfWeek} ${specialDay}`);
  });
  
  console.log('='.repeat(60));
  
  // Verify critical dates
  console.log('\n✅ CRITICAL DATE VERIFICATION');
  console.log('='.repeat(60));
  
  const easter = yearData.keyDates.easter;
  console.log(`Easter 2025: ${easter.toDateString()}`);
  console.log(`Expected:    Sun Apr 20 2025`);
  console.log(`Match:       ${easter.toDateString() === 'Sun Apr 20 2025' ? '✅ CORRECT' : '❌ WRONG'}`);
  
  const palmSunday = yearData.keyDates.palmSunday;
  console.log(`\nPalm Sunday: ${palmSunday.toDateString()}`);
  console.log(`Expected:    Sun Apr 13 2025`);
  console.log(`Match:       ${palmSunday.toDateString() === 'Sun Apr 13 2025' ? '✅ CORRECT' : '❌ WRONG'}`);
  
  const goodFriday = yearData.keyDates.goodFriday;
  console.log(`\nGood Friday: ${goodFriday.toDateString()}`);
  console.log(`Expected:    Fri Apr 18 2025`);
  console.log(`Match:       ${goodFriday.toDateString() === 'Fri Apr 18 2025' ? '✅ CORRECT' : '❌ WRONG'}`);
  
  console.log('='.repeat(60));
  
  console.log('\n✅ GENERATION TEST COMPLETE!\n');
  console.log('💡 Ready to seed database with:');
  console.log('   node src/scripts/seed-service-calendar.js');
  console.log('   (ensure MongoDB connection is configured)\n');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
