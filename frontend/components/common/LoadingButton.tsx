import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';

interface LoadingButtonProps {
  onPress: () => void | Promise<void>;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingColor?: string;
  activeOpacity?: number;
}

/**
 * Reusable button component with integrated loading state
 *
 * Features:
 * - Shows spinner when loading
 * - Automatically disables when loading
 * - Prevents double-clicks
 * - Customizable styling
 *
 * Usage:
 * <LoadingButton
 *   title="Create Bet"
 *   loading={isCreating}
 *   onPress={handleCreate}
 *   style={{ backgroundColor: '#00D4AA' }}
 * />
 */
export default function LoadingButton({
  onPress,
  title,
  loading = false,
  disabled = false,
  style,
  textStyle,
  loadingColor = '#ffffff',
  activeOpacity = 0.7
}: LoadingButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${title}, loading` : title}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      accessibilityHint={isDisabled ? undefined : `Double tap to ${title.toLowerCase()}`}
      style={[
        {
          backgroundColor: isDisabled ? 'rgba(255, 255, 255, 0.08)' : '#00D4AA',
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          minHeight: 56,
        },
        style,
        isDisabled && { opacity: 0.6 }
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={loadingColor}
          style={{ marginRight: 8 }}
          accessible={false}
        />
      )}
      <Text
        style={[
          {
            fontSize: 16,
            fontWeight: '700',
            color: isDisabled ? 'rgba(255, 255, 255, 0.6)' : '#000000'
          },
          textStyle
        ]}
        accessible={false}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
}
