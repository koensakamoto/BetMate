/**
 * Shared utility functions for member/user display and activity formatting
 */

/**
 * Check if a user is considered online (active within last 5 minutes)
 */
export const isOnline = (lastActivityAt?: string | null): boolean => {
  if (!lastActivityAt) return false;
  const lastActivity = new Date(lastActivityAt);
  const now = new Date();
  const minutesDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
  return minutesDiff <= 5;
};

/**
 * Generic type for member/user with display name fields
 */
interface DisplayNameFields {
  displayName?: string | null;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Get display name with fallback to username or firstName/lastName
 */
export const getDisplayName = (user: DisplayNameFields): string => {
  // First try displayName
  if (user.displayName) return user.displayName;

  // Then try firstName + lastName
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;

  // Finally fall back to username
  return user.username || 'Unknown';
};

/**
 * Format a date as relative time for join dates (e.g., "2 months ago")
 */
export const formatJoinDate = (dateString: string): string => {
  const joinDate = new Date(dateString);
  const now = new Date();

  // Check if same day
  if (joinDate.toDateString() === now.toDateString()) return 'today';

  // Calculate year, month, and day differences
  let years = now.getFullYear() - joinDate.getFullYear();
  let months = now.getMonth() - joinDate.getMonth();

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  // Return formatted string based on time difference
  if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;

  // For days, calculate total days difference
  const totalDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  if (totalDays === 1) return 'yesterday';
  return `${totalDays} day${totalDays > 1 ? 's' : ''} ago`;
};

/**
 * Format last activity time as relative string
 */
export const formatLastActivity = (lastActivityAt?: string | null): string => {
  if (!lastActivityAt) return 'Never';

  if (isOnline(lastActivityAt)) return 'Online';

  const lastActivity = new Date(lastActivityAt);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - lastActivity.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
};
