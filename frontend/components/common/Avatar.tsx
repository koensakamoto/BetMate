import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { ENV } from '../../config/env';

// Predefined colors for avatar backgrounds - consistent, visually appealing palette
const AVATAR_COLORS = [
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
}

/**
 * Avatar component that displays user profile image or initials fallback.
 *
 * - If imageUrl is provided, displays the image
 * - Otherwise, displays initials on a colored background
 * - Color is deterministic based on userId for consistency
 */
export function Avatar({
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
}: AvatarProps) {
  const avatarSize = customSize || SIZE_MAP[size];
  const fontSize = customSize ? customSize * 0.38 : FONT_SIZE_MAP[size];
  const borderRadius = avatarSize / 2;

  // Get initials from name or username
  const getInitials = (): string => {
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
  };

  // Get consistent color based on userId
  const getBackgroundColor = (): string => {
    if (!userId) {
      return AVATAR_COLORS[0];
    }
    const numericId = typeof userId === 'string' ? parseInt(userId, 10) || 0 : userId;
    return AVATAR_COLORS[numericId % AVATAR_COLORS.length];
  };

  // Resolve image URL (handle relative paths)
  const getFullImageUrl = (): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${ENV.API_BASE_URL}${imageUrl}`;
  };

  const fullImageUrl = getFullImageUrl();
  const initials = getInitials();
  const backgroundColor = getBackgroundColor();

  const containerStyle = [
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius,
    },
    showBorder && {
      borderWidth: 2,
      borderColor: borderColor || 'rgba(255, 255, 255, 0.1)',
    },
  ];

  const onlineIndicatorSize = Math.max(avatarSize * 0.25, 10);

  return (
    <View style={containerStyle}>
      {fullImageUrl ? (
        <Image
          source={{ uri: fullImageUrl }}
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
}

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
    color: '#FFFFFF',
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00D4AA',
    borderColor: '#0a0a0f',
  },
});

export default Avatar;
