/**
 * Determines the MIME content type from a filename extension
 */
export const getContentType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };
  return typeMap[ext || ''] || 'image/jpeg';
};
