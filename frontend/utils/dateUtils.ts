/**
 * Date utility functions for handling timezone-aware date operations.
 *
 * Backend stores dates in UTC (as LocalDateTime without timezone info).
 * These utilities ensure proper conversion between UTC storage and local display.
 */

/**
 * Parses a date string from the backend (stored as UTC) into a JavaScript Date object.
 * Backend sends dates like "2025-11-20T21:15:00" which are in UTC.
 *
 * @param dateString - ISO format date string from backend (e.g., "2025-11-20T21:15:00")
 * @returns Date object representing the UTC time
 */
export function parseBackendDate(dateString: string): Date {
  if (!dateString) {
    throw new Error('Invalid date string: empty or null');
  }

  // If the string doesn't end with 'Z', append it to indicate UTC
  const utcString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;

  return new Date(utcString);
}

/**
 * Formats a date string from the backend for display in the user's local timezone.
 *
 * @param dateString - ISO format date string from backend
 * @returns Formatted string like "Nov 20, 2:15 PM" in user's local timezone
 */
export function formatDisplayDate(dateString: string): string {
  try {
    const date = parseBackendDate(dateString);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    // For other dates, show full date
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    return `${dateStr}, ${timeStr}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Fallback to original string
  }
}

/**
 * Formats a Date object for sending to the backend.
 * Converts local date to UTC ISO string.
 *
 * @param date - JavaScript Date object
 * @returns ISO format string in UTC (e.g., "2025-11-20T21:15:00.000Z")
 */
export function formatDateForBackend(date: Date): string {
  return date.toISOString();
}

/**
 * Calculates time remaining from now until a future date.
 *
 * @param dateString - ISO format date string from backend
 * @returns Object with days, hours, minutes, seconds, and formatted string
 */
export function calculateTimeRemaining(dateString: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  formatted: string;
} {
  try {
    const targetDate = parseBackendDate(dateString);
    const now = new Date();
    const total = targetDate.getTime() - now.getTime();

    if (total <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        formatted: 'Ended'
      };
    }

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    let formatted = '';
    if (days > 0) {
      formatted = `${days}d ${hours}h`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s`;
    } else {
      formatted = `${seconds}s`;
    }

    return { days, hours, minutes, seconds, total, formatted };
  } catch (error) {
    console.error('Error calculating time remaining:', error);
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      formatted: 'Invalid date'
    };
  }
}
