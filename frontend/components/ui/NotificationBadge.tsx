import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotificationContext } from '../../contexts/NotificationContext';

interface NotificationBadgeProps {
  size?: number;
  iconColor?: string;
  badgeColor?: string;
  textColor?: string;
  showIcon?: boolean;
  onPress?: () => void;
}

export function NotificationBadge({
  size = 24,
  iconColor = '#ffffff',
  badgeColor = '#00D4AA',
  textColor = '#000000',
  showIcon = true,
  onPress
}: NotificationBadgeProps) {
  const { unreadCount } = useNotificationContext();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/notifications');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        position: 'relative',
        padding: 4
      }}
      activeOpacity={0.7}
    >
      {showIcon && (
        <MaterialIcons
          name="notifications"
          size={size}
          color={iconColor}
        />
      )}

      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: showIcon ? -2 : 0,
            right: showIcon ? -2 : 0,
            backgroundColor: badgeColor,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6,
            borderWidth: 2,
            borderColor: '#0a0a0f' // Background color to create outline effect
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: textColor,
              textAlign: 'center'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface NotificationIconButtonProps extends NotificationBadgeProps {
  style?: any;
  buttonStyle?: any;
}

export function NotificationIconButton({
  size = 20,
  iconColor = '#ffffff',
  badgeColor = '#00D4AA',
  textColor = '#000000',
  style,
  buttonStyle,
  onPress
}: NotificationIconButtonProps) {
  const { unreadCount } = useNotificationContext();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/notifications');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        },
        buttonStyle,
        style
      ]}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name="notifications"
        size={size}
        color={iconColor}
      />

      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: badgeColor,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6,
            borderWidth: 2,
            borderColor: '#0a0a0f'
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: textColor,
              textAlign: 'center'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}