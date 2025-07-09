// Add at the top with other imports
import { 
  getLiturgicalInfoForService, 
  getSeasonForDate, 
  getSpecialDay, 
  getCurrentSeason,
  calculateEaster,
  calculateAshWednesday,
  calculateAdventStart
} from '../../lib/LiturgicalCalendarService.js';
import { validateDate } from '../../lib/liturgical-validation.js';

// Cache for memoizing liturgical calculations
const liturgicalCache = {
  seasons: new Map(),
  specialDays: new Map(),
  headerClasses: new Map()
};

// Add this helper function after the imports
function isSameDate(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getDate() === date2.getDate();
}      

// Helper functions for liturgical styling
export const getSeasonClass = (dateStr) => {
  if (!dateStr) return 'ORDINARY_TIME';
  
  // Validate date string format
  try {
    validateDate(dateStr);
  } catch (error) {
    console.error('Invalid date format in getSeasonClass:', dateStr, error.message);
    return 'ORDINARY_TIME'; // Safe fallback
  }
  
  // Check cache first
  if (liturgicalCache.seasons.has(dateStr)) {
    return liturgicalCache.seasons.get(dateStr);
  }
  
  try {
    // Parse MM/DD/YY format
    const [month, day, year] = dateStr.split('/').map(Number);
    const fullYear = 2000 + year; 
    
    // Create a proper Date object - NOTE: Month is 0-indexed in JavaScript!
    const date = new Date(fullYear, month - 1, day);
    
    // Get season - NO MORE LOWERCASE CONVERSION
    const season = getCurrentSeason(date);
    // console.log(`Date: ${dateStr}, Season: ${season}`); // Debug line - commented out to reduce console spam
    
    // Cache the result
    liturgicalCache.seasons.set(dateStr, season);
    return season;
  } catch (error) {
    console.error('Error determining season class:', error);
    const fallback = 'ORDINARY_TIME';
    liturgicalCache.seasons.set(dateStr, fallback);
    return fallback;
  }
};

export const getSpecialServiceType = (dateStr) => {
  if (!dateStr) return null;
  
  // Check cache first
  if (liturgicalCache.specialDays.has(dateStr)) {
    return liturgicalCache.specialDays.get(dateStr);
  }
  
  try {
    const [month, day, year] = dateStr.split('/').map(Number);
    const fullYear = 2000 + year;
    const formattedDate = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const date = new Date(formattedDate);
    const specialDay = getSpecialDay(date);
    
    // Debug output - commented out to reduce console spam
    // console.log(`Special day for ${dateStr}: ${specialDay}`);
    
    if (!specialDay) {
      liturgicalCache.specialDays.set(dateStr, null);
      return null;
    }
    
    let result = null;
    // Map the special day ID to our CSS class names
    switch(specialDay) {
      case 'ASH_WEDNESDAY': result = 'ash-wednesday'; break;
      case 'PALM_SUNDAY': result = 'holy-week'; break;
      case 'MAUNDY_THURSDAY': result = 'holy-week'; break;
      case 'GOOD_FRIDAY': result = 'holy-week'; break;
      case 'EASTER_SUNDAY': result = 'easter'; break;
      case 'PENTECOST_SUNDAY': result = 'pentecost'; break;
      case 'REFORMATION_SUNDAY': result = 'reformation'; break;
      case 'ALL_SAINTS_DAY': result = 'all-saints'; break;
      case 'CHRISTMAS_EVE': result = 'christmas'; break;
      case 'CHRISTMAS_DAY': result = 'christmas'; break;
      case 'TRINITY_SUNDAY': result = 'trinity'; break;
      case 'CHRIST_THE_KING': result = 'christ-king'; break;
      case 'THANKSGIVING': result = 'thanksgiving'; break;
      case 'ADVENT_1': result = 'advent'; break; // Add this case
      default: result = null; break;
    }
    
    // Cache the result
    liturgicalCache.specialDays.set(dateStr, result);
    return result;
  } catch (error) {
    console.error('Error determining special service type:', error);
    liturgicalCache.specialDays.set(dateStr, null);
    return null;
  }
};

