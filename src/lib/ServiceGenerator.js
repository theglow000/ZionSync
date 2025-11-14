/**
 * ServiceGenerator
 *
 * Generates service dates for a given year using the LiturgicalCalendarService
 * algorithm. This replaces manual date entry with algorithmic generation.
 */

import {
  calculateEaster,
  calculateAdventStart,
  calculateAshWednesday,
  getLiturgicalInfo,
  getSpecialDay,
  validateEasterDate,
  validateServiceDateRange,
} from "./LiturgicalCalendarService.js";

/**
 * Generate all service dates for a given year
 *
 * @param {number} year - The year to generate services for
 * @returns {Object} Generated service data with dates, liturgical info, and validation
 */
export function generateServicesForYear(year) {
  // Validate year
  if (year < 2024 || year > 2100) {
    throw new Error(`Year must be between 2024 and 2100. Got: ${year}`);
  }

  // Validate Easter calculation
  const easterValidation = validateEasterDate(year);
  if (!easterValidation.isValid) {
    throw new Error(
      `Easter validation failed for ${year}: ${easterValidation.message}`,
    );
  }

  const services = [];
  const keyDates = {};

  // STEP 1: Generate all Sundays for the year
  const sundays = generateSundays(year);

  // STEP 2: Add liturgical metadata to each Sunday
  sundays.forEach((date) => {
    const liturgicalInfo = getLiturgicalInfo(date);
    const specialDay = getSpecialDay(date);

    const service = {
      date,
      dateString: formatDateString(date),
      dayOfWeek: getDayOfWeek(date),
      season: liturgicalInfo.seasonId,
      seasonName: liturgicalInfo.season.name,
      seasonColor: liturgicalInfo.color,
      specialDay: specialDay,
      specialDayName: liturgicalInfo.specialDay?.name || null,
      isRegularSunday: true,
      isSpecialWeekday: false,
      isOverridden: false,
      overrideReason: null,
      overriddenBy: null,
      overriddenAt: null,
    };

    services.push(service);

    // Track key dates
    if (specialDay) {
      trackKeyDate(keyDates, specialDay, date);
    }
  });

  // STEP 3: Add special weekday services (Christmas Eve, Ash Wed, Good Friday, etc.)
  const specialWeekdays = generateSpecialWeekdays(year);

  specialWeekdays.forEach((serviceData) => {
    services.push(serviceData);

    // Track key dates
    if (serviceData.specialDay) {
      trackKeyDate(keyDates, serviceData.specialDay, serviceData.date);
    }
  });

  // STEP 4: Sort all services by date
  services.sort((a, b) => a.date - b.date);

  // STEP 5: Validate the generated services
  const validation = validateGeneratedServices(services, year);

  // STEP 6: Calculate metadata
  const metadata = {
    totalServices: services.length,
    regularSundays: services.filter((s) => s.isRegularSunday).length,
    specialWeekdays: services.filter((s) => s.isSpecialWeekday).length,
    overriddenCount: 0,
  };

  return {
    year,
    services,
    keyDates,
    metadata,
    validated: validation.isValid,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    algorithmVersion: "1.0.0",
    generatedAt: new Date(),
  };
}

/**
 * Generate all Sundays for a given year
 *
 * @param {number} year - The year to generate Sundays for
 * @returns {Array<Date>} Array of Sunday dates
 */
