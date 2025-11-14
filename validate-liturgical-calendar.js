/**
 * Comprehensive Validation Script for Liturgical Calendar Service
 * Cross-checks calculated dates against official 2024-2025 LCMC Lutheran Calendar
 */

import {
  calculateEaster,
  calculateAshWednesday,
  calculateAdventStart,
  getSpecialDay,
  getCurrentSeason,
  getLiturgicalInfo,
} from "./src/lib/LiturgicalCalendarService.js";

// Official dates from 2024-2025 LCMC Liturgical Calendar document
const OFFICIAL_CALENDAR_2024_2025 = {
  // 2024 Dates
  2024: {
    advent: {
      start: new Date(2024, 11, 1), // December 1, 2024
      sundays: [
        new Date(2024, 11, 1), // First Sunday
        new Date(2024, 11, 8), // Second Sunday
        new Date(2024, 11, 15), // Third Sunday
        new Date(2024, 11, 22), // Fourth Sunday
      ],
    },
    christmas: {
      eve: new Date(2024, 11, 24),
      day: new Date(2024, 11, 25),
      firstSunday: new Date(2024, 11, 29), // First Sunday of Christmas
    },
    epiphany: {
      feast: new Date(2025, 0, 6), // January 6, 2025 (falls on Monday)
      baptismOfOurLord: new Date(2025, 0, 12), // First Sunday after Epiphany
    },
    easter: new Date(2024, 2, 31), // March 31, 2024
    ashWednesday: new Date(2024, 1, 14), // February 14, 2024
    palmSunday: new Date(2024, 2, 24), // March 24, 2024
    maundyThursday: new Date(2024, 2, 28), // March 28, 2024
    goodFriday: new Date(2024, 2, 29), // March 29, 2024
    pentecost: new Date(2024, 4, 19), // May 19, 2024
    trinity: new Date(2024, 4, 26), // May 26, 2024
    reformation: new Date(2024, 9, 27), // October 27, 2024 (last Sunday)
    allSaints: new Date(2024, 10, 3), // November 3, 2024 (Nov 1 is Friday, so Sunday after)
    christTheKing: new Date(2024, 10, 24), // November 24, 2024 (Sunday before Advent)
    thanksgiving: new Date(2024, 10, 28), // November 28, 2024 (4th Thursday)
  },
  // 2025 Dates
  2025: {
    advent: {
      start: new Date(2025, 10, 30), // November 30, 2025
      sundays: [
        new Date(2025, 10, 30), // First Sunday
        new Date(2025, 11, 7), // Second Sunday
        new Date(2025, 11, 14), // Third Sunday
        new Date(2025, 11, 21), // Fourth Sunday
      ],
    },
    christmas: {
      eve: new Date(2025, 11, 24),
      day: new Date(2025, 11, 25),
      firstSunday: new Date(2025, 11, 28), // First Sunday of Christmas
    },
    epiphany: {
      feast: new Date(2025, 0, 6), // January 6, 2025
      baptismOfOurLord: new Date(2025, 0, 12), // January 12, 2025
    },
    transfiguration: new Date(2025, 2, 2), // March 2, 2025 (last Sunday before Lent)
    easter: new Date(2025, 3, 20), // April 20, 2025
    ashWednesday: new Date(2025, 2, 5), // March 5, 2025
    palmSunday: new Date(2025, 3, 13), // April 13, 2025
    maundyThursday: new Date(2025, 3, 17), // April 17, 2025
    goodFriday: new Date(2025, 3, 18), // April 18, 2025
    pentecost: new Date(2025, 5, 8), // June 8, 2025
    trinity: new Date(2025, 5, 15), // June 15, 2025
    reformation: new Date(2025, 9, 26), // October 26, 2025 (last Sunday)
    allSaints: new Date(2025, 10, 2), // November 2, 2025 (Nov 1 is Saturday)
    christTheKing: new Date(2025, 10, 23), // November 23, 2025 (Sunday before Advent)
    thanksgiving: new Date(2025, 10, 27), // November 27, 2025 (4th Thursday)
  },
  // 2026 Dates (for validation)
  2026: {
    easter: new Date(2026, 3, 5), // April 5, 2026
    ashWednesday: new Date(2026, 1, 18), // February 18, 2026
    advent: {
      start: new Date(2026, 10, 29), // November 29, 2026
    },
  },
};