export const getHeaderClass = (date) => {
  if (!date) return 'flex items-center justify-between w-full';
  
  // Check cache first
  if (liturgicalCache.headerClasses.has(date)) {
    return liturgicalCache.headerClasses.get(date);
  }
  
  const seasonClass = getSeasonClass(date);
  const specialType = getSpecialServiceType(date);
  
  // Debug output - commented out to reduce console spam
  // console.log(`getHeaderClass for ${date}: Season=${seasonClass}, SpecialType=${specialType}`);
  
  const result = `flex items-center justify-between w-full ${
    seasonClass ? `season-header-${seasonClass}` : ''} ${
    specialType ? `special-service-header special-service-${specialType}` : ''}`;
  
  // Cache the result
  liturgicalCache.headerClasses.set(date, result);
  return result;
};

// Component for displaying special service indicator
export const SpecialServiceIndicator = ({ date }) => {
  const specialType = getSpecialServiceType(date);
  if (!specialType) return null;
  
  const [month, day, year] = date.split('/').map(Number);
  const fullYear = 2000 + year;
  const formattedDate = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const specialDayId = getSpecialDay(new Date(formattedDate));
  if (!specialDayId) return null;
  
  // Set icon and tooltip for each special day type
  let icon = "✨";
  let tooltipText = "Special Service";
  let iconColor = "text-amber-500";
  
  switch(specialDayId) {
    case 'ASH_WEDNESDAY':
      icon = "✝️";
      tooltipText = "Ash Wednesday";
      iconColor = "text-gray-700";
      break;
    case 'PALM_SUNDAY':
      icon = "🌿";
      tooltipText = "Palm Sunday";
      iconColor = "text-red-700";
      break;
    case 'MAUNDY_THURSDAY':
      icon = "🍷";
      tooltipText = "Maundy Thursday";
      iconColor = "text-red-700";
      break;
    case 'GOOD_FRIDAY':
      icon = "✝️";
      tooltipText = "Good Friday";
      iconColor = "text-red-700";
      break;
    case 'EASTER_SUNDAY':
      icon = "🌅";
      tooltipText = "Easter Sunday";
      iconColor = "text-amber-500";
      break;
    case 'PENTECOST_SUNDAY':
      icon = "🔥";
      tooltipText = "Pentecost";
      iconColor = "text-red-600";
      break;
    case 'CHRISTMAS_EVE':
    case 'CHRISTMAS_DAY':
      icon = "⭐";
      tooltipText = "Christmas";
      iconColor = "text-yellow-500";
      break;
    case 'REFORMATION_SUNDAY':
      icon = "⚒️";
      tooltipText = "Reformation";
      iconColor = "text-red-600";
      break;
    case 'ALL_SAINTS_DAY':
      icon = "👑";
      tooltipText = "All Saints";
      iconColor = "text-yellow-600";
      break;
    case 'TRANSFIGURATION':
      icon = "✨";
      tooltipText = "Transfiguration";
      iconColor = "text-white";
      break;
    case 'EPIPHANY':
      icon = "★";
      tooltipText = "Epiphany";
      iconColor = "text-yellow-400";
      break;
    case 'TRINITY_SUNDAY':
      icon = "☩";
      tooltipText = "Trinity Sunday";
      iconColor = "text-white";
      break;
  }
  
  return (
    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200" title={tooltipText}>
      <span className={`text-sm ${iconColor}`}>{icon}</span>
    </div>
  );
};

// Add the following helper at the bottom of the file
export const isTransitionDate = (dateStr) => {
  if (!dateStr) return false;

  try {
    const [month, day, year] = dateStr.split('/').map(Number);
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
    console.error('Error checking transition date:', error);
    return false;
  }
};