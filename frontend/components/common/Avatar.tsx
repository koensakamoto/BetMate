import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import {
  getAvatarColor,
  getInitials as getInitialsUtil,
  getFullImageUrl as getFullImageUrlUtil,
} from '../../utils/avatarUtils';
import { colors } from '../../constants/theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 90,
  xl: 120,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 11,
  sm: 14,
  md: 18,
  lg: 32,
  xl: 42,
};

interface AvatarProps {
  /** Profile image URL (can be relative or absolute) */
  imageUrl?: string | null;
  /** First name for initials */
  firstName?: string | null;
  /** Last name for initials */
  lastName?: string | null;
  /** Username as fallback for initials */
  username?: string | null;
  /** User ID for consistent color generation */
  userId?: number | string | null;
  /** Avatar size preset */
  size?: AvatarSize;
  /** Custom size in pixels (overrides size preset) */
  customSize?: number;
  /** Show online indicator */
  showOnlineIndicator?: boolean;
  /** Is user online */
  isOnline?: boolean;
  /** Custom border color */
  borderColor?: string;
  /** Show border */
  showBorder?: boolean;
  /** Cache-busting timestamp to force image refresh */
  cacheBuster?: number | string;
}

/**
 * Avatar component that displays user profile image or initials fallback.
 *
 * - If imageUrl is provided, displays the image
 * - Otherwise, displays initials on a colored background
 * - Color is deterministic based on userId for consistency
 *
 * Performance: Wrapped with React.memo to prevent unnecessary re-renders.
 * Pass cacheBuster prop only when you need to force image refresh.
 */
export const Avatar = React.memo(function Avatar({
  imageUrl,
  firstName,
  lastName,
  username,
  userId,
  size = 'md',
  customSize,
  showOnlineIndicator = false,
  isOnline = false,
  borderColor,
  showBorder = false,
  cacheBuster,
}: AvatarProps) {
  const avatarSize = customSize || SIZE_MAP[size];
  const fontSize = customSize ? customSize * 0.38 : FONT_SIZE_MAP[size];
  const borderRadius = avatarSize / 2;

  const fullImageUrl = getFullImageUrlUtil(imageUrl, cacheBuster);
  const initials = getInitialsUtil(firstName, lastName, username);
  const backgroundColor = getAvatarColor(userId);

  const containerStyle = [
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius,
    },
    showBorder && {
      borderWidth: 2,
      borderColor: borderColor || colors.border,
    },
  ];

  const onlineIndicatorSize = Math.max(avatarSize * 0.25, 10);

  return (
    <View style={containerStyle}>
      {fullImageUrl ? (
        <Image
          source={{ uri: fullImageUrl, cache: 'default' }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius,
              backgroundColor,
            },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              { fontSize },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {showOnlineIndicator && isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineIndicatorSize,
              height: onlineIndicatorSize,
              borderRadius: onlineIndicatorSize / 2,
              borderWidth: Math.max(onlineIndicatorSize * 0.2, 2),
            },
          ]}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderColor: colors.background,
  },
});

export default Avatar;
