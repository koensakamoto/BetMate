import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  fullWidth?: boolean;
}

export default function AuthButton({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true
}: AuthButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: size === 'small' ? 8 : 12,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: size === 'small' ? 12 : size === 'medium' ? 16 : 20,
      paddingVertical: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
      opacity: (disabled || loading) ? 0.6 : 1,
      width: fullWidth ? ('100%' as const) : undefined,
      minWidth: fullWidth ? undefined : 100,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: '#00D4AA',
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: '#00D4AA',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseStyle = {
      fontSize: size === 'small' ? 13 : size === 'medium' ? 14 : 16,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
      color: '#000000',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: '#000000',
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: '#ffffff',
        };
      case 'outline':
        return {
          ...baseStyle,
          color: '#00D4AA',
        };
      default:
        return baseStyle;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${title}, loading` : title}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      accessibilityHint={isDisabled ? undefined : `Double tap to ${title.toLowerCase()}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#000000' : '#ffffff'}
          accessible={false}
        />
      ) : (
        <>
          {icon && (
            <MaterialIcons
              name={icon}
              size={size === 'small' ? 16 : 18}
              color={getTextStyle().color}
              style={{ marginRight: 8 }}
              accessible={false}
            />
          )}
          <Text style={getTextStyle()} accessible={false}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}