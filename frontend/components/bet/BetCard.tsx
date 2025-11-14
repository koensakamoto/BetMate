import React, { useCallback } from 'react';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ENV } from '../../config/env';

// Bet type to MaterialIcon mapping (matches create-bet.tsx)
const betTypeIconMap: { [key: string]: string } = {
  'multiple_choice': 'ballot',
  'prediction': 'gps-fixed',
  'over_under': 'balance',
  // Backend returns uppercase versions
  'MULTIPLE_CHOICE': 'ballot',
  'PREDICTION': 'gps-fixed',
  'OVER_UNDER': 'balance'
};

const betTypeColorMap: { [key: string]: string } = {
  'multiple_choice': '#00D4AA',
  'prediction': '#FF9500',
  'over_under': '#007AFF',
  // Backend returns uppercase versions
  'MULTIPLE_CHOICE': '#00D4AA',
  'PREDICTION': '#FF9500',
  'OVER_UNDER': '#007AFF'
};

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
  category: string;
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
  category,
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

  // Get user initials from participant data
  const getUserInitials = useCallback((participant: ParticipantPreview) => {
    const first = participant.firstName?.charAt(0)?.toUpperCase() || '';
    const last = participant.lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || participant.username?.charAt(0)?.toUpperCase() || '?';
  }, []);

  // Get full image URL
  const getFullImageUrl = useCallback((imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${ENV.API_BASE_URL}${imageUrl}`;
  }, []);

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

        {/* Time & Stake */}
        <View style={{ alignItems: 'flex-end', maxWidth: '40%' }}>
          {stakeType === 'SOCIAL' ? (
            <>
              <View style={{
                backgroundColor: 'rgba(255, 159, 0, 0.15)',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginBottom: 4
              }}>
                <Text style={{
                  fontSize: 10,
                  color: '#FF9F00',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Social
                </Text>
              </View>
              <Text style={{
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500',
                textAlign: 'right'
              }} numberOfLines={2}>
                {socialStakeDescription}
              </Text>
            </>
          ) : (
            <>
              <Text style={{
                fontSize: 14,
                color: '#ffffff',
                fontWeight: '600',
                marginBottom: 4
              }}>
                ${userStake !== undefined ? userStake : stakeAmount}
              </Text>
              {userStake !== undefined ? (
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  your stake
                </Text>
              ) : status === 'active' && resolveTimeRemaining ? (
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  resolves in
                </Text>
              ) : (
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  closes in
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Description/Category Badge */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{
            fontSize: 13,
            color: (status === 'active' && resolveTimeRemaining ? resolveTimeRemaining : timeRemaining).includes('h') &&
                   !(status === 'active' && resolveTimeRemaining ? resolveTimeRemaining : timeRemaining).includes('d') ?
              '#FF4757' : 'rgba(255, 255, 255, 0.6)',
            fontWeight: '600'
          }}>
            {status === 'active' && resolveTimeRemaining ? resolveTimeRemaining : timeRemaining}
          </Text>
      </View>

      {/* Footer */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Participants & Category */}
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
              {participantPreviews.slice(0, 2).map((participant, index) => {
                const profileImageUrl = getFullImageUrl(participant.profileImageUrl);

                return profileImageUrl ? (
                  <Image
                    key={participant.id}
                    source={{ uri: profileImageUrl }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      marginLeft: index > 0 ? -6 : 0,
                      borderWidth: 1.5,
                      borderColor: '#0a0a0f'
                    }}
                  />
                ) : (
                  <View
                    key={participant.id}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      marginLeft: index > 0 ? -6 : 0,
                      borderWidth: 1.5,
                      borderColor: '#0a0a0f',
                      backgroundColor: 'rgba(0, 212, 170, 0.2)',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      fontSize: 8,
                      color: '#00D4AA',
                      fontWeight: '700'
                    }}>
                      {getUserInitials(participant)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Bet Type */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <MaterialIcons
              name={betTypeIconMap[category] as any || 'ballot'}
              size={12}
              color={betTypeColorMap[category] || 'rgba(255, 255, 255, 0.7)'}
              style={{ marginRight: 3 }}
            />
            <Text style={{
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500'
            }}>
              {category === 'MULTIPLE_CHOICE' || category === 'multiple_choice' ? 'Multiple Choice' :
               category === 'PREDICTION' || category === 'prediction' ? 'Prediction' :
               category === 'OVER_UNDER' || category === 'over_under' ? 'Over/Under' : category}
            </Text>
          </View>
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