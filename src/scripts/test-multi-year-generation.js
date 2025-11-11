/**
 * Test Service Generation for Multiple Years
 * 
 * Verifies the algorithm produces correct services for 2025, 2026, and 2027
 */

import { generateServicesForYear } from '../lib/ServiceGenerator.js';

console.log('🧪 Testing Service Generation for Multiple Years...\n');

const years = [2025, 2026, 2027];

years.forEach(year => {
  console.log('='.repeat(70));
  console.log(`📅 YEAR ${year}`);
  console.log('='.repeat(70));
  
  try {
    const yearData = generateServicesForYear(year);
    
    console.log(`✅ Generated ${yearData.services.length} services`);
    console.log(`   - Regular Sundays: ${yearData.metadata.regularSundays}`);
    console.log(`   - Special Weekdays: ${yearData.metadata.specialWeekdays}`);
    console.log(`   - Validation: ${yearData.validated ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Display key liturgical dates
    console.log('\n🗓️  KEY DATES:');
    console.log(`   Ash Wednesday:    ${yearData.keyDates.ashWednesday?.toDateString() || 'N/A'}`);
    console.log(`   Palm Sunday:      ${yearData.keyDates.palmSunday?.toDateString() || 'N/A'}`);
    console.log(`   Maundy Thursday:  ${yearData.keyDates.maundyThursday?.toDateString() || 'N/A'}`);
    console.log(`   Good Friday:      ${yearData.keyDates.goodFriday?.toDateString() || 'N/A'}`);
    console.log(`   Easter Sunday:    ${yearData.keyDates.easter?.toDateString() || 'N/A'}`);
    console.log(`   Ascension:        ${yearData.keyDates.ascension?.toDateString() || 'N/A'}`);
    console.log(`   Pentecost:        ${yearData.keyDates.pentecost?.toDateString() || 'N/A'}`);
    console.log(`   Advent Starts:    ${yearData.keyDates.adventStart?.toDateString() || 'N/A'}`);
    console.log(`   Christmas Eve:    ${yearData.keyDates.christmasEve?.toDateString() || 'N/A'}`);
    
    // Display all special weekday services
    console.log('\n🌟 SPECIAL WEEKDAY SERVICES:');
    const specialWeekdays = yearData.services.filter(s => s.isSpecialWeekday);
    specialWeekdays.forEach((service, index) => {
      const dateStr = service.date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
      console.log(`   ${(index + 1).toString().padStart(2)}. ${dateStr.padEnd(20)} ${service.specialDayName || service.specialDay}`);
    });
    
    // Count Lenten midweek services
    const lentenMidweek = specialWeekdays.filter(s => s.specialDay === 'LENT_MIDWEEK');
    console.log(`\n   📊 Lenten Midweek Services: ${lentenMidweek.length}`);
    
    // Verify critical dates are Wednesdays/Thursdays/Fridays
    const ashWed = yearData.keyDates.ashWednesday;
    const maundyThu = yearData.keyDates.maundyThursday;
    const goodFri = yearData.keyDates.goodFriday;
    
    console.log('\n✅ DAY VERIFICATION:');
    console.log(`   Ash Wednesday is Wednesday:   ${ashWed?.getDay() === 3 ? '✅' : '❌'}`);
    console.log(`   Maundy Thursday is Thursday:  ${maundyThu?.getDay() === 4 ? '✅' : '❌'}`);
    console.log(`   Good Friday is Friday:        ${goodFri?.getDay() === 5 ? '✅' : '❌'}`);
    
    // Verify Easter is Sunday
    const easter = yearData.keyDates.easter;
    console.log(`   Easter is Sunday:             ${easter?.getDay() === 0 ? '✅' : '❌'}`);
    
    // Verify Ash Wednesday is 46 days before Easter
    if (ashWed && easter) {
      const daysBetween = Math.round((easter - ashWed) / (1000 * 60 * 60 * 24));
      console.log(`   Ash Wed to Easter (46 days):  ${daysBetween === 46 ? '✅' : `❌ (${daysBetween})`}`);
    }
    
    // Verify midweek Lenten services are between Ash Wed and Palm Sunday
    if (lentenMidweek.length > 0) {
      const palmSunday = yearData.keyDates.palmSunday;
      const allBetween = lentenMidweek.every(s => 
        s.date > ashWed && s.date < palmSunday && s.date.getDay() === 3
      );
      console.log(`   Lenten services are Wednesdays: ${allBetween ? '✅' : '❌'}`);
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error(`❌ Error generating ${year}:`, error.message);
  }
});

console.log('='.repeat(70));
console.log('✅ MULTI-YEAR TEST COMPLETE\n');
