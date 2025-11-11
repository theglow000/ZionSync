/**
 * Application-wide Constants
 * Single source of truth for all constant values across the application
 */

// ===========================
// TIMING CONSTANTS
// ===========================

export const POLLING_INTERVAL = 30000; // 30 seconds - for service details polling
export const ALERT_DURATION = 3000; // 3 seconds - default alert display time

// Debounce delays for different action types (in milliseconds)
export const DEBOUNCE_DELAYS = {
  USER_ACTION: 300,        // User management, quick actions
  ASSIGNMENT: 300,         // Service assignments
  SONG_SELECTION: 500,     // Song selection (more complex)
  STATUS_TOGGLE: 500,      // Completion status toggles
};

// ===========================
// COLOR THEMES BY TEAM
// ===========================

export const COLOR_THEMES = {
  PRESENTATION: {
    name: 'Presentation',
    primary: '#6B8E23',
    primaryDark: '#556B2F',
    bg: 'bg-[#6B8E23]',
    bgDark: 'bg-[#556B2F]',
    text: 'text-[#6B8E23]',
    border: 'border-[#6B8E23]',
    borderDark: 'border-[#556B2F]',
    hover: 'hover:bg-[#6B8E23]',
  },
  WORSHIP: {
    name: 'Worship',
    primary: '#9333EA',
    primaryDark: '#7E22CE',
    bg: 'bg-purple-700',
    bgDark: 'bg-purple-800',
    text: 'text-purple-700',
    border: 'border-purple-700',
    borderDark: 'border-purple-800',
    hover: 'hover:bg-purple-700',
  },
  AV: {
    name: 'A/V',
    primary: '#DC2626',
    primaryDark: '#B91C1C',
    bg: 'bg-red-700',
    bgDark: 'bg-red-800',
    text: 'text-red-700',
    border: 'border-red-700',
    borderDark: 'border-red-800',
    hover: 'hover:bg-red-700',
  },
};

// ===========================
// DATES FOR 2025
// ===========================

