import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, Modal, ScrollView, Linking, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [proofDescription, setProofDescription] = useState('');

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

  const pickImage = async () => {
    // First check current permission status
    const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

    let finalStatus = currentStatus;

    // If not granted, request permission
    if (currentStatus !== 'granted') {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      finalStatus = status;

      if (status !== 'granted') {
        if (!canAskAgain) {
          // Permission was denied previously and user can't be asked again
          Alert.alert(
            'Permission Required',
            'Photo library access was denied. Please enable it in your device Settings:\n\nSettings > BetMate > Photos',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  // On iOS, this opens the app settings
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Permission Required',
            'Please allow access to your photo library to upload proof photos'
          );
        }
        return;
      }
    }

    // Permission granted, open picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProofPhoto(result.assets[0].uri);
    }
  };

  const handleLoserClaim = () => {
    setShowProofModal(true);
  };

  const submitProof = async () => {
    try {
      setSubmitting(true);

      // Upload photo first if provided
      let uploadedProofUrl: string | undefined = undefined;
      if (proofPhoto) {
        const fileName = proofPhoto.split('/').pop() || `proof_${Date.now()}.jpg`;
        uploadedProofUrl = await betService.uploadFulfillmentProof(betId, proofPhoto, fileName);
      }

      // Submit fulfillment claim with proof URL and description
      await betService.loserClaimFulfilled(betId, uploadedProofUrl, proofDescription || undefined);
      await loadFulfillmentDetails();
      onRefresh?.();
      setShowProofModal(false);
      setProofPhoto(null);
      setProofDescription('');
      Alert.alert('Success', 'Your fulfillment claim has been recorded');
    } catch (error) {
      Alert.alert('Error', 'Failed to record fulfillment claim');
    } finally {
      setSubmitting(false);
    }
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
              {fulfillmentDetails.loserProofDescription && (
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '500', marginBottom: 4 }}>
                    Proof Description:
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                    {fulfillmentDetails.loserProofDescription}
                  </Text>
                </View>
              )}
              {fulfillmentDetails.loserProofUrl && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '500', marginBottom: 4 }}>
                    Proof Photo:
                  </Text>
                  <Image
                    source={{ uri: getFullImageUrl(fulfillmentDetails.loserProofUrl) || undefined }}
                    style={{ width: '100%', height: 200, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                </View>
              )}
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

      {/* Proof Upload Modal */}
      <Modal
        visible={showProofModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProofModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: '#1f2937',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 24,
            maxHeight: '80%'
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '600', color: '#ffffff' }}>
                  Submit Proof
                </Text>
                <TouchableOpacity onPress={() => setShowProofModal(false)}>
                  <MaterialIcons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 16 }}>
                Optionally add proof that you've fulfilled the stake
              </Text>

              {/* Photo Upload */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: '500', marginBottom: 8 }}>
                  Photo Proof (Optional)
                </Text>
                {proofPhoto ? (
                  <View>
                    <Image
                      source={{ uri: proofPhoto }}
                      style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 8 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setProofPhoto(null)}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderRadius: 8,
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <MaterialIcons name="delete" size={20} color="#ef4444" />
                      <Text style={{ color: '#ef4444', fontWeight: '500' }}>Remove Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      borderRadius: 8,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <MaterialIcons name="add-photo-alternate" size={24} color="#60a5fa" />
                    <Text style={{ color: '#60a5fa', fontWeight: '500' }}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Text Description */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: '500', marginBottom: 8 }}>
                  Description (Optional)
                </Text>
                <TextInput
                  value={proofDescription}
                  onChangeText={setProofDescription}
                  placeholder="Add a description of how you fulfilled the stake..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    padding: 12,
                    color: '#ffffff',
                    textAlignVertical: 'top',
                    minHeight: 100
                  }}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={submitProof}
                disabled={submitting}
                style={{
                  backgroundColor: '#2563eb',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 8
                }}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
                    Submit Fulfillment Claim
                  </Text>
                )}
              </TouchableOpacity>

              {/* Skip Button */}
              <TouchableOpacity
                onPress={() => setShowProofModal(false)}
                disabled={submitting}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: 16
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500', textAlign: 'center' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
