import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { getFullImageUrl, getSizeVariantForPixels, ImageSizeVariant } from '../../utils/avatarUtils';

interface OptimizedImageProps {
  /** Image source - can be a URL string (relative or absolute) or require() for local assets */
  source: string | number | null | undefined;
  /** Width of the image */
  width: number | `${number}%`;
  /** Height of the image (or use aspectRatio instead) */
  height?: number | `${number}%`;
  /** Aspect ratio (width/height) - alternative to height */
  aspectRatio?: number;
  /** Border radius */
  borderRadius?: number;
  /** How the image should be resized to fit its container */
  contentFit?: ImageContentFit;
  /** Transition duration in ms (default: 50) */
  transition?: number;
  /** Custom blurhash placeholder */
  blurhash?: string;
  /** Disable blurhash placeholder */
  disablePlaceholder?: boolean;
  /** Priority loading for above-the-fold images */
  priority?: 'low' | 'normal' | 'high';
  /** Cache-busting timestamp to force image refresh */
  cacheBuster?: number | string;
  /** Override automatic size variant selection */
  sizeVariant?: ImageSizeVariant;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Recycling key for list optimization */
  recyclingKey?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * OptimizedImage - A high-performance image component built on expo-image.
 *
 * Features:
 * - Memory + disk caching for instant reloads
 * - Blurhash placeholders for smooth loading experience
 * - Automatic size variant selection for bandwidth optimization
 * - Smooth fade-in transitions
 * - List recycling optimization
 *
 * @example
 * // Basic usage with URL
 * <OptimizedImage
 *   source="/api/files/profile-pictures/image.jpg"
 *   width={200}
 *   aspectRatio={16/9}
 * />
 *
 * @example
 * // With fixed dimensions
 * <OptimizedImage
 *   source="https://example.com/image.jpg"
 *   width={100}
 *   height={100}
 *   borderRadius={8}
 * />
 *
 * @example
 * // Local asset
 * <OptimizedImage
 *   source={require('../../assets/images/logo.png')}
 *   width={120}
 *   height={40}
 *   contentFit="contain"
 * />
 */
export const OptimizedImage = React.memo(function OptimizedImage({
  source,
  width,
  height,
  aspectRatio,
  borderRadius = 0,
  contentFit = 'cover',
  transition = 50,
  blurhash,
  disablePlaceholder = true,
  priority = 'normal',
  cacheBuster,
  sizeVariant,
  onError,
  onLoad,
  style,
  recyclingKey,
  accessibilityLabel,
}: OptimizedImageProps) {
  // Determine size variant for network images
  const numericWidth = typeof width === 'number' ? width : 400; // fallback for percentage
  const autoSizeVariant = getSizeVariantForPixels(numericWidth);
  const finalSizeVariant = sizeVariant ?? autoSizeVariant;

  // Resolve the image source
  const resolvedSource = React.useMemo(() => {
    // Local require() asset
    if (typeof source === 'number') {
      return source;
    }
    // URL string
    if (typeof source === 'string') {
      return getFullImageUrl(source, cacheBuster, finalSizeVariant);
    }
    // null/undefined
    return null;
  }, [source, cacheBuster, finalSizeVariant]);

  if (!resolvedSource) {
    return null;
  }

  const imageStyle = {
    width,
    height: height ?? (aspectRatio ? undefined : width),
    aspectRatio,
    borderRadius,
  };

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <Image
        source={resolvedSource}
        style={imageStyle}
        contentFit={contentFit}
        transition={transition}
        cachePolicy="memory-disk"
        recyclingKey={recyclingKey}
        priority={priority}
        placeholder={disablePlaceholder || !blurhash ? undefined : { blurhash }}
        onError={onError}
        onLoad={onLoad}
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default OptimizedImage;