// Helper to format date
function formatDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Helper to compare dates
function datesMatch(calculated, official) {
  return (
    calculated.getFullYear() === official.getFullYear() &&
    calculated.getMonth() === official.getMonth() &&
    calculated.getDate() === official.getDate()
  );
}

// Validation Results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function test(description, calculated, official) {
  const matches = datesMatch(calculated, official);
  const result = {
    description,
    calculated: formatDate(calculated),
    official: formatDate(official),
    passed: matches,
  };

  if (matches) {
    results.passed.push(result);
    console.log(`✅ PASS: ${description}`);
    console.log(
      `   Calculated: ${result.calculated}, Official: ${result.official}`,
    );
  } else {
    results.failed.push(result);
    console.log(`❌ FAIL: ${description}`);
    console.log(
      `   Calculated: ${result.calculated}, Official: ${result.official}`,
    );
    console.log(
      `   Difference: ${Math.abs(calculated - official) / (1000 * 60 * 60 * 24)} days`,
    );
  }
}

console.log("=".repeat(80));
console.log("LITURGICAL CALENDAR SERVICE VALIDATION");
console.log("Cross-checking against official 2024-2025 LCMC Lutheran Calendar");
console.log("=".repeat(80));
console.log();

// ===========================
// EASTER CALCULATIONS
// ===========================
console.log("📅 EASTER CALCULATIONS");
console.log("-".repeat(80));
test(
  "Easter 2024",
  calculateEaster(2024),
  OFFICIAL_CALENDAR_2024_2025["2024"].easter,
);
test(
  "Easter 2025",
  calculateEaster(2025),
  OFFICIAL_CALENDAR_2024_2025["2025"].easter,
);
test(
  "Easter 2026",
  calculateEaster(2026),
  OFFICIAL_CALENDAR_2024_2025["2026"].easter,
);
console.log();

// ===========================
// ASH WEDNESDAY CALCULATIONS
// ===========================
console.log("🕯️  ASH WEDNESDAY CALCULATIONS");
console.log("-".repeat(80));
test(
  "Ash Wednesday 2024",
  calculateAshWednesday(2024),
  OFFICIAL_CALENDAR_2024_2025["2024"].ashWednesday,
);
test(
  "Ash Wednesday 2025",
  calculateAshWednesday(2025),
  OFFICIAL_CALENDAR_2024_2025["2025"].ashWednesday,
);
test(
  "Ash Wednesday 2026",
  calculateAshWednesday(2026),
  OFFICIAL_CALENDAR_2024_2025["2026"].ashWednesday,
);
console.log();

// ===========================
// ADVENT CALCULATIONS
// ===========================
console.log("🕯️  ADVENT CALCULATIONS");
console.log("-".repeat(80));
test(
  "Advent 2024 Start",
  calculateAdventStart(2024),
  OFFICIAL_CALENDAR_2024_2025["2024"].advent.start,
);
test(
  "Advent 2025 Start",
  calculateAdventStart(2025),
  OFFICIAL_CALENDAR_2024_2025["2025"].advent.start,
);
test(
  "Advent 2026 Start",
  calculateAdventStart(2026),
  OFFICIAL_CALENDAR_2024_2025["2026"].advent.start,
);
console.log();

// ===========================
// SPECIAL DAY DETECTION
// ===========================
console.log("⭐ SPECIAL DAY DETECTION");
console.log("-".repeat(80));

// Test Christmas
const christmas2024 = OFFICIAL_CALENDAR_2024_2025["2024"].christmas.day;
const christmasSpecial = getSpecialDay(christmas2024);
console.log(
  `${christmasSpecial === "CHRISTMAS_DAY" ? "✅" : "❌"} Christmas Day 2024: ${christmasSpecial}`,
);

