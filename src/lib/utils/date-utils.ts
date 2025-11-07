// lib/utils/date-utils.ts

// System timezone cache - will be populated from system settings
let systemTimezone = 'UTC';

/**
 * Initialize system timezone from settings
 * Call this function when your app loads or when settings are fetched
 */
export function setSystemTimezone(timezone: string): void {
  systemTimezone = timezone || 'UTC';
  console.log(`🌍 System timezone set to: ${systemTimezone}`);
}

/**
 * Get current system timezone
 */
export function getSystemTimezone(): string {
  return systemTimezone;
}

/**
 * Format date according to system date format and timezone
 */
export function formatDate(date: Date, dateFormat: string = 'YYYY-MM-DD', timezone?: string): string {
  const targetTimezone = timezone || systemTimezone;
  const dateInTimezone = toTimezone(date, targetTimezone);
  
  const year = dateInTimezone.getFullYear();
  const month = String(dateInTimezone.getMonth() + 1).padStart(2, '0');
  const day = String(dateInTimezone.getDate()).padStart(2, '0');
  const hours = String(dateInTimezone.getHours()).padStart(2, '0');
  const minutes = String(dateInTimezone.getMinutes()).padStart(2, '0');

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
 * Format datetime according to system timezone
 */
export function formatDateTime(date: Date, timezone?: string): string {
  const targetTimezone = timezone || systemTimezone;
  const dateInTimezone = toTimezone(date, targetTimezone);
  
  const year = dateInTimezone.getFullYear();
  const month = String(dateInTimezone.getMonth() + 1).padStart(2, '0');
  const day = String(dateInTimezone.getDate()).padStart(2, '0');
  const hours = String(dateInTimezone.getHours()).padStart(2, '0');
  const minutes = String(dateInTimezone.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format date for datetime-local input (converts to system timezone)
 */
export function formatDateForInput(date: Date, timezone?: string): string {
  const targetTimezone = timezone || systemTimezone;
  const dateInTimezone = toTimezone(date, targetTimezone);
  
  const year = dateInTimezone.getFullYear();
  const month = String(dateInTimezone.getMonth() + 1).padStart(2, '0');
  const day = String(dateInTimezone.getDate()).padStart(2, '0');
  const hours = String(dateInTimezone.getHours()).padStart(2, '0');
  const minutes = String(dateInTimezone.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse date from datetime-local input considering system timezone
 */
export function parseDateFromInput(dateString: string, timezone?: string): Date {
  const targetTimezone = timezone || systemTimezone;
  
  // datetime-local input is in local browser time
  const localDate = new Date(dateString);
  
  if (targetTimezone === 'UTC') {
    // Return as UTC
    return new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes()
    ));
  } else {
    // Convert from local browser time to target timezone
    const localISOString = localDate.toISOString();
    const targetDate = new Date(localISOString);
    
    // Adjust for timezone difference
    const localOffset = localDate.getTimezoneOffset();
    const targetOffset = getTimezoneOffset(targetTimezone);
    const offsetDiff = targetOffset - localOffset;
    
    return new Date(targetDate.getTime() + offsetDiff * 60000);
  }
}

/**
 * Convert date to specific timezone
 */
export function toTimezone(date: Date, timezone: string = 'UTC'): Date {
  if (timezone === 'UTC') {
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes()
    ));
  }
  
  try {
    // Use Intl.DateTimeFormat for reliable timezone conversion
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    const hour = parts.find(part => part.type === 'hour')?.value;
    const minute = parts.find(part => part.type === 'minute')?.value;
    
    if (year && month && day && hour && minute) {
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:00.000Z`);
    }
  } catch (error) {
    console.warn(`Failed to convert to timezone ${timezone}, using UTC:`, error);
  }
  
  // Fallback to UTC
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes()
  ));
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(timezone: string = 'UTC'): number {
  if (timezone === 'UTC') return 0;
  
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
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
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Add minutes to a date in system timezone
 */
export function addMinutes(date: Date, minutes: number, timezone?: string): Date {
  const targetTimezone = timezone || systemTimezone;
  const dateInTimezone = toTimezone(date, targetTimezone);
  const newDate = new Date(dateInTimezone.getTime() + minutes * 60000);
  return toTimezone(newDate, targetTimezone);
}

/**
 * Get current date in system timezone
 */
export function getCurrentSystemDate(): Date {
  return toTimezone(new Date(), systemTimezone);
}
// Add this to your existing date-utils.ts
export const formatSystemDate = (date: Date, includeTime: boolean = false, timezone?: string): string => {
  if (includeTime) {
    return formatDateTime(date, timezone);
  }
  return formatDate(date, 'YYYY-MM-DD', timezone); // Default format for display
};