import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { betService, FulfillmentDetails } from '../../services/bet/betService';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import { SubmitProofModal } from './SubmitProofModal';
import { haptic } from '../../utils/haptics';
import { colors } from '../../constants/theme';

const INITIAL_VISIBLE_LOSERS = 3;

interface FulfillmentTrackerProps {
  betId: number;
  betTitle: string;
  onRefresh?: () => void;
}

export const FulfillmentTracker: React.FC<FulfillmentTrackerProps> = React.memo(({
  betId,
  betTitle,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [fulfillmentDetails, setFulfillmentDetails] = useState<FulfillmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitProofModal, setShowSubmitProofModal] = useState(false);
  const [showAllLosers, setShowAllLosers] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFulfillmentDetails();
    }, [betId])
  );

  // Helper to parse display name into first/last name parts
  const getNameParts = useCallback((displayName: string) => {
    const nameParts = displayName.trim().split(/\s+/);
    return {
      firstName: nameParts[0] || displayName,
      lastName: nameParts.slice(1).join(' ') || ''
    };
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

  const handleLoserClaim = () => {
    haptic.selection();
    setShowSubmitProofModal(true);
  };

  const handleSubmitProofSuccess = () => {
    loadFulfillmentDetails();
    onRefresh?.();
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

  const currentUserIsLoser = fulfillmentDetails.losers.some(l => l.userId === user?.id);
  const currentUserLoserClaim = fulfillmentDetails.losers.find(l => l.userId === user?.id);
  const currentUserHasClaimed = currentUserLoserClaim?.hasClaimed ?? false;

  const getStatusColor = () => {
    switch (fulfillmentDetails.status) {
      case 'FULFILLED':
        return colors.success;
      case 'PARTIALLY_FULFILLED':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const progressPercent = fulfillmentDetails.totalLosers > 0
    ? (fulfillmentDetails.confirmationCount / fulfillmentDetails.totalLosers) * 100
    : 0;

  const losersToShow = showAllLosers
    ? fulfillmentDetails.losers
    : fulfillmentDetails.losers.slice(0, INITIAL_VISIBLE_LOSERS);

  const hasMoreLosers = fulfillmentDetails.losers.length > INITIAL_VISIBLE_LOSERS;
  const remainingCount = fulfillmentDetails.losers.length - INITIAL_VISIBLE_LOSERS;

  return (
    <View style={{
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: 14
    }}>
      {/* Header with Progress Chip */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>Stake Fulfillment</Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: fulfillmentDetails.status === 'FULFILLED'
            ? 'rgba(0, 212, 170, 0.15)'
            : 'rgba(255, 255, 255, 0.08)',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
          gap: 5
        }}>
          {fulfillmentDetails.status === 'FULFILLED' ? (
            <MaterialIcons name="check-circle" size={14} color={colors.success} />
          ) : (
            <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
          )}
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: getStatusColor()
          }}>
            {fulfillmentDetails.status === 'FULFILLED' ? 'Completed' : 'In Progress'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ gap: 6 }}>
        <View style={{
          height: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <View style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: fulfillmentDetails.status === 'FULFILLED' ? colors.success : colors.warning,
            borderRadius: 3
          }} />
        </View>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>
          {fulfillmentDetails.confirmationCount} of {fulfillmentDetails.totalLosers} fulfilled
        </Text>
      </View>

      {/* Losers List */}
      {fulfillmentDetails.losers.length > 0 && (
        <View style={{ gap: 8 }}>
          {losersToShow.map((loser) => {
            const { firstName, lastName } = getNameParts(loser.displayName);
            const canViewProof = loser.hasClaimed;

            const handleLoserCardPress = () => {
              if (canViewProof) {
                router.push({
                  pathname: '/(app)/view-proof',
                  params: {
                    loserName: loser.displayName,
                    claimedAt: loser.claimedAt || '',
                    proofUrl: loser.proofUrl || '',
                    proofDescription: loser.proofDescription || '',
                    betTitle: betTitle,
                  },
                });
              }
            };

            return (
              <TouchableOpacity
                key={loser.userId}
                onPress={handleLoserCardPress}
                disabled={!canViewProof}
                activeOpacity={canViewProof ? 0.7 : 1}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${loser.displayName}, ${loser.hasClaimed ? 'fulfilled' : 'pending fulfillment'}`}
                accessibilityHint={canViewProof ? 'Double tap to view proof' : undefined}
                accessibilityState={{ disabled: !canViewProof }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.surfaceMedium,
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: loser.hasClaimed
                    ? 'rgba(0, 212, 170, 0.2)'
                    : colors.borderLight
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar
                    imageUrl={loser.profilePhotoUrl}
                    firstName={firstName}
                    lastName={lastName}
                    userId={loser.userId}
                    customSize={36}
                  />
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '500' }} accessible={false}>
                    {loser.displayName}
                  </Text>
                </View>
                {loser.hasClaimed ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessible={false}>
                    <MaterialIcons name="check-circle" size={18} color={colors.success} accessible={false} />
                    <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} accessible={false} />
                  </View>
                ) : (
                  <View style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6
                  }} accessible={false}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '500' }} accessible={false}>Pending</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Show More / Show Less Button */}
          {hasMoreLosers && (
            <TouchableOpacity
              onPress={() => {
                haptic.selection();
                setShowAllLosers(!showAllLosers);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={showAllLosers ? 'Show less' : `Show ${remainingCount} more`}
              accessibilityHint="Double tap to expand or collapse the list"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                gap: 4
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }} accessible={false}>
                {showAllLosers ? 'Show less' : `Show ${remainingCount} more`}
              </Text>
              <MaterialIcons
                name={showAllLosers ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color={colors.primary}
                accessible={false}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {currentUserIsLoser && !currentUserHasClaimed && (
        <TouchableOpacity
          onPress={handleLoserClaim}
          disabled={submitting}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={submitting ? 'Submitting claim, please wait' : 'I have fulfilled the stake'}
          accessibilityState={{
            disabled: submitting,
            busy: submitting,
          }}
          accessibilityHint={submitting ? undefined : 'Double tap to claim you have fulfilled the stake'}
          style={{
            backgroundColor: submitting ? 'rgba(255, 255, 255, 0.08)' : '#00D4AA',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: submitting ? 0.6 : 1
          }}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" accessible={false} />
          ) : (
            <Text style={{ color: '#000000', fontWeight: '700', fontSize: 16, textAlign: 'center' }} accessible={false}>
              I have fulfilled the stake
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Submit Proof Modal */}
      <SubmitProofModal
        visible={showSubmitProofModal}
        onClose={() => setShowSubmitProofModal(false)}
        betId={betId}
        betTitle={betTitle}
        onSuccess={handleSubmitProofSuccess}
      />
    </View>
  );
});