export const DATES_2025 = [
  { date: '1/5/25', day: 'Sunday', title: 'Epiphany' },
  { date: '1/12/25', day: 'Sunday', title: 'Baptism of our Lord' },
  { date: '1/19/25', day: 'Sunday', title: 'Epiphany Week 2' },
  { date: '1/26/25', day: 'Sunday', title: 'Epiphany Week 3' },
  { date: '2/2/25', day: 'Sunday', title: 'Presentation of Our Lord' },
  { date: '2/9/25', day: 'Sunday', title: 'Epiphany Week 5' },
  { date: '2/16/25', day: 'Sunday', title: 'Epiphany Week 6' },
  { date: '2/23/25', day: 'Sunday', title: 'Epiphany Week 7' },
  { date: '3/2/25', day: 'Sunday', title: 'The Transfiguration of Our Lord' },
  { date: '3/5/25', day: 'Wednesday', title: 'Ash Wednesday' },
  { date: '3/9/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '3/12/25', day: 'Wednesday', title: 'Lent Worship' },
  { date: '3/16/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '3/19/25', day: 'Wednesday', title: 'Lent Worship' },
  { date: '3/23/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '3/26/25', day: 'Wednesday', title: 'Lent Worship' },
  { date: '3/30/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '4/2/25', day: 'Wednesday', title: 'Lent Worship' },
  { date: '4/6/25', day: 'Sunday', title: 'Palm Sunday' },
  { date: '4/10/25', day: 'Thursday', title: 'Maundy Thursday' },
  { date: '4/11/25', day: 'Friday', title: 'Good Friday' },
  { date: '4/13/25', day: 'Sunday', title: 'Easter Sunday' },
  { date: '4/20/25', day: 'Sunday', title: 'Easter Week 2' },
  { date: '4/27/25', day: 'Sunday', title: 'Easter Week 3' },
  { date: '5/4/25', day: 'Sunday', title: 'Easter Week 4' },
  { date: '5/11/25', day: 'Sunday', title: 'Easter Week 5' },
  { date: '5/18/25', day: 'Sunday', title: 'Easter Week 6' },
  { date: '5/25/25', day: 'Sunday', title: 'Easter Week 7' },
  { date: '6/1/25', day: 'Sunday', title: 'Pentecost' },
  { date: '6/8/25', day: 'Sunday', title: 'Holy Trinity Sunday' },
  { date: '6/15/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '6/22/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '6/29/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '7/6/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '7/13/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '7/20/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '7/27/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '8/3/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '8/10/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '8/17/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '8/24/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '8/31/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '9/7/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '9/14/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '9/21/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '9/28/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '10/5/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '10/12/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '10/19/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '10/26/25', day: 'Sunday', title: 'Reformation Sunday' },
  { date: '11/2/25', day: 'Sunday', title: 'All Saint\'s Day' },
  { date: '11/9/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '11/16/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '11/23/25', day: 'Sunday', title: 'Christ the King' },
  { date: '11/26/25', day: 'Wednesday', title: 'Thanksgiving Eve' },
  { date: '11/30/25', day: 'Sunday', title: 'Advent 1' },
  { date: '12/7/25', day: 'Sunday', title: 'Advent 2' },
  { date: '12/14/25', day: 'Sunday', title: 'Advent 3' },
  { date: '12/21/25', day: 'Sunday', title: 'Advent 4 (Kid\'s Christmas Program)' },
  { date: '12/24/25', day: 'Wednesday', title: 'Christmas Eve Services (3pm & 7pm)' },
  { date: '12/28/25', day: 'Sunday', title: 'Christmas Week 1' }
];

// ===========================
// A/V TEAM SPECIFIC
// ===========================

export const AV_ROTATION_MEMBERS = ['Doug', 'Jaimes', 'Justin', 'Brett'];

// ===========================
// API ENDPOINTS
// ===========================

export const API_ENDPOINTS = {
  // User endpoints
  USERS: '/api/users',
  WORSHIP_USERS: '/api/users/worship',
  AV_USERS: '/api/av-users',
  
  // Service endpoints
  SIGNUPS: '/api/signups',
  SERVICE_DETAILS: '/api/service-details',
  SERVICE_SONGS: '/api/service-songs',
  COMPLETED: '/api/completed',
  CUSTOM_SERVICES: '/api/custom-services',
  UPCOMING_SERVICES: '/api/upcoming-services',
  
  // Song endpoints
  SONGS: '/api/songs',
  SONGS_MERGE: '/api/songs/merge',
  REFERENCE_SONGS: '/api/reference-songs',
  REFERENCE_SONGS_IMPORT: '/api/reference-songs/import',
  SONG_USAGE: '/api/song-usage',
  SONG_USAGE_ANALYTICS: '/api/song-usage/analytics',
  
  // Team endpoints
  AV_TEAM: '/api/av-team',
  WORSHIP_ASSIGNMENTS: '/api/worship-assignments',
};

// ===========================
// VALIDATION CONSTANTS
// ===========================

export const VALIDATION = {
  USERNAME_MIN_LENGTH: 2,
  USERNAME_MAX_LENGTH: 50,
  INVALID_CHARS_REGEX: /[<>{}[\]\\\/]/,
};

// ===========================
// UI CONSTANTS
// ===========================

export const MODAL_Z_INDEX = {
  ALERT: 200,
  MODAL: 100,
  DROPDOWN: 50,
};

export const BREAKPOINTS = {
  MOBILE: 768, // px - matches Tailwind's md breakpoint
};

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Get theme colors by team name
 * @param {string} team - 'presentation', 'worship', or 'av'
 * @returns {Object} Theme color object
 */
export const getTeamTheme = (team) => {
  const teamKey = team.toUpperCase();
  return COLOR_THEMES[teamKey] || COLOR_THEMES.PRESENTATION;
};

/**
 * Format date for display
 * @param {string} dateStr - Date string in format "M/D/YY"
 * @returns {string} Formatted date
 */
export const formatServiceDate = (dateStr) => {
  const [month, day, year] = dateStr.split('/');
  const fullYear = 2000 + parseInt(year);
  const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export default {
  POLLING_INTERVAL,
  ALERT_DURATION,
  DEBOUNCE_DELAYS,
  COLOR_THEMES,
  DATES_2025,
  AV_ROTATION_MEMBERS,
  API_ENDPOINTS,
  VALIDATION,
  MODAL_Z_INDEX,
  BREAKPOINTS,
  getTeamTheme,
  formatServiceDate,
};
