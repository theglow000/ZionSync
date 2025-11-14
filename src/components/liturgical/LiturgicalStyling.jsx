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
    const formattedDate = `${fullYear}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const date = new Date(formattedDate);
    const specialDay = getSpecialDay(date);

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
      case "ADVENT_1":
        return "advent"; // Add this case
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

  return `flex items-center justify-between w-full ${
    seasonClass ? `season-header-${seasonClass}` : ""
  } ${
    specialType ? `special-service-header special-service-${specialType}` : ""
  }`;
};

// Component for displaying special service indicator
export const SpecialServiceIndicator = ({ date }) => {
  const specialType = getSpecialServiceType(date);
  if (!specialType) return null;

  const [month, day, year] = date.split("/").map(Number);
  const fullYear = 2000 + year;
  const formattedDate = `${fullYear}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  const specialDayId = getSpecialDay(new Date(formattedDate));
  if (!specialDayId) return null;

  // Set icon and tooltip for each special day type
  let icon = "✨";
  let tooltipText = "Special Service";
  let iconColor = "text-amber-500";

  switch (specialDayId) {
    case "ASH_WEDNESDAY":
      icon = "✝️";
      tooltipText = "Ash Wednesday";
      iconColor = "text-gray-700";
      break;
    case "PALM_SUNDAY":
      icon = "🌿";
      tooltipText = "Palm Sunday";
      iconColor = "text-red-700";
      break;
    case "MAUNDY_THURSDAY":
      icon = "🍷";
      tooltipText = "Maundy Thursday";
      iconColor = "text-red-700";
      break;
    case "GOOD_FRIDAY":
      icon = "✝️";
      tooltipText = "Good Friday";
      iconColor = "text-red-700";
      break;
    case "EASTER_SUNDAY":
      icon = "🌅";
      tooltipText = "Easter Sunday";
      iconColor = "text-amber-500";
      break;
    case "PENTECOST_SUNDAY":
      icon = "🔥";
      tooltipText = "Pentecost";
      iconColor = "text-red-600";
      break;
    case "CHRISTMAS_EVE":
    case "CHRISTMAS_DAY":
      icon = "⭐";
      tooltipText = "Christmas";
      iconColor = "text-yellow-500";
      break;
    case "REFORMATION_SUNDAY":
      icon = "⚒️";
      tooltipText = "Reformation";
      iconColor = "text-red-600";
      break;
    case "ALL_SAINTS_DAY":
      icon = "👑";
      tooltipText = "All Saints";
      iconColor = "text-yellow-600";
      break;
    case "TRANSFIGURATION":
      icon = "✨";
      tooltipText = "Transfiguration";
      iconColor = "text-white";
      break;
    case "EPIPHANY":
      icon = "★";
      tooltipText = "Epiphany";
      iconColor = "text-yellow-400";
      break;
    case "TRINITY_SUNDAY":
      icon = "☩";
      tooltipText = "Trinity Sunday";
      iconColor = "text-white";
      break;
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
