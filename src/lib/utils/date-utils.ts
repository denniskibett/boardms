// lib/utils/date-utils.ts

// System timezone cache - will be populated from system settings
let systemTimezone = 'Africa/Nairobi';

/**
 * Initialize system timezone from settings
 */
export function setSystemTimezone(timezone: string): void {
  systemTimezone = timezone || 'Africa/Nairobi';
  console.log(`🌍 System timezone set to: ${systemTimezone}`);
}

/**
 * Get current system timezone
 */
export function getSystemTimezone(): string {
  return systemTimezone;
}

/**
 * Format time according to system timezone with seconds and 12/24 hour format
 */
export function formatTime(date: Date, timezone?: string, hour12: boolean = false): string {
  const targetTimezone = timezone || systemTimezone;
  return date.toLocaleTimeString('en-US', {
    timeZone: targetTimezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: hour12
  });
}

/**
 * Format date according to system date format and timezone
 */
export function formatDate(date: Date, dateFormat: string = 'DD/MM/YYYY', timezone?: string): string {
  const targetTimezone = timezone || systemTimezone;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';

  switch (dateFormat) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Format datetime according to system timezone with time
 */
export function formatDateTime(date: Date, timezone?: string, dateFormat: string = 'DD/MM/YYYY', hour12: boolean = false): string {
  const formattedDate = formatDate(date, dateFormat, timezone);
  const formattedTime = formatTime(date, timezone, hour12);
  return `${formattedDate} ${formattedTime}`;
}

/**
 * Format date for datetime-local input (converts UTC to local for input)
 */
export function formatDateForInput(date: Date, timezone?: string): string {
  const targetTimezone = timezone || systemTimezone;
  
  // Convert UTC date to system timezone for input
  const options: Intl.DateTimeFormatOptions = {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Parse date from datetime-local input and convert to UTC for storage
 */
export function parseDateFromInput(dateString: string, timezone?: string): Date {
  const targetTimezone = timezone || systemTimezone;
  
  // Parse the input date string (YYYY-MM-DDTHH:mm)
  const [datePart, timePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Create a date string in ISO format
  const isoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000Z`;
  
  // Return as UTC date
  return new Date(isoString);
}

/**
 * Convert UTC date to system timezone for display
 */
export function toTimezone(date: Date, timezone?: string): Date {
  const targetTimezone = timezone || systemTimezone;
  
  // Create a new date that represents the same moment in the target timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(timezone: string = 'UTC'): number {
  if (timezone === 'UTC') return 0;
  
  try {
    const date = new Date();
    const utcString = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzString = date.toLocaleString('en-US', { timeZone: timezone });
    
    const utcDate = new Date(utcString);
    const tzDate = new Date(tzString);
    
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  } catch (error) {
    console.warn(`Failed to get offset for timezone ${timezone}:`, error);
    return 0;
  }
}

/**
 * Check if two dates are on the same day in system timezone
 */
export function isSameDay(date1: Date, date2: Date, timezone?: string): boolean {
  const targetTimezone = timezone || systemTimezone;
  const d1 = toTimezone(date1, targetTimezone);
  const d2 = toTimezone(date2, targetTimezone);
  
  return d1.getUTCFullYear() === d2.getUTCFullYear() &&
         d1.getUTCMonth() === d2.getUTCMonth() &&
         d1.getUTCDate() === d2.getUTCDate();
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Get current date in UTC
 */
export function getCurrentSystemDate(): Date {
  return new Date();
}