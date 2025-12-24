// Add at the top with other imports
import {
  getLiturgicalInfoForService,
  getSeasonForDate,
  getSpecialDay,
  getCurrentSeason,
  calculateEaster,
  calculateAshWednesday,
  calculateAdventStart,
} from "../../lib/LiturgicalCalendarService.js";

// Add this helper function after the imports
function isSameDate(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Helper functions for liturgical styling
export const getSeasonClass = (dateStr) => {
  if (!dateStr) return "ORDINARY_TIME";

  try {
    // Parse MM/DD/YY format
    const [month, day, year] = dateStr.split("/").map(Number);
    const fullYear = 2000 + year;

    // Create a proper Date object - NOTE: Month is 0-indexed in JavaScript!
    const date = new Date(fullYear, month - 1, day);

    // Get season - NO MORE LOWERCASE CONVERSION
    const season = getCurrentSeason(date);
    return season;
  } catch (error) {
    console.error("Error determining season class:", error);
    return "ORDINARY_TIME";
  }
};

export const getSpecialServiceType = (dateStr) => {
  if (!dateStr) return null;

  try {
    const [month, day, year] = dateStr.split("/").map(Number);
    const fullYear = 2000 + year;
    // Use Date constructor to avoid timezone issues (month is 0-indexed)
    const date = new Date(fullYear, month - 1, day);
    const specialDay = getSpecialDay(date);

    // Check if this is an Advent Sunday (even if not the first one)
    const season = getCurrentSeason(date);
    if (season === "ADVENT" && date.getDay() === 0) {
      return "advent";
    }

    if (!specialDay) return null;

    // Map the special day ID to our CSS class names
    switch (specialDay) {
      case "ASH_WEDNESDAY":
        return "ash-wednesday";
      case "PALM_SUNDAY":
        return "holy-week";
      case "MAUNDY_THURSDAY":
        return "holy-week";
      case "GOOD_FRIDAY":
        return "holy-week";
      case "EASTER_SUNDAY":
        return "easter";
      case "PENTECOST_SUNDAY":
        return "pentecost";
      case "REFORMATION_SUNDAY":
        return "reformation";
      case "ALL_SAINTS_DAY":
        return "all-saints";
      case "CHRISTMAS_EVE":
        return "christmas";
      case "CHRISTMAS_DAY":
        return "christmas";
      case "TRINITY_SUNDAY":
        return "trinity";
      case "CHRIST_THE_KING":
        return "christ-king";
      case "THANKSGIVING":
        return "thanksgiving";
      case "THANKSGIVING_EVE":
        return "thanksgiving";
      case "ADVENT_1":
        return "advent";
      case "ASCENSION":
        return "ascension";
      case "TRANSFIGURATION":
        return "transfiguration";
      case "BAPTISM_OF_OUR_LORD":
        return "baptism";
      case "EPIPHANY_DAY":
        return "epiphany";
      case "LENT_MIDWEEK":
        return null; // No special styling for midweek Lenten services
      default:
        return null;
    }
  } catch (error) {
    console.error("Error determining special service type:", error);
    return null;
  }
};

export const getHeaderClass = (date) => {
  const seasonClass = getSeasonClass(date);
  const specialType = getSpecialServiceType(date);

  return `${seasonClass ? `season-header-${seasonClass}` : ""} ${
    specialType ? `special-service-header special-service-${specialType}` : ""
  }`.trim();
};

// Component for displaying special service indicator
export const SpecialServiceIndicator = ({ date }) => {
  const specialType = getSpecialServiceType(date);
  if (!specialType) return null;

  const [month, day, year] = date.split("/").map(Number);
  const fullYear = 2000 + year;
  // Use Date constructor to avoid timezone issues (month is 0-indexed)
  const dateObj = new Date(fullYear, month - 1, day);
  const specialDayId = getSpecialDay(dateObj);

  // Check if this is an Advent Sunday (even if not detected as ADVENT_1)
  const season = getCurrentSeason(dateObj);
  const isAdventSunday = season === "ADVENT" && dateObj.getDay() === 0;

  // If no special day and not an Advent Sunday, return null
  if (!specialDayId && !isAdventSunday) return null;

  // Set icon and tooltip for each special day type
  let icon = "✨";
  let tooltipText = "Special Service";
  let iconColor = "text-amber-500";

  // Handle Advent Sundays first (including ones not marked as ADVENT_1)
  if (isAdventSunday) {
    icon = "🕯️";
    // Calculate which Advent Sunday this is
    const adventStart = calculateAdventStart(fullYear);
    const diffTime = dateObj.getTime() - adventStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const adventWeek = Math.floor(diffDays / 7) + 1;
    const ordinal =
      adventWeek === 1
        ? "First"
        : adventWeek === 2
          ? "Second"
          : adventWeek === 3
            ? "Third"
            : "Fourth";
    tooltipText = `${ordinal} Sunday of Advent`;
    iconColor = "text-purple-600";
  } else {
    // Handle other special days
    switch (specialDayId) {
      case "ASH_WEDNESDAY":
        icon = "⚱️";
        tooltipText = "Ash Wednesday";
        iconColor = "text-gray-700";
        break;
      case "PALM_SUNDAY":
        icon = "🌿";
        tooltipText = "Palm Sunday";
        iconColor = "text-green-700";
        break;
      case "MAUNDY_THURSDAY":
        icon = "🍞";
        tooltipText = "Maundy Thursday";
        iconColor = "text-amber-700";
        break;
      case "GOOD_FRIDAY":
        icon = "✝️";
        tooltipText = "Good Friday";
        iconColor = "text-red-700";
        break;
      case "EASTER_SUNDAY":
        icon = "🌷";
        tooltipText = "Easter Sunday";
        iconColor = "text-pink-500";
        break;
      case "ASCENSION":
        icon = "🙌";
        tooltipText = "Ascension Day";
        iconColor = "text-blue-500";
        break;
      case "PENTECOST_SUNDAY":
        icon = "🔥";
        tooltipText = "Pentecost";
        iconColor = "text-red-600";
        break;
      case "TRINITY_SUNDAY":
        icon = "⚜️";
        tooltipText = "Trinity Sunday";
        iconColor = "text-amber-600";
        break;
      case "TRANSFIGURATION":
        icon = "✨";
        tooltipText = "Transfiguration";
        iconColor = "text-amber-400";
        break;
      case "BAPTISM_OF_OUR_LORD":
        icon = "💧";
        tooltipText = "Baptism of Our Lord";
        iconColor = "text-blue-500";
        break;
      case "EPIPHANY_DAY":
        icon = "⭐";
        tooltipText = "Epiphany";
        iconColor = "text-yellow-500";
        break;
      case "ADVENT_1":
        icon = "🕯️";
        tooltipText = "First Sunday of Advent";
        iconColor = "text-purple-600";
        break;
      case "REFORMATION_SUNDAY":
        icon = "📜";
        tooltipText = "Reformation Sunday";
        iconColor = "text-red-600";
        break;
      case "ALL_SAINTS_DAY":
        icon = "😇";
        tooltipText = "All Saints Day";
        iconColor = "text-amber-500";
        break;
      case "CHRIST_THE_KING":
        icon = "👑";
        tooltipText = "Christ the King Sunday";
        iconColor = "text-yellow-600";
        break;
      case "CHRISTMAS_EVE":
        icon = "🌟";
        tooltipText = "Christmas Eve";
        iconColor = "text-yellow-500";
        break;
      case "CHRISTMAS_DAY":
        icon = "🎄";
        tooltipText = "Christmas Day";
        iconColor = "text-green-600";
        break;
      case "THANKSGIVING":
        icon = "🦃";
        tooltipText = "Thanksgiving Day";
        iconColor = "text-amber-600";
        break;
      case "THANKSGIVING_EVE":
        icon = "🌾";
        tooltipText = "Thanksgiving Eve";
        iconColor = "text-amber-500";
        break;
      default:
        icon = "✨";
        tooltipText = "Special Service";
        iconColor = "text-amber-500";
        break;
    }
  }

  return (
    <div
      className="w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200"
      title={tooltipText}
    >
      <span className={`text-sm ${iconColor}`}>{icon}</span>
    </div>
  );
};

// Add the following helper at the bottom of the file
export const isTransitionDate = (dateStr) => {
  if (!dateStr) return false;

  try {
    const [month, day, year] = dateStr.split("/").map(Number);
    const fullYear = 2000 + year;
    const date = new Date(fullYear, month - 1, day);

    // Key transition dates
    const easter = calculateEaster(fullYear);
    const ashWednesday = calculateAshWednesday(fullYear);
    const adventStart = calculateAdventStart(fullYear);
    const palmSunday = new Date(easter);
    palmSunday.setDate(easter.getDate() - 7);

    // Check if this date is one of our key transition dates
    return (
      isSameDate(date, ashWednesday) ||
      isSameDate(date, palmSunday) ||
      isSameDate(date, easter) ||
      isSameDate(date, adventStart) ||
      (month === 11 && day === 24) // Christmas Eve
    );
  } catch (error) {
    console.error("Error checking transition date:", error);
    return false;
  }
};

/**
 * Format a service title to show "Nth Sunday/Wednesday of Season" for regular services
 * Special services just show their name, Ordinary Time shows just the season name
 *
 * @param {Object} item - The service item with date, day, title, and liturgical info
 * @returns {string} The formatted display title
 */
export const formatServiceTitle = (item) => {
  if (!item) return "Service";

  const { date, title, day, liturgical } = item;

  // If it's a special day, just return the special day name
  if (liturgical?.specialDayName) {
    return liturgical.specialDayName;
  }

  // If no liturgical info, return the original title
  if (!liturgical?.seasonName) {
    return title || "Service";
  }

  const seasonName = liturgical.seasonName;
  const season = liturgical.season;

  // For Ordinary Time, just show "Ordinary Time" (no count)
  if (season === "ORDINARY_TIME" || seasonName === "Ordinary Time") {
    return "Ordinary Time";
  }

  // Calculate the week number within the season
  const weekNumber = calculateWeekInSeason(date, season);

  if (weekNumber && weekNumber > 0) {
    const ordinal = getOrdinalSuffix(weekNumber);
    const dayType =
      day === "Sunday" ? "Sunday" : day === "Wednesday" ? "Wednesday" : null;

    if (dayType) {
      return `${weekNumber}${ordinal} ${dayType} of ${seasonName}`;
    }
  }

  // Fallback to season name
  return seasonName;
};

/**
 * Calculate which week of the season a given date falls in
 *
 * @param {string} dateStr - Date string in M/D/YY format
 * @param {string} season - The season ID (e.g., "ADVENT", "LENT", "EASTER")
 * @returns {number} The week number (1-based) or 0 if cannot be determined
 */
function calculateWeekInSeason(dateStr, season) {
  if (!dateStr || !season) return 0;

  try {
    const [month, day, year] = dateStr.split("/").map(Number);
    const fullYear = 2000 + year;
    const currentDate = new Date(fullYear, month - 1, day);

    let seasonStart;

    switch (season) {
      case "ADVENT":
        seasonStart = calculateAdventStart(fullYear);
        break;
      case "CHRISTMAS":
        // Christmas season starts Dec 24
        seasonStart = new Date(fullYear, 11, 24);
        // If we're in early January, check if we're still in Christmas from previous year
        if (month === 0 && day <= 6) {
          // Still in Christmas season from Dec 24 of previous year
          seasonStart = new Date(fullYear - 1, 11, 24);
        }
        break;
      case "EPIPHANY":
        // Epiphany starts Jan 6
        seasonStart = new Date(fullYear, 0, 6);
        break;
      case "LENT":
        seasonStart = calculateAshWednesday(fullYear);
        break;
      case "EASTER":
        seasonStart = calculateEaster(fullYear);
        break;
      default:
        return 0;
    }

    // Calculate weeks since season start
    const diffTime = currentDate.getTime() - seasonStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return weekNumber > 0 ? weekNumber : 0;
  } catch (error) {
    console.error("Error calculating week in season:", error);
    return 0;
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 *
 * @param {number} n - The number
 * @returns {string} The ordinal suffix
 */
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