function generateSundays(year) {
  const sundays = [];

  // Start from January 1st
  const startDate = new Date(year, 0, 1);

  // Find the first Sunday
  let currentDate = new Date(startDate);
  while (currentDate.getDay() !== 0) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Generate all Sundays for the year
  while (currentDate.getFullYear() === year) {
    sundays.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return sundays;
}

/**
 * Generate special weekday services (non-Sunday services)
 *
 * @param {number} year - The year to generate special weekdays for
 * @returns {Array<Object>} Array of special weekday service objects
 */
function generateSpecialWeekdays(year) {
  const specialServices = [];

  // Calculate key liturgical dates
  const easter = calculateEaster(year);
  const ashWednesday = calculateAshWednesday(year);

  // Christmas Eve (December 24) - always observed
  const christmasEve = new Date(year, 11, 24);
  if (christmasEve.getDay() !== 0) {
    // Only add if not Sunday
    specialServices.push(
      createSpecialWeekdayService(christmasEve, "CHRISTMAS_EVE"),
    );
  }

  // Ash Wednesday - always observed (start of Lent)
  if (ashWednesday.getDay() !== 0) {
    // Should never be Sunday, but check anyway
    specialServices.push(
      createSpecialWeekdayService(ashWednesday, "ASH_WEDNESDAY"),
    );
  }

  // Maundy Thursday (Easter - 3 days)
  const maundyThursday = new Date(easter);
  maundyThursday.setDate(easter.getDate() - 3);
  specialServices.push(
    createSpecialWeekdayService(maundyThursday, "MAUNDY_THURSDAY"),
  );

  // Good Friday (Easter - 2 days)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  specialServices.push(createSpecialWeekdayService(goodFriday, "GOOD_FRIDAY"));

  // Ascension Day (Easter + 39 days) - always Thursday
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  // Note: Some churches move Ascension observance to Sunday, but we'll include the actual day
  specialServices.push(createSpecialWeekdayService(ascension, "ASCENSION"));

  // Midweek Lenten Services (5 Wednesdays between Ash Wednesday and Palm Sunday)
  // These are traditional Wednesday evening Lenten worship services
  let lentenWednesday = new Date(ashWednesday);
  for (let i = 0; i < 5; i++) {
    lentenWednesday.setDate(lentenWednesday.getDate() + 7); // Next Wednesday
    // Stop if we've reached or passed Palm Sunday
    const palmSunday = new Date(easter);
    palmSunday.setDate(easter.getDate() - 7);
    if (lentenWednesday < palmSunday) {
      specialServices.push(
        createSpecialWeekdayService(lentenWednesday, "LENT_MIDWEEK"),
      );
      lentenWednesday = new Date(lentenWednesday); // Clone for next iteration
    }
  }

  // Thanksgiving Eve (Wednesday before Thanksgiving)
  // Thanksgiving is 4th Thursday of November
  const november1 = new Date(year, 10, 1); // November 1st
  let thanksgiving = new Date(november1);

  // Find first Thursday
  while (thanksgiving.getDay() !== 4) {
    thanksgiving.setDate(thanksgiving.getDate() + 1);
  }

  // Add 3 weeks to get 4th Thursday
  thanksgiving.setDate(thanksgiving.getDate() + 21);

  // Thanksgiving Eve is the day before (Wednesday)
  const thanksgivingEve = new Date(thanksgiving);
  thanksgivingEve.setDate(thanksgiving.getDate() - 1);
  specialServices.push(
    createSpecialWeekdayService(thanksgivingEve, "THANKSGIVING_EVE"),
  );

  return specialServices;
}

/**
 * Create a special weekday service object
 *
 * @param {Date} date - The service date
 * @param {string} specialDayId - The special day ID
 * @returns {Object} Service object with liturgical metadata
 */
function createSpecialWeekdayService(date, specialDayId) {
  const liturgicalInfo = getLiturgicalInfo(date);

  return {
    date,
    dateString: formatDateString(date),
    dayOfWeek: getDayOfWeek(date),
    season: liturgicalInfo.seasonId,
    seasonName: liturgicalInfo.season.name,
    seasonColor: liturgicalInfo.color,
    specialDay: specialDayId,
    specialDayName: liturgicalInfo.specialDay?.name || null,
    isRegularSunday: false,
    isSpecialWeekday: true,
    isOverridden: false,
    overrideReason: null,
    overriddenBy: null,
    overriddenAt: null,
  };
}

/**
 * Format date as MM/DD/YY string (backward compatible with DATES_2025 format)
 *
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDateString(date) {
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate());
  const year = String(date.getFullYear()).substring(2); // Last 2 digits
  return `${month}/${day}/${year}`;
}

/**
 * Get day of week as string
 *
 * @param {Date} date - The date
 * @returns {string} Day of week name
 */
function getDayOfWeek(date) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}

