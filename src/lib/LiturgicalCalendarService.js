/**
 * Liturgical Calendar Service
 *
 * Provides utilities to determine liturgical seasons, colors, and special days
 * for any given date based on church calendar algorithms.
 */

import { LITURGICAL_SEASONS, MAJOR_FEAST_DAYS } from "./LiturgicalSeasons.js";
import {
  validateDate,
  validateYear,
  validateSeason,
} from "./liturgical-validation.js";

// Cache for expensive calculations
const calculationCache = {
  easter: {}, // Cache for Easter dates by year
  seasons: {}, // Cache for season calculations by date
  specialDays: {}, // Cache for special days by date
};

/**
 * Validates and normalizes input date
 * @param {Date|string} inputDate - Date to validate
 * @returns {Date} Validated Date object
 * @throws {Error} If date is invalid
 */
function validateAndNormalizeDate(inputDate) {
  try {
    const validatedDate = validateDate(inputDate);

    // Additional business logic validation
    if (
      validatedDate.getFullYear() < 1970 ||
      validatedDate.getFullYear() > 2100
    ) {
      throw new Error("Year must be between 1970 and 2100");
    }

    return validatedDate;
  } catch (error) {
    throw new Error(`Invalid date input: ${error.message}`);
  }
}

// Add this helper function at the top of the file, before the other functions
function isSameDate(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calculate Easter Sunday date for a given year using the Computus algorithm
 *
 * @param {number} year - The year to calculate Easter for
 * @returns {Date} Easter date for the specified year
 */
export function calculateEaster(year) {
  // Validate year input
  try {
    const validatedYear = validateYear(year);
    year = validatedYear;
  } catch (error) {
    throw new Error(`Invalid year for Easter calculation: ${error.message}`);
  }

  // Check cache first - but use a string representation instead of Date object
  if (calculationCache.easter[year]) {
    const [y, m, d] = calculationCache.easter[year].split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  try {
    // Meeus/Jones/Butcher algorithm
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);

    // Calculate month and day
    const monthVal = Math.floor((h + l - 7 * m + 114) / 31);
    const month = monthVal - 1; // Convert to 0-based month (3 = April, 2 = March)
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    // Create date object in LOCAL time (not UTC)
    let easter = new Date(year, month, day);

    // Century boundary correction for year 2100
    // The Meeus/Jones/Butcher algorithm has a known edge case at century boundaries
    // that are not divisible by 400 (like 2100, 2200, 2300).
    // This is due to the Gregorian calendar's century leap year rule.
    if (year === 2100) {
      easter = new Date(2100, 3, 28); // April 28, 2100
    }

    // Store in cache using YYYY-MM-DD format instead of Date object
    const month_string = easter.getMonth() + 1; // getMonth() returns 0-11
    const day_string = easter.getDate();
    calculationCache.easter[year] = `${year}-${month_string}-${day_string}`;

    return easter;
  } catch (error) {
    throw new Error(
      `Easter calculation failed for year ${year}: ${error.message}`,
    );
  }
}

/**
 * Calculate the start date of Advent for a given year
 * (4th Sunday before Christmas)
 *
 * @param {number} year - The year to calculate for
 * @returns {Date} Start date of Advent
 */
export function calculateAdventStart(year) {
  // Christmas day
  const christmas = new Date(year, 11, 25); // December 25
  const dayOfWeek = christmas.getDay(); // 0 (Sunday) to 6 (Saturday)

  // Days to subtract to get to the 4th Sunday before Christmas
  let daysToSubtract = dayOfWeek + 21; // 21 days (3 weeks) + days until previous Sunday

  // Create a new date
  const adventStart = new Date(year, 11, 25 - daysToSubtract);

  return adventStart;
}

/**
 * Calculate the start date of Lent (Ash Wednesday) for a given year
 *
 * @param {number} year - The year to calculate for
 * @returns {Date} Ash Wednesday date
 */
export function calculateAshWednesday(year) {
  const easter = calculateEaster(year);
  const ashWednesday = new Date(easter);
  // Subtract 46 days (40 days + 6 Sundays)
  ashWednesday.setDate(easter.getDate() - 46);
  return ashWednesday;
}

/**
 * Determine if a date is the last Sunday in October (Reformation Sunday)
 *
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is Reformation Sunday
 */
export function isReformationSunday(date) {
  // Must be in October
  if (date.getMonth() !== 9) return false;

  // Must be a Sunday
  if (date.getDay() !== 0) return false;

  // Check if it's the last Sunday in October
  const nextWeek = new Date(date);
  nextWeek.setDate(date.getDate() + 7);
  return nextWeek.getMonth() !== 9;
}

/**
 * Determine if a date is All Saints Day (November 1) or the Sunday after
 * LCMC Lutheran tradition: First Sunday of November OR November 1 if it's Sunday
 *
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is All Saints Day or its observance Sunday
 */
export function isAllSaintsDay(date) {
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // Lutheran tradition: First Sunday of November OR Nov 1 if it's Sunday
  if (month === 10 && day === 1 && dayOfWeek === 0) return true;
  if (month === 10 && dayOfWeek === 0 && day <= 7) return true;

  return false;
}

/**
 * Check if a date is Christ the King Sunday (last Sunday before Advent)
 *
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is Christ the King Sunday
 */
export function isChristTheKingSunday(date) {
  if (date.getDay() !== 0) return false; // Must be a Sunday

  const year = date.getFullYear();
  const adventStart = calculateAdventStart(year);
  const adventStartTime = adventStart.getTime();
  const dateTime = date.getTime();

  // It should be the Sunday right before Advent starts
  const oneWeekBeforeAdvent = new Date(adventStartTime);
  oneWeekBeforeAdvent.setDate(adventStart.getDate() - 7);

  return dateTime === oneWeekBeforeAdvent.getTime();
}

/**
 * Check if a date is a US Thanksgiving Day (4th Thursday in November)
 *
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is Thanksgiving Day
 */
export function isThanksgivingDay(date) {
  if (date.getMonth() !== 10) return false; // Must be November
  if (date.getDay() !== 4) return false; // Must be Thursday

  // Calculate which Thursday of the month this is
  return Math.ceil(date.getDate() / 7) === 4; // Should be the 4th Thursday
}

/**
 * Check if a date is Thanksgiving Eve (Wednesday before Thanksgiving)
 *
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is Thanksgiving Eve
 */
export function isThanksgivingEve(date) {
  if (date.getMonth() !== 10) return false; // Must be November
  if (date.getDay() !== 3) return false; // Must be Wednesday

  // Check if tomorrow is Thanksgiving
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  return isThanksgivingDay(tomorrow);
}

/**
 * Check if a date is a midweek Lenten service (Wednesdays between Ash Wed and Palm Sunday)
 *
 * @param {Date} date - The date to check
 * @param {Date} ashWednesday - Ash Wednesday for this year
 * @param {Date} palmSunday - Palm Sunday for this year
 * @returns {boolean} True if the date is a midweek Lenten service
 */
export function isLentenMidweek(date, ashWednesday, palmSunday) {
  if (date.getDay() !== 3) return false; // Must be Wednesday

  // Must be after Ash Wednesday and before Palm Sunday
  return date > ashWednesday && date < palmSunday;
}

/**
 * Check if a date is a special day such as Christmas, Easter, etc.
 *
 * @param {Date} date - The date to check
 * @returns {string|null} The special day ID or null if not a special day
 */
export function getSpecialDay(date) {
  const dateStr = date.toISOString().split("T")[0];

  // Check cache first
  if (calculationCache.specialDays[dateStr]) {
    return calculationCache.specialDays[dateStr];
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Calculate key dates for comparison for ANY year
  const easter = calculateEaster(year);
  const ashWednesday = calculateAshWednesday(year);
  const adventStart = calculateAdventStart(year);

  // Palm Sunday (one week before Easter)
  const palmSunday = new Date(easter);
  palmSunday.setDate(easter.getDate() - 7);

  // Maundy Thursday (3 days before Easter)
  const maundyThursday = new Date(easter);
  maundyThursday.setDate(easter.getDate() - 3);

  // Good Friday (2 days before Easter)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);

  // Ascension Day (39 days after Easter - always a Thursday)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);

  // Pentecost (50 days after Easter)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);

  // Trinity Sunday (one week after Pentecost)
  const trinity = new Date(pentecost);
  trinity.setDate(pentecost.getDate() + 7);

  // Transfiguration Sunday (last Sunday before Lent)
  const lastSundayBeforeLent = new Date(ashWednesday);
  while (lastSundayBeforeLent.getDay() !== 0) {
    // 0 is Sunday
    lastSundayBeforeLent.setDate(lastSundayBeforeLent.getDate() - 1);
  }

  // Check for Transfiguration Sunday
  if (isSameDate(date, lastSundayBeforeLent)) {
    calculationCache.specialDays[dateStr] = "TRANSFIGURATION";
    return "TRANSFIGURATION";
  }

  // Christmas Eve and Day
  if (month === 11 && day === 24) {
    calculationCache.specialDays[dateStr] = "CHRISTMAS_EVE";
    return "CHRISTMAS_EVE";
  }

  if (month === 11 && day === 25) {
    calculationCache.specialDays[dateStr] = "CHRISTMAS_DAY";
    return "CHRISTMAS_DAY";
  }

  // Epiphany (January 6)
  if (month === 0 && day === 6) {
    calculationCache.specialDays[dateStr] = "EPIPHANY_DAY";
    return "EPIPHANY_DAY";
  }

  // Baptism of Our Lord (Sunday after Epiphany)
  // This is the first Sunday after January 6
  if (month === 0 && date.getDay() === 0) {
    // Calculate if this is the Sunday after Epiphany
    const epiphanyThisYear = new Date(year, 0, 6);
    const dayOfWeek = epiphanyThisYear.getDay();

    // Calculate the first Sunday after Epiphany
    let baptismOfOurLord = new Date(epiphanyThisYear);
    if (dayOfWeek === 0) {
      // If Epiphany is on Sunday, Baptism is the next Sunday
      baptismOfOurLord.setDate(epiphanyThisYear.getDate() + 7);
    } else {
      // Otherwise, go to the next Sunday
      baptismOfOurLord.setDate(epiphanyThisYear.getDate() + (7 - dayOfWeek));
    }

    if (isSameDate(date, baptismOfOurLord)) {
      calculationCache.specialDays[dateStr] = "BAPTISM_OF_OUR_LORD";
      return "BAPTISM_OF_OUR_LORD";
    }
  }

  // Check for exact date matches using isSameDate helper
  if (isSameDate(date, adventStart)) {
    calculationCache.specialDays[dateStr] = "ADVENT_1";
    return "ADVENT_1";
  }

  if (isSameDate(date, ashWednesday)) {
    calculationCache.specialDays[dateStr] = "ASH_WEDNESDAY";
    return "ASH_WEDNESDAY";
  }

  if (isSameDate(date, palmSunday)) {
    calculationCache.specialDays[dateStr] = "PALM_SUNDAY";
    return "PALM_SUNDAY";
  }

  if (isSameDate(date, maundyThursday)) {
    calculationCache.specialDays[dateStr] = "MAUNDY_THURSDAY";
    return "MAUNDY_THURSDAY";
  }

  if (isSameDate(date, goodFriday)) {
    calculationCache.specialDays[dateStr] = "GOOD_FRIDAY";
    return "GOOD_FRIDAY";
  }

  if (isSameDate(date, easter)) {
    calculationCache.specialDays[dateStr] = "EASTER_SUNDAY";
    return "EASTER_SUNDAY";
  }

  if (isSameDate(date, ascension)) {
    calculationCache.specialDays[dateStr] = "ASCENSION";
    return "ASCENSION";
  }

  if (isSameDate(date, pentecost)) {
    calculationCache.specialDays[dateStr] = "PENTECOST_SUNDAY";
    return "PENTECOST_SUNDAY";
  }

  if (isSameDate(date, trinity)) {
    calculationCache.specialDays[dateStr] = "TRINITY_SUNDAY";
    return "TRINITY_SUNDAY";
  }

  // Reformation Sunday (last Sunday in October)
  if (isReformationSunday(date)) {
    calculationCache.specialDays[dateStr] = "REFORMATION_SUNDAY";
    return "REFORMATION_SUNDAY";
  }

  // All Saints Day (Nov 1 or nearest Sunday)
  if (isAllSaintsDay(date)) {
    calculationCache.specialDays[dateStr] = "ALL_SAINTS_DAY";
    return "ALL_SAINTS_DAY";
  }

  // Christ the King (Sunday before Advent)
  if (isChristTheKingSunday(date)) {
    calculationCache.specialDays[dateStr] = "CHRIST_THE_KING";
    return "CHRIST_THE_KING";
  }

  // US Thanksgiving
  if (isThanksgivingDay(date)) {
    calculationCache.specialDays[dateStr] = "THANKSGIVING";
    return "THANKSGIVING";
  }

  // Thanksgiving Eve (Wednesday before Thanksgiving)
  if (isThanksgivingEve(date)) {
    calculationCache.specialDays[dateStr] = "THANKSGIVING_EVE";
    return "THANKSGIVING_EVE";
  }

  // Midweek Lenten Services (Wednesdays between Ash Wednesday and Palm Sunday)
  if (isLentenMidweek(date, ashWednesday, palmSunday)) {
    calculationCache.specialDays[dateStr] = "LENT_MIDWEEK";
    return "LENT_MIDWEEK";
  }

  // Not a special day
  calculationCache.specialDays[dateStr] = null;
  return null;
}

/**
 * Get the liturgical season for a given date
 *
 * @param {Date|string} inputDate - The date to check (Date object or ISO string)
 * @returns {string} The ID of the liturgical season
 */
export function getCurrentSeason(inputDate) {
  // Validate and normalize input date
  let date;
  try {
    date = validateAndNormalizeDate(inputDate);
  } catch (error) {
    throw new Error(`Invalid date for season detection: ${error.message}`);
  }

  // For cache and debug purposes
  const dateStr = date.toISOString().split("T")[0];
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Check cache
  if (calculationCache.seasons[dateStr]) {
    return calculationCache.seasons[dateStr];
  }

  // STEP 1: Check for special days that define their own season
  const specialDay = getSpecialDay(date);
  if (specialDay) {
    // This switch statement maps special days to their appropriate liturgical seasons
    switch (specialDay) {
      case "CHRISTMAS_EVE":
      case "CHRISTMAS_DAY":
        calculationCache.seasons[dateStr] = "CHRISTMAS";
        return "CHRISTMAS";
      case "EASTER_SUNDAY":
        calculationCache.seasons[dateStr] = "EASTER";
        return "EASTER";
      case "ASH_WEDNESDAY":
      case "LENT_MIDWEEK":
        calculationCache.seasons[dateStr] = "LENT";
        return "LENT";
      case "PALM_SUNDAY":
      case "MAUNDY_THURSDAY":
      case "GOOD_FRIDAY":
        calculationCache.seasons[dateStr] = "HOLY_WEEK";
        return "HOLY_WEEK";
      case "PENTECOST_SUNDAY":
        calculationCache.seasons[dateStr] = "PENTECOST_DAY";
        return "PENTECOST_DAY";
      case "REFORMATION_SUNDAY":
        calculationCache.seasons[dateStr] = "REFORMATION";
        return "REFORMATION";
      case "ALL_SAINTS_DAY":
        calculationCache.seasons[dateStr] = "ALL_SAINTS";
        return "ALL_SAINTS";
      case "TRINITY_SUNDAY":
        calculationCache.seasons[dateStr] = "TRINITY";
        return "TRINITY";
      case "CHRIST_THE_KING":
        calculationCache.seasons[dateStr] = "CHRIST_KING";
        return "CHRIST_KING";
      case "THANKSGIVING":
      case "THANKSGIVING_EVE":
        calculationCache.seasons[dateStr] = "ORDINARY_TIME";
        return "ORDINARY_TIME";
      case "ADVENT_1":
        calculationCache.seasons[dateStr] = "ADVENT";
        return "ADVENT";
      case "TRANSFIGURATION":
        calculationCache.seasons[dateStr] = "EPIPHANY";
        return "EPIPHANY";
      case "THANKSGIVING":
        // Thanksgiving typically falls during Ordinary Time, could be specified differently
        calculationCache.seasons[dateStr] = "ORDINARY_TIME";
        return "ORDINARY_TIME";
    }
  }

  // STEP 2: Check for specific season date ranges

  // Calculate key dates
  const easter = calculateEaster(year);
  const ashWednesday = calculateAshWednesday(year);
  const adventStart = calculateAdventStart(year);
  const palmSunday = new Date(easter);
  palmSunday.setDate(easter.getDate() - 7);
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);

  // Check each season in order of the liturgical year

  // CHRISTMAS: Dec 24-Jan 5
  if ((month === 11 && day >= 24) || (month === 0 && day <= 5)) {
    calculationCache.seasons[dateStr] = "CHRISTMAS";
    return "CHRISTMAS";
  }

  // EPIPHANY: Jan 6-Ash Wednesday Eve
  if (date >= new Date(year, 0, 6) && date < ashWednesday) {
    calculationCache.seasons[dateStr] = "EPIPHANY";
    return "EPIPHANY";
  }

  // LENT: Ash Wednesday-Palm Sunday Eve
  if (date >= ashWednesday && date < palmSunday) {
    calculationCache.seasons[dateStr] = "LENT";
    return "LENT";
  }

  // HOLY WEEK: Palm Sunday-Easter Eve
  if (date >= palmSunday && date < easter) {
    calculationCache.seasons[dateStr] = "HOLY_WEEK";
    return "HOLY_WEEK";
  }

  // EASTER: Easter-Pentecost Eve
  if (date >= easter && date < pentecost) {
    calculationCache.seasons[dateStr] = "EASTER";
    return "EASTER";
  }

  // ADVENT: Advent 1-Dec 23
  if ((month === 10 || month === 11) && date >= adventStart && day <= 23) {
    calculationCache.seasons[dateStr] = "ADVENT";
    return "ADVENT";
  }

  // ORDINARY TIME: Everything else
  calculationCache.seasons[dateStr] = "ORDINARY_TIME";
  return "ORDINARY_TIME";
}

/**
 * Get the liturgical color for a given date
 *
 * @param {Date|string} date - The date to check
 * @returns {string} Hex color code for the season
 */
export function getSeasonColor(date) {
  // First check if it's a special day
  const specialDay = getSpecialDay(date);
  if (specialDay && MAJOR_FEAST_DAYS[specialDay]) {
    return MAJOR_FEAST_DAYS[specialDay].color;
  }

  // Otherwise return the season color
  const season = getCurrentSeason(date);
  return LITURGICAL_SEASONS[season].color;
}

/**
 * Get complete liturgical information for a date
 *
 * @param {Date|string} date - The date to check
 * @returns {Object} Object containing season, special day, and color information
 */
export function getLiturgicalInfo(date) {
  const normalizedDate = date instanceof Date ? date : new Date(date);
  const season = getCurrentSeason(normalizedDate);
  const specialDay = getSpecialDay(normalizedDate);

  return {
    date: normalizedDate,
    season: LITURGICAL_SEASONS[season],
    seasonId: season,
    specialDay: specialDay ? MAJOR_FEAST_DAYS[specialDay] : null,
    specialDayId: specialDay,
    color: getSeasonColor(normalizedDate),
  };
}

/**
 * Clear calculation caches
 */
export function clearCache() {
  calculationCache.easter = {};
  calculationCache.seasons = {};
  calculationCache.specialDays = {};
}

/**
 * Get liturgical information for a service date
 * @param {string} dateString - Date in MM/DD/YY format
 * @returns {object} Liturgical information for the service date
 */
export function getLiturgicalInfoForService(dateString) {
  try {
    // Parse date string (MM/DD/YY)
    const [month, day, year] = dateString.split("/").map(Number);
    const fullYear = 2000 + year; // Convert 2-digit to 4-digit year

    // Create date object
    const date = new Date(fullYear, month - 1, day);

    // Get date-specific liturgical season and special days
    const season = getSeasonForDate(
      `${fullYear}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
    );
    const specialDay = getSpecialDay(date);

    // Determine color based on season or special day
    let seasonColor;
    let seasonName;

    if (specialDay && MAJOR_FEAST_DAYS[specialDay]) {
      // Special day takes precedence
      seasonColor = MAJOR_FEAST_DAYS[specialDay].color;
      seasonName = MAJOR_FEAST_DAYS[specialDay].name;
    } else if (LITURGICAL_SEASONS[season]) {
      // Regular season
      seasonColor = LITURGICAL_SEASONS[season].color;
      seasonName = LITURGICAL_SEASONS[season].name;
    } else {
      // Default fallback
      seasonColor = "#888888";
      seasonName = "Ordinary Time";
    }

    return {
      date,
      season,
      seasonName,
      seasonColor,
      specialDay,
      specialDayName: specialDay ? MAJOR_FEAST_DAYS[specialDay]?.name : null,
    };
  } catch (error) {
    console.error("Error getting liturgical info for service:", error);
    return null;
  }
}

/**
 * Get the liturgical season for a given date string
 *
 * @param {string} dateString - The date string (YYYY-MM-DD)
 * @returns {string} The ID of the liturgical season
 */
export function getSeasonForDate(dateString) {
  try {
    // Convert string date to Date object
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("Invalid date string:", dateString);
      return "UNKNOWN";
    }

    // Use the standardized getCurrentSeason function - no special cases
    return getCurrentSeason(date);
  } catch (error) {
    console.error("Error determining season:", error);
    return "UNKNOWN";
  }
}

/**
 * Gets the next liturgical season based on the current season
 * @param {string} currentSeasonId - Current liturgical season ID
 * @returns {string} The ID of the next liturgical season
 */
export function getNextLiturgicalSeason(currentSeasonId) {
  // Ordering of seasons in the liturgical year
  const seasonOrder = [
    "ADVENT",
    "CHRISTMAS",
    "EPIPHANY",
    "LENT",
    "HOLY_WEEK",
    "EASTER",
    "PENTECOST_DAY",
    "TRINITY",
    "ORDINARY_TIME",
  ];

  const currentIndex = seasonOrder.indexOf(currentSeasonId);
  if (currentIndex === -1) return "ADVENT"; // Default to Advent if not found

  // Get the next season, wrapping around to the beginning if needed
  const nextIndex = (currentIndex + 1) % seasonOrder.length;
  return seasonOrder[nextIndex];
}

/**
 * Gets the date range for a specific liturgical season in the current year
 * @param {string} seasonId - ID of the liturgical season
 * @param {Date} [referenceDate=new Date()] - Reference date (usually today)
 * @returns {Object} Object with startDate and endDate of the season
 */
export function getSeasonDateRange(seasonId, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();

  // This implementation uses existing calculation functions
  // and ensures dates are calculated for the appropriate year

  // Get Easter as our reference point for many calculations
  const easter = calculateEaster(year);
  const nextEaster = calculateEaster(year + 1);

  // Calculate other key dates
  const ashWednesday = calculateAshWednesday(year);
  const adventStart = calculateAdventStart(year);
  const adventStartNextYear = calculateAdventStart(year + 1);

  // Handle season that wraps from previous year
  const christmasLastYear = new Date(year - 1, 11, 25); // Dec 25 of previous year
  const epiphanyThisYear = new Date(year, 0, 6); // Jan 6

  // Define season date ranges
  switch (seasonId) {
    case "ADVENT":
      // Advent starts 4 Sundays before Christmas and ends on Christmas Eve
      return {
        startDate: adventStart,
        endDate: new Date(year, 11, 24), // December 24
      };

    case "CHRISTMAS":
      // Christmas runs from Dec 25 to Jan 5 (12 days of Christmas)
      return {
        startDate: new Date(year, 11, 25), // December 25
        endDate: new Date(year + 1, 0, 5), // January 5 of next year
      };

    case "EPIPHANY":
      // Epiphany starts Jan 6 and runs until day before Ash Wednesday
      return {
        startDate: new Date(year, 0, 6), // January 6
        endDate: new Date(ashWednesday.getTime() - 86400000), // Day before Ash Wednesday
      };

    case "LENT":
      // Lent starts on Ash Wednesday and ends on the day before Palm Sunday
      const lentPalmSunday = new Date(easter);
      lentPalmSunday.setDate(easter.getDate() - 7);
      return {
        startDate: ashWednesday,
        endDate: new Date(lentPalmSunday.getTime() - 86400000), // Day before Palm Sunday
      };

    case "HOLY_WEEK":
      // Holy Week runs from Palm Sunday through Holy Saturday
      const holyWeekPalmSunday = new Date(easter);
      holyWeekPalmSunday.setDate(easter.getDate() - 7);
      const holySaturday = new Date(easter);
      holySaturday.setDate(easter.getDate() - 1);
      return {
        startDate: holyWeekPalmSunday,
        endDate: holySaturday,
      };

    case "EASTER":
      // Easter season runs from Easter Sunday through the Day before Pentecost
      const pentecostDay = new Date(easter);
      pentecostDay.setDate(easter.getDate() + 49); // 7 weeks after Easter
      return {
        startDate: easter,
        endDate: new Date(pentecostDay.getTime() - 86400000), // Day before Pentecost
      };

    case "PENTECOST_DAY":
      // Pentecost Day is a single day
      const pentecostDate = new Date(easter);
      pentecostDate.setDate(easter.getDate() + 49); // 7 weeks after Easter
      return {
        startDate: pentecostDate,
        endDate: pentecostDate,
      };

    case "TRINITY":
      // Trinity Sunday is the Sunday after Pentecost
      const pentecostForTrinity = new Date(easter);
      pentecostForTrinity.setDate(easter.getDate() + 49);
      const trinitySunday = new Date(pentecostForTrinity);
      trinitySunday.setDate(pentecostForTrinity.getDate() + 7);
      return {
        startDate: trinitySunday,
        endDate: trinitySunday,
      };

    case "ORDINARY_TIME":
      // Ordinary Time runs from the day after Trinity Sunday until day before Advent
      const trinitySundayForOrdinary = new Date(easter);
      trinitySundayForOrdinary.setDate(easter.getDate() + 56); // 8 weeks after Easter
      const dayAfterTrinity = new Date(trinitySundayForOrdinary);
      dayAfterTrinity.setDate(trinitySundayForOrdinary.getDate() + 1);

      return {
        startDate: dayAfterTrinity,
        endDate: new Date(adventStart.getTime() - 86400000), // Day before Advent
      };

    default:
      return { startDate: null, endDate: null };
  }
}

/**
 * Gets days remaining in the current liturgical season
 * @param {string} seasonId - ID of the liturgical season
 * @param {Date} [referenceDate=new Date()] - Reference date (usually today)
 * @returns {number} Number of days remaining in the season
 */
export function getDaysRemainingInSeason(seasonId, referenceDate = new Date()) {
  const { endDate } = getSeasonDateRange(seasonId, referenceDate);

  if (!endDate) return null;

  // Calculate days between today and end date
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - referenceDate.getTime();
  return Math.ceil(diffMs / msPerDay);
}

/**
 * Calculates the percentage progress through the current liturgical season
 * @param {string} seasonId - ID of the liturgical season
 * @param {Date} [referenceDate=new Date()] - Reference date (usually today)
 * @returns {number} Percentage through the season (0-100)
 */
export function getSeasonProgressPercentage(
  seasonId,
  referenceDate = new Date(),
) {
  const { startDate, endDate } = getSeasonDateRange(seasonId, referenceDate);

  if (!startDate || !endDate) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDuration = (endDate.getTime() - startDate.getTime()) / msPerDay;
  const elapsedDuration =
    (referenceDate.getTime() - startDate.getTime()) / msPerDay;

  // Handle case where reference date is before season start
  if (elapsedDuration < 0) return 0;

  // Handle case where reference date is after season end
  if (elapsedDuration > totalDuration) return 100;

  return Math.round((elapsedDuration / totalDuration) * 100);
}

/**
 * Validate that an Easter date falls within the valid range
 * Easter must fall between March 22 and April 25 (inclusive)
 *
 * @param {number} year - The year to validate
 * @returns {Object} Validation result with isValid boolean and message
 */
export function validateEasterDate(year) {
  const easter = calculateEaster(year);
  const month = easter.getMonth();
  const day = easter.getDate();

  // Easter must be between March 22 (month 2, day 22) and April 25 (month 3, day 25)
  const isValid = (month === 2 && day >= 22) || (month === 3 && day <= 25);

  if (!isValid) {
    return {
      isValid: false,
      message: `Easter ${year} falls on ${easter.toDateString()}, which is outside the valid range of March 22 - April 25`,
      calculatedDate: easter,
    };
  }

  return {
    isValid: true,
    message: `Easter ${year} on ${easter.toDateString()} is valid`,
    calculatedDate: easter,
  };
}

/**
 * Validate that a date's liturgical season matches expected value
 *
 * @param {Date} date - The date to validate
 * @param {string} expectedSeason - The expected season ID (e.g., "ADVENT", "LENT")
 * @returns {Object} Validation result with isValid boolean and details
 */
export function validateLiturgicalDate(date, expectedSeason) {
  const calculatedSeason = getCurrentSeason(date);
  const isValid = calculatedSeason === expectedSeason;

  return {
    isValid,
    date: date.toDateString(),
    expectedSeason,
    calculatedSeason,
    message: isValid
      ? `Date ${date.toDateString()} correctly identified as ${calculatedSeason}`
      : `Date ${date.toDateString()} expected ${expectedSeason} but got ${calculatedSeason}`,
  };
}

/**
 * Validate a range of service dates for gaps and duplicates
 *
 * @param {Array<Date>} serviceDates - Array of service dates to validate
 * @returns {Object} Validation result with gaps and duplicates
 */
export function validateServiceDateRange(serviceDates) {
  if (!serviceDates || serviceDates.length === 0) {
    return {
      isValid: false,
      message: "No service dates provided",
      gaps: [],
      duplicates: [],
    };
  }

  // Sort dates
  const sortedDates = [...serviceDates].sort((a, b) => a - b);

  // Check for duplicates
  const duplicates = [];
  for (let i = 0; i < sortedDates.length - 1; i++) {
    if (sortedDates[i].toDateString() === sortedDates[i + 1].toDateString()) {
      duplicates.push(sortedDates[i].toDateString());
    }
  }

  // Check for gaps (more than 14 days between services)
  const gaps = [];
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const daysBetween = Math.floor(
      (sortedDates[i + 1] - sortedDates[i]) / (1000 * 60 * 60 * 24),
    );
    if (daysBetween > 14) {
      gaps.push({
        after: sortedDates[i].toDateString(),
        before: sortedDates[i + 1].toDateString(),
        daysBetween,
      });
    }
  }

  const isValid = duplicates.length === 0 && gaps.length === 0;

  return {
    isValid,
    message: isValid
      ? `All ${serviceDates.length} service dates are valid`
      : `Found ${duplicates.length} duplicates and ${gaps.length} gaps`,
    totalServices: serviceDates.length,
    duplicates,
    gaps,
  };
}

export default {
  calculateEaster,
  calculateAdventStart,
  calculateAshWednesday,
  getCurrentSeason,
  getSpecialDay,
  getSeasonColor,
  getLiturgicalInfo,
  clearCache,
  getLiturgicalInfoForService,
  getSeasonForDate,
  getNextLiturgicalSeason,
  getSeasonDateRange,
  getDaysRemainingInSeason,
  getSeasonProgressPercentage,
  validateEasterDate,
  validateLiturgicalDate,
  validateServiceDateRange,
};
