import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle, Clock, Users } from 'lucide-react-native';
import { betService, FulfillmentDetails } from '../../services/bet/betService';
import { useAuth } from '../../contexts/AuthContext';

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
      <View className="bg-gray-800 rounded-lg p-4">
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
    <View className="bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-white">Stake Fulfillment</Text>
        <View className="flex-row items-center space-x-2">
          {fulfillmentDetails.status === 'FULFILLED' ? (
            <CheckCircle size={20} color="#10b981" />
          ) : (
            <Clock size={20} color="#fbbf24" />
          )}
          <Text className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Stake Description */}
      <View className="bg-gray-700 rounded-lg p-3">
        <Text className="text-sm text-gray-400 mb-1">Stake:</Text>
        <Text className="text-white font-medium">{socialStakeDescription}</Text>
      </View>

      {/* Progress */}
      <View className="flex-row items-center justify-between bg-gray-700 rounded-lg p-3">
        <View className="flex-row items-center space-x-2">
          <Users size={18} color="#9ca3af" />
          <Text className="text-gray-300">
            {fulfillmentDetails.confirmationCount} of {fulfillmentDetails.totalWinners} winners confirmed
          </Text>
        </View>
      </View>

      {/* Winners List */}
      {fulfillmentDetails.winners.length > 0 && (
        <View>
          <Text className="text-sm font-medium text-gray-400 mb-2">Winners</Text>
          {fulfillmentDetails.winners.map((winner) => (
            <View
              key={winner.userId}
              className="flex-row items-center justify-between bg-gray-700 rounded-lg p-3 mb-2"
            >
              <View className="flex-row items-center space-x-3">
                {winner.profilePhotoUrl ? (
                  <Image
                    source={{ uri: winner.profilePhotoUrl }}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <View className="w-8 h-8 rounded-full bg-gray-600" />
                )}
                <Text className="text-white">{winner.displayName}</Text>
              </View>
              {winner.hasConfirmed && (
                <CheckCircle size={18} color="#10b981" />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Losers List */}
      {fulfillmentDetails.losers.length > 0 && (
        <View>
          <Text className="text-sm font-medium text-gray-400 mb-2">Losers</Text>
          {fulfillmentDetails.losers.map((loser) => (
            <View
              key={loser.userId}
              className="flex-row items-center space-x-3 bg-gray-700 rounded-lg p-3 mb-2"
            >
              {loser.profilePhotoUrl ? (
                <Image
                  source={{ uri: loser.profilePhotoUrl }}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-gray-600" />
              )}
              <Text className="text-white">{loser.displayName}</Text>
            </View>
          ))}
          {fulfillmentDetails.loserClaimedAt && (
            <View className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 mt-2">
              <Text className="text-blue-300 text-sm">
                Loser has claimed they fulfilled the stake
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
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
          className="bg-blue-600 rounded-lg p-4"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-center">
              I have fulfilled the stake
            </Text>
          )}
        </TouchableOpacity>
      )}

      {currentUserIsWinner && !currentUserHasConfirmed && (
        <TouchableOpacity
          onPress={handleWinnerConfirm}
          disabled={submitting}
          className="bg-green-600 rounded-lg p-4"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-center">
              Confirm I received the stake
            </Text>
          )}
        </TouchableOpacity>
      )}

      {currentUserIsWinner && currentUserHasConfirmed && (
        <View className="bg-green-900/30 border border-green-500 rounded-lg p-3">
          <Text className="text-green-300 text-center">
            You have confirmed receipt of the stake
          </Text>
        </View>
      )}

      {/* Completion Message */}
      {fulfillmentDetails.status === 'FULFILLED' && fulfillmentDetails.allWinnersConfirmedAt && (
        <View className="bg-green-900/30 border border-green-500 rounded-lg p-4">
          <Text className="text-green-300 text-center font-medium">
            All winners have confirmed! Stake fulfilled.
          </Text>
          <Text className="text-gray-400 text-center text-xs mt-1">
            Completed on {new Date(fulfillmentDetails.allWinnersConfirmedAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
};
