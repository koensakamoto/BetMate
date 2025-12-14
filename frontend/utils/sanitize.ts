/**
 * Security: Input sanitization utilities for user-generated content.
 * Prevents XSS attacks and other injection vulnerabilities when displaying user content.
 */

/**
 * HTML entities that should be escaped to prevent XSS.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Regex pattern for matching HTML special characters.
 */
const HTML_SPECIAL_CHARS_REGEX = /[&<>"'`=/]/g;

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Use this when displaying user-generated content in the UI.
 *
 * @param input - The string to sanitize
 * @returns The sanitized string with HTML entities escaped
 *
 * @example
 * sanitizeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 */
export const sanitizeHtml = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input !== 'string') {
    return String(input);
  }

  return input.replace(HTML_SPECIAL_CHARS_REGEX, (char) => HTML_ENTITIES[char] || char);
};

/**
 * Removes potentially dangerous characters and patterns from user input.
 * More aggressive than sanitizeHtml - strips rather than escapes.
 *
 * @param input - The string to clean
 * @returns The cleaned string
 */
export const stripDangerousChars = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input !== 'string') {
    return String(input);
  }

  // Remove null bytes, control characters, and other dangerous patterns
  return input
    .replace(/\0/g, '') // Null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters (except \t, \n, \r)
    .replace(/javascript:/gi, '') // javascript: protocol
    .replace(/data:/gi, '') // data: protocol
    .replace(/vbscript:/gi, ''); // vbscript: protocol
};

/**
 * Sanitizes a username for display.
 * Allows alphanumeric characters, underscores, and hyphens.
 *
 * @param username - The username to sanitize
 * @param maxLength - Maximum allowed length (default: 50)
 * @returns The sanitized username
 */
export const sanitizeUsername = (
  username: string | null | undefined,
  maxLength: number = 50
): string => {
  if (username === null || username === undefined) {
    return '';
  }

  if (typeof username !== 'string') {
    return '';
  }

  // Keep only safe characters for usernames
  const sanitized = username
    .trim()
    .replace(/[^a-zA-Z0-9_\-. ]/g, '')
    .slice(0, maxLength);

  return sanitized;
};

/**
 * Sanitizes message content for safe display.
 * Preserves legitimate characters while removing dangerous ones.
 *
 * @param content - The message content to sanitize
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns The sanitized content
 */
export const sanitizeMessageContent = (
  content: string | null | undefined,
  maxLength: number = 10000
): string => {
  if (content === null || content === undefined) {
    return '';
  }

  if (typeof content !== 'string') {
    return String(content);
  }

  // Strip dangerous characters but preserve normal text
  const cleaned = stripDangerousChars(content);

  // Trim and limit length
  return cleaned.trim().slice(0, maxLength);
};

/**
 * Validates and sanitizes a URL for safe usage.
 * Only allows http and https protocols.
 *
 * @param url - The URL to validate and sanitize
 * @returns The sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (url === null || url === undefined) {
    return '';
  }

  if (typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  // Only allow http and https protocols
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return '';
  }

  // Basic URL validation
  try {
    const parsed = new URL(trimmed);
    // Only return if protocol is http or https
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // Invalid URL
  }

  return '';
};

/**
 * Sanitizes a numeric ID to ensure it's a valid positive integer.
 *
 * @param id - The ID to sanitize (string or number)
 * @returns The sanitized numeric ID or null if invalid
 */
export const sanitizeNumericId = (id: string | number | null | undefined): number | null => {
  if (id === null || id === undefined) {
    return null;
  }

  const parsed = typeof id === 'number' ? id : parseInt(String(id), 10);

  if (isNaN(parsed) || parsed <= 0 || !Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};