// Test Reformation Sunday
const reformation2025 = OFFICIAL_CALENDAR_2024_2025["2025"].reformation;
const reformationSpecial = getSpecialDay(reformation2025);
console.log(
  `${reformationSpecial === "REFORMATION_SUNDAY" ? "✅" : "❌"} Reformation Sunday 2025: ${reformationSpecial}`,
);

// Test All Saints Day
const allSaints2025 = OFFICIAL_CALENDAR_2024_2025["2025"].allSaints;
const allSaintsSpecial = getSpecialDay(allSaints2025);
console.log(
  `${allSaintsSpecial === "ALL_SAINTS_DAY" ? "✅" : "❌"} All Saints Day 2025: ${allSaintsSpecial}`,
);

// Test Christ the King
const christKing2025 = OFFICIAL_CALENDAR_2024_2025["2025"].christTheKing;
const christKingSpecial = getSpecialDay(christKing2025);
console.log(
  `${christKingSpecial === "CHRIST_THE_KING" ? "✅" : "❌"} Christ the King 2025: ${christKingSpecial}`,
);

// Test Thanksgiving
const thanksgiving2025 = OFFICIAL_CALENDAR_2024_2025["2025"].thanksgiving;
const thanksgivingSpecial = getSpecialDay(thanksgiving2025);
console.log(
  `${thanksgivingSpecial === "THANKSGIVING" ? "✅" : "❌"} Thanksgiving 2025: ${thanksgivingSpecial}`,
);

console.log();

// ===========================
// SEASON DETECTION
// ===========================
console.log("🌟 SEASON DETECTION");
console.log("-".repeat(80));

// Test Advent season
const adventDate = new Date(2025, 11, 1);
const adventSeason = getCurrentSeason(adventDate);
console.log(
  `${adventSeason === "ADVENT" ? "✅" : "❌"} Advent (Dec 1, 2025): ${adventSeason}`,
);

// Test Christmas season
const christmasDate = new Date(2025, 11, 26);
const christmasSeason = getCurrentSeason(christmasDate);
console.log(
  `${christmasSeason === "CHRISTMAS" ? "✅" : "❌"} Christmas (Dec 26, 2025): ${christmasSeason}`,
);

// Test Epiphany season
const epiphanyDate = new Date(2025, 0, 20);
const epiphanySeason = getCurrentSeason(epiphanyDate);
console.log(
  `${epiphanySeason === "EPIPHANY" ? "✅" : "❌"} Epiphany (Jan 20, 2025): ${epiphanySeason}`,
);

// Test Lent season
const lentDate = new Date(2025, 2, 10);
const lentSeason = getCurrentSeason(lentDate);
console.log(
  `${lentSeason === "LENT" ? "✅" : "❌"} Lent (Mar 10, 2025): ${lentSeason}`,
);

// Test Easter season
const easterSeasonDate = new Date(2025, 3, 25);
const easterSeason = getCurrentSeason(easterSeasonDate);
console.log(
  `${easterSeason === "EASTER" ? "✅" : "❌"} Easter (Apr 25, 2025): ${easterSeason}`,
);

// Test Ordinary Time
const ordinaryDate = new Date(2025, 6, 15);
const ordinarySeason = getCurrentSeason(ordinaryDate);
console.log(
  `${ordinarySeason === "ORDINARY_TIME" ? "✅" : "❌"} Ordinary Time (Jul 15, 2025): ${ordinarySeason}`,
);

console.log();

// ===========================
// CRITICAL DATES VALIDATION
// ===========================
console.log("🔍 CRITICAL DATES FROM HARDCODED ARRAY (DATES_2025)");
console.log("-".repeat(80));

