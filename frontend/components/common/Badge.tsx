import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export type BadgeVariant =
  | 'primary'    // Green - default, joined, success
  | 'success'    // Green - fulfilled, active
  | 'warning'    // Yellow/Orange - partial, pending
  | 'info'       // Blue - insurance, info
  | 'admin'      // Gold - admin role
  | 'owner'      // Orange - owner role
  | 'error'      // Red - errors
  | 'muted';     // Gray - disabled, inactive

export type BadgeSize = 'small' | 'medium';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof MaterialIcons.glyphMap;
  showBorder?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  primary: {
    bg: colors.primaryLight,
    text: colors.primary,
    border: 'transparent'
  },
  success: {
    bg: 'rgba(0, 212, 170, 0.15)',
    text: '#00D4AA',
    border: 'rgba(0, 212, 170, 0.3)'
  },
  warning: {
    bg: 'rgba(255, 166, 38, 0.15)',
    text: '#FFA626',
    border: 'rgba(255, 166, 38, 0.3)'
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#3B82F6',
    border: 'rgba(59, 130, 246, 0.3)'
  },
  admin: {
    bg: 'rgba(255, 215, 0, 0.2)',
    text: '#FFD700',
    border: 'transparent'
  },
  owner: {
    bg: 'rgba(255, 140, 0, 0.2)',
    text: '#FF8C00',
    border: 'transparent'
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#EF4444',
    border: 'rgba(239, 68, 68, 0.3)'
  },
  muted: {
    bg: 'rgba(255, 255, 255, 0.08)',
    text: 'rgba(255, 255, 255, 0.5)',
    border: 'transparent'
  }
};

const sizeStyles: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number; iconSize: number; borderRadius: number }> = {
  small: {
    paddingH: 6,
    paddingV: 2,
    fontSize: 10,
    iconSize: 10,
    borderRadius: 4
  },
  medium: {
    paddingH: 12,
    paddingV: 6,
    fontSize: 12,
    iconSize: 14,
    borderRadius: 16
  }
};

export function Badge({
  label,
  variant = 'primary',
  size = 'medium',
  icon,
  showBorder = false
}: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const containerStyle: ViewStyle = {
    backgroundColor: variantStyle.bg,
    paddingHorizontal: sizeStyle.paddingH,
    paddingVertical: sizeStyle.paddingV,
    borderRadius: sizeStyle.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...(showBorder && {
      borderWidth: 1,
      borderColor: variantStyle.border
    })
  };

  const textStyle: TextStyle = {
    fontSize: sizeStyle.fontSize,
    fontWeight: '600',
    color: variantStyle.text
  };

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {icon && (
        <MaterialIcons name={icon} size={sizeStyle.iconSize} color={variantStyle.text} accessible={false} />
      )}
      <Text style={textStyle} accessible={false}>{label}</Text>
    </View>
  );
}

export default Badge;
