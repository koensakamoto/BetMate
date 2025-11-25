import React, { useCallback } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Avatar } from '../common/Avatar';

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

  // Debug logging for insurance
  console.log(`[BetCard ${id}] Insurance Debug:`, {
    hasInsurance,
    insuranceRefundPercentage,
    isJoined,
    shouldShowBadge: hasInsurance && isJoined
  });

  const handlePress = useCallback(() => {
    // Navigate to bet details
    router.push(`/bet-details/${id}`);
  }, [id]);


  // Get fulfillment badge colors and text
  const getFulfillmentBadgeColor = useCallback((status: string) => {
    switch (status) {
      case 'FULFILLED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'PARTIALLY_FULFILLED':
        return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  }, []);

  const getFulfillmentBadgeText = useCallback((status: string) => {
    switch (status) {
      case 'FULFILLED':
        return 'Fulfilled';
      case 'PARTIALLY_FULFILLED':
        return 'Partial';
      default:
        return 'Pending';
    }
  }, []);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
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
            color: '#ffffff',
            marginBottom: 4,
            lineHeight: 22
          }} numberOfLines={2}>
            {title}
          </Text>

          {/* Creator */}
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: 2
          }}>
            by {creatorName}
          </Text>
        </View>

      </View>

      {/* Time Remaining with Label */}
      <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.5)',
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
                color: resolveTimeRemaining.includes('h') && !resolveTimeRemaining.includes('d') ?
                  '#FF4757' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: '600'
              }}>
                {resolveTimeRemaining}
              </Text>
            )
          ) : (
            <Text style={{
              fontSize: 13,
              color: timeRemaining.includes('h') && !timeRemaining.includes('d') ?
                '#FF4757' : 'rgba(255, 255, 255, 0.6)',
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
                    borderColor: '#0a0a0f',
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
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '500'
          }}>
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </Text>
        </View>

        {/* Status Indicator */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Cancelled Badge */}
          {backendStatus === 'CANCELLED' && (
            <View style={{
              backgroundColor: 'rgba(156, 163, 175, 0.15)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(156, 163, 175, 0.3)'
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: '#9ca3af'
              }}>
                Cancelled
              </Text>
            </View>
          )}

          {/* Insurance Badge */}
          {hasInsurance && isJoined && (
            <View style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.3)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}>
              <MaterialIcons name="shield" size={14} color="#3B82F6" />
              {insuranceRefundPercentage && (
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: '#3B82F6'
                }}>
                  {insuranceRefundPercentage}%
                </Text>
              )}
            </View>
          )}

          {/* Fulfillment Status Badge - Show for resolved social bets */}
          {status === 'resolved' && stakeType === 'SOCIAL' && fulfillmentStatus && (
            <View style={{
              backgroundColor: getFulfillmentBadgeColor(fulfillmentStatus).bg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: getFulfillmentBadgeColor(fulfillmentStatus).border
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: getFulfillmentBadgeColor(fulfillmentStatus).text
              }}>
                {getFulfillmentBadgeText(fulfillmentStatus)}
              </Text>
            </View>
          )}

          {/* Joined Indicator */}
          {isJoined && showJoinedIndicator && (
            <View style={{
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#00D4AA'
              }}>
                Joined
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(BetCard);