const criticalDates = [
  {
    date: "1/5/25",
    expected: "CHRISTMAS",
    title: "Second Sunday of Christmas",
  },
  { date: "1/12/25", expected: "EPIPHANY", title: "Baptism of our Lord" },
  {
    date: "3/2/25",
    expected: "EPIPHANY",
    title: "The Transfiguration of Our Lord",
  },
  { date: "3/5/25", expected: "LENT", title: "Ash Wednesday" },
  { date: "4/13/25", expected: "HOLY_WEEK", title: "Palm Sunday" },
  { date: "4/17/25", expected: "HOLY_WEEK", title: "Maundy Thursday" },
  { date: "4/18/25", expected: "HOLY_WEEK", title: "Good Friday" },
  { date: "4/20/25", expected: "EASTER", title: "Easter Sunday" },
  { date: "6/8/25", expected: "PENTECOST_DAY", title: "Pentecost" },
  { date: "6/15/25", expected: "TRINITY", title: "Holy Trinity Sunday" },
  { date: "10/26/25", expected: "REFORMATION", title: "Reformation Sunday" },
  { date: "11/2/25", expected: "ALL_SAINTS", title: "All Saint's Day" },
  { date: "11/23/25", expected: "CHRIST_KING", title: "Christ the King" },
  { date: "11/30/25", expected: "ADVENT", title: "Advent 1" },
  { date: "12/24/25", expected: "CHRISTMAS", title: "Christmas Eve Services" },
];

for (const { date, expected, title } of criticalDates) {
  const [month, day, yearShort] = date.split("/").map(Number);
  const fullYear = 2000 + yearShort;
  const testDate = new Date(fullYear, month - 1, day);
  const season = getCurrentSeason(testDate);
  const special = getSpecialDay(testDate);

  if (season === expected) {
    console.log(
      `✅ ${date} (${title}): Season=${season}, Special=${special || "None"}`,
    );
  } else {
    console.log(
      `❌ ${date} (${title}): Expected ${expected}, Got ${season}, Special=${special || "None"}`,
    );
    results.failed.push({
      description: `${title} (${date})`,
      calculated: season,
      official: expected,
      passed: false,
    });
  }
}

console.log();

// ===========================
// KNOWN ISSUES CHECK
// ===========================
console.log("⚠️  KNOWN ISSUES & EDGE CASES");
console.log("-".repeat(80));

// Check for Palm Sunday calculation (Easter - 7 days)
const easter2025 = calculateEaster(2025);
const palmSunday2025 = new Date(easter2025);
palmSunday2025.setDate(easter2025.getDate() - 7);
test(
  "Palm Sunday 2025 (Easter - 7)",
  palmSunday2025,
  OFFICIAL_CALENDAR_2024_2025["2025"].palmSunday,
);

// Check for Pentecost (Easter + 49 days)
const pentecost2025 = new Date(easter2025);
pentecost2025.setDate(easter2025.getDate() + 49);
test(
  "Pentecost 2025 (Easter + 49)",
  pentecost2025,
  OFFICIAL_CALENDAR_2024_2025["2025"].pentecost,
);

// Check for Trinity Sunday (Pentecost + 7 days)
const trinity2025 = new Date(pentecost2025);
trinity2025.setDate(pentecost2025.getDate() + 7);
test(
  "Trinity Sunday 2025 (Pentecost + 7)",
  trinity2025,
  OFFICIAL_CALENDAR_2024_2025["2025"].trinity,
);

console.log();

// ===========================
// FINAL SUMMARY
// ===========================
console.log("=".repeat(80));
console.log("VALIDATION SUMMARY");
console.log("=".repeat(80));
console.log(`✅ Tests Passed: ${results.passed.length}`);
console.log(`❌ Tests Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log();

if (results.failed.length > 0) {
  console.log("FAILED TESTS:");
  results.failed.forEach((fail) => {
    console.log(
      `  - ${fail.description}: Expected ${fail.official}, Got ${fail.calculated}`,
    );
  });
  console.log();
  console.log(
    "❌ VALIDATION FAILED - Foundation needs fixes before proceeding",
  );
  process.exit(1);
} else {
  console.log("✅ ALL VALIDATIONS PASSED - Foundation is solid!");
  console.log("✅ Ready to proceed with Sprint 4.1 implementation");
  process.exit(0);
}