/**
 * Track key liturgical dates
 *
 * @param {Object} keyDates - Object to store key dates
 * @param {string} specialDayId - The special day ID
 * @param {Date} date - The date
 */
function trackKeyDate(keyDates, specialDayId, date) {
  const mapping = {
    ADVENT_1: "adventStart",
    CHRISTMAS_EVE: "christmasEve",
    CHRISTMAS_DAY: "christmasDay",
    EPIPHANY_DAY: "epiphany",
    ASH_WEDNESDAY: "ashWednesday",
    PALM_SUNDAY: "palmSunday",
    MAUNDY_THURSDAY: "maundyThursday",
    GOOD_FRIDAY: "goodFriday",
    EASTER_SUNDAY: "easter",
    ASCENSION: "ascension",
    PENTECOST_SUNDAY: "pentecost",
    TRINITY_SUNDAY: "trinity",
    REFORMATION_SUNDAY: "reformationSunday",
    ALL_SAINTS_DAY: "allSaintsDay",
    CHRIST_THE_KING: "christTheKing",
    THANKSGIVING: "thanksgiving",
  };

  const key = mapping[specialDayId];
  if (key) {
    keyDates[key] = date;
  }
}

/**
 * Validate generated services
 *
 * @param {Array<Object>} services - Array of service objects
 * @param {number} year - The year
 * @returns {Object} Validation result with errors and warnings
 */
function validateGeneratedServices(services, year) {
  const errors = [];
  const warnings = [];

  // Validate using existing validation function
  const serviceDates = services.map((s) => s.date);
  const dateRangeValidation = validateServiceDateRange(serviceDates);

  if (!dateRangeValidation.isValid) {
    if (dateRangeValidation.duplicates.length > 0) {
      errors.push(
        `Found ${dateRangeValidation.duplicates.length} duplicate dates`,
      );
    }
    if (dateRangeValidation.gaps.length > 0) {
      dateRangeValidation.gaps.forEach((gap) => {
        warnings.push(
          `Gap of ${gap.daysBetween} days between ${gap.after} and ${gap.before}`,
        );
      });
    }
  }

  // Validate minimum service count (should be at least 52 Sundays + special weekdays)
  if (services.length < 52) {
    errors.push(`Expected at least 52 services, got ${services.length}`);
  }

  // Validate Easter is present
  const hasEaster = services.some((s) => s.specialDay === "EASTER_SUNDAY");
  if (!hasEaster) {
    errors.push("Easter Sunday not found in generated services");
  }

  // Validate Christmas is present
  const hasChristmas = services.some(
    (s) => s.specialDay === "CHRISTMAS_DAY" || s.specialDay === "CHRISTMAS_EVE",
  );
  if (!hasChristmas) {
    warnings.push("Christmas services not found in generated services");
  }

  // Validate all dates are in the correct year
  const wrongYearDates = services.filter((s) => s.date.getFullYear() !== year);
  if (wrongYearDates.length > 0) {
    errors.push(`Found ${wrongYearDates.length} dates in wrong year`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate services for multiple years
 *
 * @param {number} startYear - First year to generate
 * @param {number} endYear - Last year to generate
 * @returns {Array<Object>} Array of year data objects
 */
export function generateServicesForYears(startYear, endYear) {
  const results = [];

  for (let year = startYear; year <= endYear; year++) {
    try {
      const yearData = generateServicesForYear(year);
      results.push(yearData);
    } catch (error) {
      console.error(`Error generating services for ${year}:`, error);
      results.push({
        year,
        error: error.message,
        validated: false,
      });
    }
  }

  return results;
}

export default {
  generateServicesForYear,
  generateServicesForYears,
};
