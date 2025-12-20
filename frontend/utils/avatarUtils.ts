import { ENV } from '../config/env';

/**
 * Image size variants for optimized loading.
 * - thumb: 100px - for small avatars in lists
 * - medium: 400px - for profile headers
 * - original: 1200px - for full-screen view
 */
export type ImageSizeVariant = 'thumb' | 'medium' | 'original';

/**
 * Prefixes for thumbnail variants (must match backend ImageProcessingService)
 */
const SIZE_PREFIXES: Record<ImageSizeVariant, string> = {
  thumb: 'thumb_',
  medium: 'medium_',
  original: '',
};

/**
 * Predefined colors for avatar backgrounds - consistent, visually appealing palette.
 * Used for both user avatars and group avatars when no image is provided.
 */
export const AVATAR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
  '#F8B500', // Amber
  '#00D4AA', // App primary color
];

/**
 * Get a consistent background color based on an ID.
 * The same ID will always return the same color.
 *
 * @param id - User ID, group ID, or any numeric/string identifier
 * @returns A hex color string from the AVATAR_COLORS palette
 */
export function getAvatarColor(id: number | string | null | undefined): string {
  if (id === null || id === undefined) {
    return AVATAR_COLORS[0];
  }
  const numericId = typeof id === 'string' ? parseInt(id, 10) || 0 : id;
  return AVATAR_COLORS[numericId % AVATAR_COLORS.length];
}

/**
 * Get a lighter/transparent version of an avatar color for backgrounds.
 *
 * @param id - User ID, group ID, or any numeric/string identifier
 * @param opacity - Opacity value between 0 and 1 (default: 0.2)
 * @returns An rgba color string
 */
export function getAvatarColorWithOpacity(
  id: number | string | null | undefined,
  opacity: number = 0.2
): string {
  const hex = getAvatarColor(id);
  // Convert hex to rgb
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate initials from user name or username.
 *
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param username - User's username (fallback)
 * @returns Uppercase initials (1-2 characters)
 */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  username?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  if (lastName) {
    return lastName.substring(0, 2).toUpperCase();
  }
  if (username) {
    return username.substring(0, 2).toUpperCase();
  }
  return '?';
}

/**
 * Generate initials from a group or entity name.
 *
 * @param name - The name to generate initials from
 * @returns Uppercase initials (1-2 characters)
 */
export function getGroupInitials(name?: string | null): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Resolve an image URL, handling relative paths by prepending the API base URL.
 * Optionally requests a specific size variant (thumbnail) for optimized loading.
 *
 * @param url - Image URL (can be relative or absolute)
 * @param cacheBuster - Optional cache-busting timestamp to force image refresh
 * @param sizeVariant - Optional size variant (thumb, medium, original)
 * @returns Full URL string, or null if no URL provided
 */
export function getFullImageUrl(
  url?: string | null,
  cacheBuster?: number | string,
  sizeVariant?: ImageSizeVariant
): string | null {
  if (!url) return null;

  let processedUrl = url;

  // Apply size variant prefix if specified and URL is a local file path
  if (sizeVariant && sizeVariant !== 'original' && !url.startsWith('http')) {
    const prefix = SIZE_PREFIXES[sizeVariant];
    // URL format: /api/files/profile-pictures/profiles_123_xxx.jpg
    // We need to insert the prefix before the filename
    const lastSlashIndex = processedUrl.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const path = processedUrl.substring(0, lastSlashIndex + 1);
      const filename = processedUrl.substring(lastSlashIndex + 1);
      processedUrl = `${path}${prefix}${filename}`;
    }
  }

  let fullUrl: string;
  if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
    fullUrl = processedUrl;
  } else {
    fullUrl = `${ENV.API_BASE_URL}${processedUrl}`;
  }

  // Add cache-busting parameter if provided
  if (cacheBuster) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}t=${cacheBuster}`;
  }
  return fullUrl;
}

/**
 * Get the appropriate size variant based on the avatar pixel size.
 *
 * @param pixelSize - The size of the avatar in pixels
 * @returns The appropriate size variant
 */
export function getSizeVariantForPixels(pixelSize: number): ImageSizeVariant {
  if (pixelSize <= 100) {
    return 'thumb';
  } else if (pixelSize <= 400) {
    return 'medium';
  }
  return 'original';
}
