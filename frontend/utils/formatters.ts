/**
 * Formats a number for display
 * Numbers >= 1000 are displayed with 'K' suffix (e.g., 1.5K)
 * Undefined/null values are displayed as '0'
 */
export const formatNumber = (num?: number): string => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Formats a percentage for display
 * Rounds to nearest integer and adds '%' suffix
 * Undefined/null values are displayed as '0%'
 */
export const formatPercentage = (percentage?: number): string => {
  if (percentage === undefined || percentage === null) return '0%';
  return Math.round(percentage) + '%';
};
