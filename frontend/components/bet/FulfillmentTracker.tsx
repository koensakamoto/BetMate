import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { betService, FulfillmentDetails } from '../../services/bet/betService';
import { useAuth } from '../../contexts/AuthContext';
import { ENV } from '../../config/env';

interface FulfillmentTrackerProps {
  betId: number;
  betTitle: string;
  socialStakeDescription: string;
  onRefresh?: () => void;
}

export const FulfillmentTracker: React.FC<FulfillmentTrackerProps> = ({
  betId,
  betTitle,
  socialStakeDescription,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [fulfillmentDetails, setFulfillmentDetails] = useState<FulfillmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFulfillmentDetails();
  }, [betId]);

  // Get full image URL helper
  const getFullImageUrl = useCallback((imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${ENV.API_BASE_URL}${imageUrl}`;
  }, []);

  // Get user initials from display name
  const getUserInitials = useCallback((displayName: string) => {
    const nameParts = displayName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      return nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
  }, []);

  const loadFulfillmentDetails = async () => {
    try {
      setLoading(true);
      const details = await betService.getFulfillmentDetails(betId);
      setFulfillmentDetails(details);
    } catch (error) {
      console.error('Failed to load fulfillment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoserClaim = async () => {
    Alert.alert(
      'Claim Fulfillment',
      'Are you confirming that you have fulfilled the stake?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSubmitting(true);
              await betService.loserClaimFulfilled(betId);
              await loadFulfillmentDetails();
              onRefresh?.();
              Alert.alert('Success', 'Your fulfillment claim has been recorded');
            } catch (error) {
              Alert.alert('Error', 'Failed to record fulfillment claim');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleWinnerConfirm = async () => {
    Alert.alert(
      'Confirm Receipt',
      'Are you confirming that you received the stake?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSubmitting(true);
              await betService.winnerConfirmFulfilled(betId);
              await loadFulfillmentDetails();
              onRefresh?.();
              Alert.alert('Success', 'Your confirmation has been recorded');
            } catch (error) {
              Alert.alert('Error', 'Failed to record confirmation');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}>
        <ActivityIndicator size="small" color="#10b981" />
      </View>
    );
  }

  if (!fulfillmentDetails) {
    return null;
  }

  const currentUserIsWinner = fulfillmentDetails.winners.some(w => w.userId === user?.id);
  const currentUserIsLoser = fulfillmentDetails.losers.some(l => l.userId === user?.id);
  const currentUserHasConfirmed = fulfillmentDetails.winners.find(w => w.userId === user?.id)?.hasConfirmed;

  const getStatusColor = () => {
    switch (fulfillmentDetails.status) {
      case 'FULFILLED':
        return 'text-green-500';
      case 'PARTIALLY_FULFILLED':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (fulfillmentDetails.status) {
      case 'FULFILLED':
        return 'Fulfilled';
      case 'PARTIALLY_FULFILLED':
        return 'Partially Fulfilled';
      default:
        return 'Pending';
    }
  };

  return (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      gap: 16
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>Stake Status</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {fulfillmentDetails.status === 'FULFILLED' ? (
            <MaterialIcons name="check-circle" size={20} color="#10b981" />
          ) : (
            <MaterialIcons name="schedule" size={20} color="#fbbf24" />
          )}
          <Text className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Stake Description */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 4 }}>Stake:</Text>
        <Text style={{ color: '#ffffff', fontWeight: '500' }}>{socialStakeDescription}</Text>
      </View>

      {/* Progress */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="groups" size={18} color="#9ca3af" />
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {fulfillmentDetails.confirmationCount} of {fulfillmentDetails.totalWinners} winners confirmed
          </Text>
        </View>
      </View>

      {/* Winners List */}
      {fulfillmentDetails.winners.length > 0 && (
        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 8 }}>Winners</Text>
          {fulfillmentDetails.winners.map((winner) => {
            const fullImageUrl = getFullImageUrl(winner.profilePhotoUrl);
            return (
              <View
                key={winner.userId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {fullImageUrl ? (
                    <Image
                      source={{ uri: fullImageUrl }}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                    />
                  ) : (
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }}>
                        {getUserInitials(winner.displayName)}
                      </Text>
                    </View>
                  )}
                  <Text style={{ color: '#ffffff' }}>{winner.displayName}</Text>
                </View>
                {winner.hasConfirmed && (
                  <MaterialIcons name="check-circle" size={18} color="#10b981" />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Losers List */}
      {fulfillmentDetails.losers.length > 0 && (
        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 8 }}>Losers</Text>
          {fulfillmentDetails.losers.map((loser) => {
            const fullImageUrl = getFullImageUrl(loser.profilePhotoUrl);
            return (
              <View
                key={loser.userId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                {fullImageUrl ? (
                  <Image
                    source={{ uri: fullImageUrl }}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                  />
                ) : (
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>
                      {getUserInitials(loser.displayName)}
                    </Text>
                  </View>
                )}
                <Text style={{ color: '#ffffff' }}>{loser.displayName}</Text>
              </View>
            );
          })}
          {fulfillmentDetails.loserClaimedAt && (
            <View style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.3)',
              borderRadius: 8,
              padding: 12,
              marginTop: 8
            }}>
              <Text style={{ color: '#60a5fa', fontSize: 13 }}>
                Loser has claimed they fulfilled the stake
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, marginTop: 4 }}>
                {new Date(fulfillmentDetails.loserClaimedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {currentUserIsLoser && !fulfillmentDetails.loserClaimedAt && (
        <TouchableOpacity
          onPress={handleLoserClaim}
          disabled={submitting}
          style={{
            backgroundColor: '#2563eb',
            borderRadius: 8,
            padding: 16
          }}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
              I have fulfilled the stake
            </Text>
          )}
        </TouchableOpacity>
      )}

      {currentUserIsWinner && !currentUserHasConfirmed && (
        <TouchableOpacity
          onPress={handleWinnerConfirm}
          disabled={submitting}
          style={{
            backgroundColor: '#059669',
            borderRadius: 8,
            padding: 16
          }}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
              Mark as Received
            </Text>
          )}
        </TouchableOpacity>
      )}

      {currentUserIsWinner && currentUserHasConfirmed && (
        <View style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 1,
          borderColor: 'rgba(16, 185, 129, 0.3)',
          borderRadius: 8,
          padding: 12
        }}>
          <Text style={{ color: '#34d399', textAlign: 'center' }}>
            You have confirmed receipt of the stake
          </Text>
        </View>
      )}

      {/* Completion Message */}
      {fulfillmentDetails.status === 'FULFILLED' && fulfillmentDetails.allWinnersConfirmedAt && (
        <View style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 1,
          borderColor: 'rgba(16, 185, 129, 0.3)',
          borderRadius: 8,
          padding: 16
        }}>
          <Text style={{ color: '#34d399', textAlign: 'center', fontWeight: '500' }}>
            All winners have confirmed! Stake fulfilled.
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', fontSize: 11, marginTop: 4 }}>
            Completed on {new Date(fulfillmentDetails.allWinnersConfirmedAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
};
