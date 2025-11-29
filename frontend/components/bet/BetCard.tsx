import React, { useCallback } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { colors } from '../../constants/theme';

interface ParticipantPreview {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface BetCardProps {
  id: string;
  title: string;
  description: string;
  timeRemaining: string;
  resolveTimeRemaining?: string;
  isUrgent?: boolean; // true if < 24h remaining until betting deadline
  isResolveUrgent?: boolean; // true if < 24h remaining until resolve deadline
  participantCount: number;
  participantPreviews?: ParticipantPreview[];
  stakeAmount: number;
  stakeType?: 'CREDIT' | 'SOCIAL'; // Type of stake
  socialStakeDescription?: string; // Description for social bets
  yourPosition?: string;
  status: 'open' | 'active' | 'resolved';
  backendStatus?: string; // Original backend status (OPEN, CLOSED, RESOLVED, CANCELLED)
  isJoined: boolean;
  creatorName: string;
  resolution?: string;
  showJoinedIndicator?: boolean; // Defaults to true if not provided
  userStake?: number; // User's personal stake amount if they've joined
  fulfillmentStatus?: 'PENDING' | 'PARTIALLY_FULFILLED' | 'FULFILLED'; // For resolved social bets
  hasInsurance?: boolean; // Whether insurance is applied to this bet
  insuranceRefundPercentage?: number; // Refund percentage (25, 50, or 75)
}

function BetCard({
  id,
  title,
  description,
  timeRemaining,
  resolveTimeRemaining,
  isUrgent = false,
  isResolveUrgent = false,
  participantCount,
  participantPreviews,
  stakeAmount,
  stakeType = 'CREDIT',
  socialStakeDescription,
  yourPosition,
  status,
  backendStatus,
  isJoined,
  creatorName,
  resolution,
  showJoinedIndicator = true,
  userStake,
  fulfillmentStatus,
  hasInsurance = false,
  insuranceRefundPercentage
}: BetCardProps) {

  const handlePress = useCallback(() => {
    // Navigate to bet details
    router.push(`/(app)/bet-details/${id}`);
  }, [id]);


  // Get fulfillment badge variant and text
  const getFulfillmentBadgeInfo = useCallback((status: string): { variant: 'success' | 'warning' | 'muted'; label: string } => {
    switch (status) {
      case 'FULFILLED':
        return { variant: 'success', label: 'Fulfilled' };
      case 'PARTIALLY_FULFILLED':
        return { variant: 'warning', label: 'Partial' };
      default:
        return { variant: 'muted', label: 'Pending' };
    }
  }, []);

  const statusText = status === 'resolved' ? 'resolved' :
    backendStatus === 'CLOSED' ? 'awaiting resolution' :
    status === 'active' ? 'active' : 'open';

  const accessibilityLabelText = `${title} by ${creatorName}. ${participantCount} ${participantCount === 1 ? 'participant' : 'participants'}. Status: ${statusText}${isJoined ? ', joined' : ''}`;

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabelText}
      accessibilityHint="Double tap to view bet details"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.borderLight
      }}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
      }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          {/* Title */}
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: 4,
            lineHeight: 22
          }} numberOfLines={2} accessible={false}>
            {title}
          </Text>

          {/* Creator */}
          <Text style={{
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: 2
          }} accessible={false}>
            by {creatorName}
          </Text>
        </View>

      </View>

      {/* Time Remaining with Label */}
      <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{
          fontSize: 10,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginRight: 6
        }}>
          {status === 'resolved' ? 'Resolved' :
           backendStatus === 'CLOSED' && resolveTimeRemaining && resolveTimeRemaining !== 'N/A' && resolveTimeRemaining !== 'Ended' ? 'Resolves in' :
           backendStatus === 'CLOSED' ? 'Awaiting resolution' :
           'Closes in'}
        </Text>
        {status !== 'resolved' && (
          backendStatus === 'CLOSED' ? (
            resolveTimeRemaining && resolveTimeRemaining !== 'N/A' && resolveTimeRemaining !== 'Ended' && (
              <Text style={{
                fontSize: 13,
                color: isResolveUrgent ? colors.errorAlt : colors.textSecondary,
                fontWeight: '600'
              }}>
                {resolveTimeRemaining}
              </Text>
            )
          ) : (
            <Text style={{
              fontSize: 13,
              color: isUrgent ? colors.errorAlt : colors.textSecondary,
              fontWeight: '600'
            }}>
              {timeRemaining}
            </Text>
          )
        )}
      </View>

      {/* Footer */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Participants */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1
        }}>
          {/* Avatar Stack */}
          {participantPreviews && participantPreviews.length > 0 && (
            <View style={{
              flexDirection: 'row',
              marginRight: 8
            }}>
              {participantPreviews.slice(0, 3).map((participant, index) => (
                <View
                  key={participant.id}
                  style={{
                    marginLeft: index > 0 ? -6 : 0,
                    borderWidth: 1.5,
                    borderColor: colors.background,
                    borderRadius: 10
                  }}
                >
                  <Avatar
                    imageUrl={participant.profileImageUrl}
                    firstName={participant.firstName}
                    lastName={participant.lastName}
                    username={participant.username}
                    userId={participant.id}
                    customSize={20}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Participant count */}
          <Text style={{
            fontSize: 12,
            color: colors.textMuted,
            fontWeight: '500'
          }} accessible={false}>
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </Text>
        </View>

        {/* Status Indicator */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Cancelled Badge */}
          {backendStatus === 'CANCELLED' && (
            <Badge label="Cancelled" variant="muted" showBorder />
          )}

          {/* Insurance Badge */}
          {hasInsurance && isJoined && (
            <Badge
              label={insuranceRefundPercentage ? `${insuranceRefundPercentage}%` : ''}
              variant="info"
              icon="shield"
              showBorder
            />
          )}

          {/* Fulfillment Status Badge - Show for resolved social bets */}
          {status === 'resolved' && stakeType === 'SOCIAL' && fulfillmentStatus && (
            <Badge
              label={getFulfillmentBadgeInfo(fulfillmentStatus).label}
              variant={getFulfillmentBadgeInfo(fulfillmentStatus).variant}
              showBorder
            />
          )}

          {/* Joined Indicator */}
          {isJoined && showJoinedIndicator && (
            <Badge label="Joined" variant="primary" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(BetCard);