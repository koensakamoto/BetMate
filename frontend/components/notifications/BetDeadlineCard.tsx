import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface BetDeadlineCardProps {
  notification: {
    id: number;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    relatedEntityId?: number;
    actionUrl?: string;
  };
  onPress: () => void;
}

export const BetDeadlineCard: React.FC<BetDeadlineCardProps> = ({ notification, onPress }) => {
  // Extract bet details from message
  const extractBetTitle = (message: string) => {
    const match = message.match(/'([^']+)'/);
    return match ? match[1] : 'Bet';
  };

  // Determine if this is a resolution deadline or betting deadline
  const isResolutionDeadline = (title: string, message: string) => {
    return title.toLowerCase().includes('resolution') ||
           message.toLowerCase().includes('resolve');
  };

  const extractTimeInfo = (message: string, title: string) => {
    const hourMatch = message.match(/(\d+)\s*hour/i);
    const minuteMatch = message.match(/(\d+)\s*minute/i);
    const isResolution = isResolutionDeadline(title, message);

    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);

      // 1 hour notifications
      if (hours === 1) {
        return {
          displayTitle: isResolution ? 'Resolution due now' : 'Final hour to bet',
          displayMessage: isResolution
            ? 'must be resolved within the hour'
            : 'closes in less than 1 hour',
          isUrgent: true
        };
      }

      // 24 hour notifications
      if (hours >= 23 && hours <= 25) {
        return {
          displayTitle: isResolution ? 'Resolution due tomorrow' : '24 hours to bet',
          displayMessage: isResolution
            ? 'needs to be resolved'
            : 'closes tomorrow',
          isUrgent: false
        };
      }

      // Other hour notifications
      return {
        displayTitle: isResolution ? `Resolution due in ${hours}h` : `${hours} hours to bet`,
        displayMessage: isResolution
          ? `needs to be resolved in ${hours} hours`
          : `closes in ${hours} hours`,
        isUrgent: hours <= 2
      };
    }

    if (minuteMatch) {
      const minutes = parseInt(minuteMatch[1]);
      return {
        displayTitle: isResolution ? 'Resolution due now' : 'Final minutes to bet',
        displayMessage: isResolution
          ? `must be resolved in ${minutes} minutes`
          : `closes in ${minutes} minutes`,
        isUrgent: true
      };
    }

    return {
      displayTitle: isResolution ? 'Resolution due' : 'Closing soon',
      displayMessage: isResolution ? 'needs resolution' : 'closing soon',
      isUrgent: true
    };
  };

  const betTitle = extractBetTitle(notification.message);
  const timeInfo = extractTimeInfo(notification.message, notification.title);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const isResolution = isResolutionDeadline(notification.title, notification.message);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        notification.isRead && styles.readContainer
      ]}
    >
      {/* Icon */}
      <MaterialIcons
        name={isResolution ? "gavel" : "schedule"}
        size={16}
        color={timeInfo.isUrgent ? '#FF4444' : '#FFB800'}
        style={{ marginRight: 10 }}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Header Row - Title and Timestamp */}
        <View style={styles.header}>
          <Text style={styles.displayTitle} numberOfLines={1}>
            {timeInfo.displayTitle}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.timestamp}>{timeAgo}</Text>
            {!notification.isRead && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>

        {/* Bet Title with Message */}
        <Text style={styles.betMessage} numberOfLines={2}>
          {betTitle} {timeInfo.displayMessage}
        </Text>
      </View>

      {/* Chevron indicator */}
      <MaterialIcons
        name="chevron-right"
        size={18}
        color="rgba(255, 255, 255, 0.2)"
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 6,
  },
  readContainer: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  unreadDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00D4AA',
  },
  displayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  betMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  chevron: {
    marginLeft: 6,
  },
});
