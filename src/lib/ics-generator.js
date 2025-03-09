/**
 * Simple ICS generator for calendar events
 */

export function generateICS(event) {
  // Basic ICS file structure
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZionSync//Service Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id || new Date().getTime()}@zionsync`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(new Date(event.startDate || event.date))}`,
    `DTEND:${formatDate(new Date(event.endDate || getEndDate(event.date)))}`,
    `SUMMARY:${event.title || 'Zion Church Service'}`,
    `DESCRIPTION:${event.description || 'Church service - Please arrive on time for your duties.'}`,
    `LOCATION:${event.location || 'Zion Church'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

// Helper functions
function padNumber(num) {
  return num.toString().padStart(2, '0');
}

function formatDate(date) {
  return date.getUTCFullYear() +
    padNumber(date.getUTCMonth() + 1) +
    padNumber(date.getUTCDate()) + 'T' +
    padNumber(date.getUTCHours()) +
    padNumber(date.getUTCMinutes()) +
    padNumber(date.getUTCSeconds()) + 'Z';
}

function getEndDate(dateString) {
  const date = new Date(dateString);
  // Default to 2 hours later
  date.setHours(date.getHours() + 2);
  return date;
}

export function downloadICSFile(event) {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `church-service-${event.date || 'calendar'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
