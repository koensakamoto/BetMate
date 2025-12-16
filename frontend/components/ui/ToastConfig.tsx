import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BaseToast, ErrorToast, ToastConfig as ToastConfigType } from 'react-native-toast-message';

interface CustomToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
}

interface NotificationToastProps extends CustomToastProps {
  props: {
    notificationType?: string;
    priority?: string;
    onPress?: () => void;
  };
}

// Map notification types to icons and colors
const getNotificationStyle = (notificationType?: string, priority?: string) => {
  const isUrgent = priority === 'HIGH' || priority === 'URGENT';

  // Type-based icon mapping
  const typeConfig: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; color: string }> = {
    // Betting
    BET_RESULT: { icon: 'emoji-events', color: '#FFD700' },
    BET_CREATED: { icon: 'casino', color: '#00D4AA' },
    BET_DEADLINE: { icon: 'schedule', color: '#FFA726' },
    BET_RESOLUTION_REMINDER: { icon: 'alarm', color: '#FFA726' },
    BET_CANCELLED: { icon: 'cancel', color: '#EF4444' },
    // Financial
    CREDITS_RECEIVED: { icon: 'account-balance-wallet', color: '#00D4AA' },
    CREDITS_SPENT: { icon: 'payment', color: '#4A9EFF' },
    DAILY_BONUS: { icon: 'card-giftcard', color: '#FFD700' },
    // Group
    GROUP_INVITE: { icon: 'group-add', color: '#8B5CF6' },
    GROUP_JOIN_REQUEST: { icon: 'person-add', color: '#8B5CF6' },
    GROUP_MEMBER_JOINED: { icon: 'group', color: '#00D4AA' },
    GROUP_MEMBER_LEFT: { icon: 'group-off', color: '#9CA3AF' },
    GROUP_ROLE_CHANGED: { icon: 'admin-panel-settings', color: '#4A9EFF' },
    // Social
    FRIEND_REQUEST: { icon: 'person-add', color: '#FF69B4' },
    FRIEND_REQUEST_ACCEPTED: { icon: 'how-to-reg', color: '#00D4AA' },
    FRIEND_ACTIVITY: { icon: 'people', color: '#4A9EFF' },
    // Messages
    NEW_MESSAGE: { icon: 'chat', color: '#4A9EFF' },
    GROUP_MESSAGE: { icon: 'chat', color: '#4A9EFF' },
    MESSAGE_MENTION: { icon: 'alternate-email', color: '#FFD700' },
    MESSAGE_REPLY: { icon: 'reply', color: '#4A9EFF' },
    // Achievements
    ACHIEVEMENT_UNLOCKED: { icon: 'military-tech', color: '#FFD700' },
    STREAK_MILESTONE: { icon: 'local-fire-department', color: '#FF6B6B' },
    LEVEL_UP: { icon: 'trending-up', color: '#00D4AA' },
    // System
    SYSTEM_ANNOUNCEMENT: { icon: 'campaign', color: '#4A9EFF' },
    MAINTENANCE: { icon: 'build', color: '#FFA726' },
    ACCOUNT_WARNING: { icon: 'warning', color: '#EF4444' },
    WELCOME: { icon: 'celebration', color: '#00D4AA' },
  };

  const config = typeConfig[notificationType || ''] || { icon: 'notifications', color: '#00D4AA' };

  // Override color for urgent notifications
  if (isUrgent) {
    config.color = '#EF4444';
  }

  return config;
};

const SuccessToast = ({ text1, text2 }: CustomToastProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#00D4AA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(0, 212, 170, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name="check-circle" size={22} color="#00D4AA" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const CustomErrorToast = ({ text1, text2 }: CustomToastProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name="error" size={22} color="#FF6B6B" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const InfoToast = ({ text1, text2 }: CustomToastProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#4A9EFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(74, 158, 255, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name="info" size={22} color="#4A9EFF" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const WarningToast = ({ text1, text2 }: CustomToastProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#FFB84D',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 184, 77, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name="warning" size={22} color="#FFB84D" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const NotificationToast = ({ text1, text2, props }: NotificationToastProps) => {
  const insets = useSafeAreaInsets();
  const { notificationType, priority, onPress } = props || {};
  const { icon, color } = getNotificationStyle(notificationType, priority);

  const content = (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: color,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${color}25`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
      {onPress && (
        <MaterialIcons name="chevron-right" size={24} color="rgba(255, 255, 255, 0.4)" />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export const toastConfig: ToastConfigType = {
  success: (props) => <SuccessToast text1={props.text1} text2={props.text2} />,
  error: (props) => <CustomErrorToast text1={props.text1} text2={props.text2} />,
  info: (props) => <InfoToast text1={props.text1} text2={props.text2} />,
  warning: (props) => <WarningToast text1={props.text1} text2={props.text2} />,
  notification: (toastProps) => (
    <NotificationToast
      text1={toastProps.text1}
      text2={toastProps.text2}
      props={toastProps.props}
    />
  ),
};
