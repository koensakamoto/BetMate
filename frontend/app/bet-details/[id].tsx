import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService, BetResponse } from '../../services/bet/betService';
import BetResolutionModal from '../../components/bet/BetResolutionModal';
import { FulfillmentTracker } from '../../components/bet/FulfillmentTracker';
import { authService } from '../../services/auth/authService';
import { useAuth } from '../../contexts/AuthContext';
import { haptic } from '../../utils/haptics';
import LoadingButton from '../../components/common/LoadingButton';

interface BetDetailsData {
  id: number;
  title: string;
  description: string;
  category: string;
  creator: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  joinDeadline: string;
  betEndDate: string;
  betAmount: number;
  isFixedAmount: boolean;
  bettingType: 'MULTIPLE_CHOICE' | 'VALUE_ENTRY' | 'YES_NO';
  options?: string[];
  participants: Array<{
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    choice?: string;
    amount: number;
  }>;
  resolvedBy: 'CREATOR' | 'PARTICIPANTS' | 'ADMIN';
  evidenceRequired: boolean;
  evidenceDescription?: string;
  status: 'OPEN' | 'CLOSED' | 'RESOLVED';
}

export default function BetDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [betData, setBetData] = useState<BetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userBetAmount, setUserBetAmount] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadBetDetails();
    loadCurrentUser();
  }, [id]);

  const loadCurrentUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData?.id) {
        setCurrentUserId(userData.id);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadBetDetails = async () => {
    try {
      setIsLoading(true);

      if (!id) {
        throw new Error('Bet ID is required');
      }

      const betResponse = await betService.getBetById(parseInt(id));
      console.log('Bet Response:', {
        id: betResponse.id,
        title: betResponse.title,
        fixedStakeAmount: betResponse.fixedStakeAmount,
        minimumBet: betResponse.minimumBet,
        maximumBet: betResponse.maximumBet
      });
      setBetData(betResponse);

      // If user has already participated, pre-populate their selection and amount
      if (betResponse.hasUserParticipated) {
        // Pre-populate bet amount
        if (betResponse.userAmount) {
          setUserBetAmount(betResponse.userAmount.toString());
        }

        // Pre-populate selected option
        if (betResponse.userChoice) {
          // Map backend choice to display option
          if (betResponse.betType === 'BINARY') {
            // For binary bets, map OPTION_1 to 'Yes', OPTION_2 to 'No'
            const displayChoice = betResponse.userChoice === 'OPTION_1' ? 'Yes' : 'No';
            setSelectedOption(displayChoice);
          } else if (betResponse.betType === 'MULTIPLE_CHOICE') {
            // For multiple choice, map option number to option text
            const optionMap = {
              'OPTION_1': 0,
              'OPTION_2': 1,
              'OPTION_3': 2,
              'OPTION_4': 3
            };
            const optionIndex = optionMap[betResponse.userChoice as keyof typeof optionMap];
            const options = betResponse.options && betResponse.options.length > 0
              ? betResponse.options
              : ['Option 1', 'Option 2', 'Option 3'];
            if (optionIndex !== undefined && options[optionIndex]) {
              setSelectedOption(options[optionIndex]);
            }
          } else if (betResponse.betType === 'PREDICTION') {
            setCustomValue(betResponse.userChoice);
          }
        }
      } else {
        // Set default bet amount if it's a fixed amount bet and user hasn't joined
        // NEW: Use fixedStakeAmount if available (fixed-stake bets)
        if (betResponse.fixedStakeAmount) {
          setUserBetAmount(betResponse.fixedStakeAmount.toString());
        } else if (betResponse.minimumBet) {
          // DEPRECATED: Fallback to minimumBet for old variable-stake bets
          setUserBetAmount(betResponse.minimumBet.toString());
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading bet details:', error);
      Alert.alert('Error', 'Failed to load bet details');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#00D4AA';
      case 'CLOSED': return '#6B7280';
      case 'RESOLVED': return '#6B7280';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // Check if user can resolve the bet
  const canUserResolve = () => {
    if (!betData || !currentUserId) return false;

    // Check if bet is in CLOSED status (ready for resolution)
    if (betData.status !== 'CLOSED') return false;

    // Check based on resolution method
    if (betData.resolutionMethod === 'CREATOR_ONLY') {
      // Only creator can resolve
      return betData.creator?.id === currentUserId;
    } else if (betData.resolutionMethod === 'ASSIGNED_RESOLVER') {
      // Check if user is an assigned resolver (would need resolver list from backend)
      // For now, allow creator and assume resolver check will be done on backend
      return betData.creator?.id === currentUserId;
    } else if (betData.resolutionMethod === 'CONSENSUS_VOTING') {
      // Check if user has participated in the bet
      return betData.hasUserParticipated;
    }

    return false;
  };

  const handleResolveBet = async (outcome?: string, winnerUserIds?: number[], reasoning?: string) => {
    haptic.heavy();
    try {
      // Determine if this is a direct resolution or a vote
      const resolutionType = betData?.resolutionMethod === 'CONSENSUS_VOTING' ? 'vote' : 'resolve';

      if (resolutionType === 'resolve') {
        await betService.resolveBet(parseInt(id), outcome, winnerUserIds, reasoning);
        haptic.success();
        Alert.alert('Success', 'Bet has been resolved successfully!');
      } else {
        // For voting, we always use outcome (not winnerUserIds)
        await betService.voteOnResolution(parseInt(id), outcome || '', reasoning || '');
        haptic.success();
        Alert.alert('Success', 'Your vote has been submitted!');
      }

      // Reload bet details to show updated status
      await loadBetDetails();
    } catch (error) {
      console.error('Error resolving bet:', error);
      haptic.error();
      throw error;
    }
  };

  const handleCancelBet = async () => {
    haptic.heavy();
    setIsCancelling(true);
    try {
      const reason = cancelReason.trim();
      await betService.cancelBet(parseInt(id), reason || undefined);
      haptic.success();

      // Close modal and reset state immediately
      setShowCancelModal(false);
      setCancelReason('');
      setIsCancelling(false);

      // Reload bet details to show CANCELLED status
      await loadBetDetails();

      // Show success message after reload
      Alert.alert('Success', 'Bet cancelled. All participants have been refunded.');
    } catch (error) {
      console.error('Error cancelling bet:', error);
      haptic.error();
      setIsCancelling(false);
      Alert.alert('Error', 'Failed to cancel bet. Please try again.');
    }
  };

  const handleJoinBet = async () => {
    if (!betData || !id) {
      haptic.error();
      Alert.alert('Error', 'Invalid bet data');
      return;
    }

    // Validate bet amount
    const amount = parseFloat(userBetAmount);
    if (isNaN(amount) || amount <= 0) {
      haptic.error();
      Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    // Validate minimum bet amount
    if (amount < betData.minimumBet) {
      haptic.warning();
      Alert.alert('Error', `Minimum bet amount is $${betData.minimumBet}`);
      return;
    }

    // Validate maximum bet amount if set
    if (betData.maximumBet && amount > betData.maximumBet) {
      haptic.warning();
      Alert.alert('Error', `Maximum bet amount is $${betData.maximumBet}`);
      return;
    }

    // Validate bet option selection
    if (betData.betType === 'PREDICTION') {
      // For prediction bets, check customValue instead
      if (!customValue || customValue.trim().length === 0) {
        haptic.error();
        Alert.alert('Error', 'Please enter your prediction');
        return;
      }
    } else {
      // For other bet types, check selectedOption
      if (!selectedOption) {
        haptic.error();
        Alert.alert('Error', 'Please select a betting option');
        return;
      }
    }

    haptic.medium();

    try {
      setIsJoining(true);

      let placeBetRequest;

      // Handle PREDICTION bets differently
      if (betData.betType === 'PREDICTION') {
        // For prediction bets, send predictedValue
        placeBetRequest = {
          amount: amount,
          predictedValue: customValue,
          comment: undefined
        };
      } else {
        // For BINARY and MULTIPLE_CHOICE bets, map option to number
        let chosenOptionNumber = 1;

        if (betData.betType === 'BINARY') {
          chosenOptionNumber = selectedOption === 'Yes' ? 1 : 2;
        } else {
          // For MULTIPLE_CHOICE, map option text to number
          const backendOptions = betData.options || [];
          const displayedOptions = backendOptions.length > 0 ? backendOptions : ['Option 1', 'Option 2', 'Option 3'];
          const usingFallbackOptions = backendOptions.length === 0;

          console.log('Option mapping debug:');
          console.log('Backend options:', backendOptions);
          console.log('Displayed options:', displayedOptions);
          console.log('Selected option:', selectedOption);
          console.log('Using fallback options:', usingFallbackOptions);

          let optionIndex;
          if (usingFallbackOptions) {
            // When using fallback options, map directly based on display order
            optionIndex = displayedOptions.indexOf(selectedOption);
          } else {
            // When using real backend options, find in backend options
            optionIndex = backendOptions.indexOf(selectedOption);
          }

          console.log('Option index:', optionIndex);

          if (optionIndex === -1) {
            console.error('Selected option not found in available options!');
            Alert.alert('Error', 'Invalid option selected. Please try again.');
            return;
          }

          chosenOptionNumber = optionIndex + 1;
        }

        placeBetRequest = {
          chosenOption: chosenOptionNumber,
          amount: amount,
          comment: undefined
        };
      }

      console.log('=== BET PLACEMENT DEBUG ===');
      console.log('Bet ID:', id);
      console.log('User ID from context:', user?.id);
      console.log('Bet data:', JSON.stringify(betData, null, 2));
      console.log('Selected option:', selectedOption);
      console.log('Bet amount:', amount);
      console.log('Place bet request:', JSON.stringify(placeBetRequest, null, 2));
      console.log('Calling betService.placeBet...');

      const updatedBet = await betService.placeBet(parseInt(id), placeBetRequest);

      console.log('=== BET PLACEMENT RESPONSE ===');
      console.log('Updated bet data:', JSON.stringify(updatedBet, null, 2));

      // Check if the response indicates an error
      if (updatedBet.success === false || updatedBet.error) {
        const errorMessage = updatedBet.message || updatedBet.error || 'Failed to place bet';
        console.error('Bet placement failed:', errorMessage);
        haptic.error();
        Alert.alert('Error', errorMessage);
        return;
      }

      // Update the local bet data with the response
      setBetData(updatedBet);

      haptic.success();
      Alert.alert('Success', `Bet placed successfully!\nAmount: $${amount}\nOption: ${selectedOption}`, [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to the group page with Bets tab active
            router.push(`/(tabs)/group/${betData.groupId}?tab=1`);
          }
        }
      ]);

    } catch (error) {
      console.error('=== BET PLACEMENT ERROR ===');
      console.error('Error placing bet:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      haptic.error();
      Alert.alert('Error', 'Failed to place bet. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const getBetAmountForDisplay = () => {
    if (betData?.fixedStakeAmount) {
      return betData.fixedStakeAmount.toString();
    }
    return userBetAmount;
  };

  const isValidBetAmount = () => {
    if (betData?.fixedStakeAmount) return true;
    const amount = parseFloat(userBetAmount);
    return !isNaN(amount) && amount > 0;
  };

  const isValidBetSelection = () => {
    if (!betData) return false;

    if (betData.betType === 'MULTIPLE_CHOICE' || betData.betType === 'BINARY') {
      return selectedOption !== null;
    }

    if (betData.betType === 'PREDICTION') {
      return customValue.trim().length > 0;
    }

    return false;
  };

  const handleOptionSelect = (option: string) => {
    haptic.light();
    setSelectedOption(option);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: 16, fontSize: 16 }}>
          Loading bet details...
        </Text>
      </View>
    );
  }

  if (!betData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 }}>
          Bet not found
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}
            >
              <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: 4
              }}>
                {betData.category}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: getStatusColor(betData.status),
                  marginRight: 8
                }} />
                <Text style={{
                  fontSize: 14,
                  color: getStatusColor(betData.status),
                  fontWeight: '600'
                }}>
                  {betData.status}
                </Text>
              </View>
            </View>

            {/* 3-dot menu (only for creator on non-resolved bets) */}
            {betData.creator.id === currentUserId && betData.status !== 'RESOLVED' && (
              <TouchableOpacity
                onPress={() => {
                  haptic.selection();
                  setShowMenu(!showMenu);
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <MaterialIcons name="more-vert" size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Menu dropdown */}
          {showMenu && (
            <View style={{
              position: 'absolute',
              top: 60,
              right: 20,
              backgroundColor: '#1a1a1f',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
              zIndex: 1000
            }}>
              <TouchableOpacity
                onPress={() => {
                  haptic.selection();
                  setShowMenu(false);
                  setShowCancelModal(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  minWidth: 180
                }}
              >
                <MaterialIcons name="cancel" size={20} color="#EF4444" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 15, color: '#EF4444', fontWeight: '500' }}>
                  Cancel Bet
                </Text>
              </TouchableOpacity>
            </View>
          )}


          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#ffffff',
            lineHeight: 32,
            marginBottom: 12
          }}>
            {betData.title}
          </Text>

          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 24
          }}>
            {betData.description}
          </Text>
        </View>

        {/* Essential Details Card */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Essential Details
          </Text>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Creator</Text>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                @{betData.creator?.username || 'Unknown'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Created</Text>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                {formatDate(betData.createdAt)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Join Deadline</Text>
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '500' }}>
                {formatDate(betData.bettingDeadline)}
              </Text>
            </View>

            {betData.resolveDate && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Bet Ends</Text>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                  {formatDate(betData.resolveDate)}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                {betData.stakeType === 'SOCIAL' ? 'Stake Type' : 'Bet Amount'}
              </Text>
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '600' }}>
                {betData.stakeType === 'SOCIAL' ? 'Social' : (betData.fixedStakeAmount ? `$${betData.fixedStakeAmount} (Fixed)` : 'Variable')}
              </Text>
            </View>

            {betData.stakeType === 'SOCIAL' && betData.socialStakeDescription && (
              <View style={{
                marginTop: 12,
                backgroundColor: 'rgba(0, 212, 170, 0.08)',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(0, 212, 170, 0.2)'
              }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, marginBottom: 4 }}>
                  What's at stake:
                </Text>
                <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '500' }}>
                  {betData.socialStakeDescription}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Betting Options Section */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            {betData.hasUserParticipated ? 'Your Selection' : 'Bet Options'}
          </Text>


          {betData.betType === 'MULTIPLE_CHOICE' ? (
            <View style={{ gap: 8 }}>
              {(betData.options && betData.options.length > 0 ? betData.options : ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleOptionSelect(option)}
                  disabled={betData.status !== 'OPEN'}
                  style={{
                    backgroundColor: selectedOption === option ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: selectedOption === option ? 2 : 1,
                    borderColor: selectedOption === option ? '#00D4AA' : 'rgba(255, 255, 255, 0.06)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: betData.status !== 'OPEN' ? 0.6 : 1
                  }}
                >
                  <Text style={{
                    color: selectedOption === option ? '#00D4AA' : '#ffffff',
                    fontSize: 14,
                    fontWeight: selectedOption === option ? '600' : '500'
                  }}>
                    {option}
                  </Text>
                  {selectedOption === option && (
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#00D4AA',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MaterialIcons name="check" size={14} color="#000000" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : betData.betType === 'BINARY' ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleOptionSelect('Yes')}
                disabled={betData.status !== 'OPEN'}
                style={{
                  flex: 1,
                  backgroundColor: selectedOption === 'Yes' ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: selectedOption === 'Yes' ? 2 : 1,
                  borderColor: selectedOption === 'Yes' ? '#00D4AA' : 'rgba(255, 255, 255, 0.06)',
                  alignItems: 'center',
                  opacity: betData.status !== 'OPEN' ? 0.6 : 1
                }}
              >
                <Text style={{
                  color: selectedOption === 'Yes' ? '#00D4AA' : '#ffffff',
                  fontSize: 14,
                  fontWeight: selectedOption === 'Yes' ? '600' : '500'
                }}>
                  Yes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOptionSelect('No')}
                disabled={betData.status !== 'OPEN'}
                style={{
                  flex: 1,
                  backgroundColor: selectedOption === 'No' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: selectedOption === 'No' ? 2 : 1,
                  borderColor: selectedOption === 'No' ? '#FF3B30' : 'rgba(255, 255, 255, 0.06)',
                  alignItems: 'center',
                  opacity: betData.status !== 'OPEN' ? 0.6 : 1
                }}
              >
                <Text style={{
                  color: selectedOption === 'No' ? '#FF3B30' : '#ffffff',
                  fontSize: 14,
                  fontWeight: selectedOption === 'No' ? '600' : '500'
                }}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 12,
                marginBottom: 8
              }}>
                Enter your prediction value
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#ffffff',
                  fontSize: 14,
                  borderWidth: customValue ? 1 : 0,
                  borderColor: customValue ? 'rgba(0, 212, 170, 0.3)' : 'transparent',
                  opacity: betData.status !== 'OPEN' ? 0.6 : 1
                }}
                value={customValue}
                onChangeText={setCustomValue}
                placeholder="Enter your prediction"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                editable={betData.status === 'OPEN'}
              />
            </View>
          )}
        </View>

        {/* Participants Overview */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Participants ({betData.totalParticipants || 0})
          </Text>

          {betData.totalParticipants && betData.totalParticipants > 0 ? (
            <View style={{ gap: 12 }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                {betData.totalParticipants} user{betData.totalParticipants > 1 ? 's' : ''} {betData.totalParticipants > 1 ? 'have' : 'has'} joined this bet
              </Text>
            </View>
          ) : (
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
              No participants yet
            </Text>
          )}
        </View>

        {/* Bet Amount Section */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          {betData.stakeType === 'SOCIAL' ? (
            <>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 12
              }}>
                Social Bet
              </Text>
              <View style={{
                backgroundColor: 'rgba(0, 212, 170, 0.08)',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(0, 212, 170, 0.2)'
              }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, marginBottom: 6 }}>
                  What's at stake:
                </Text>
                <Text style={{ color: '#00D4AA', fontSize: 16, fontWeight: '600' }}>
                  {betData.socialStakeDescription || 'Fun stakes - no credits involved'}
                </Text>
              </View>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: 12,
                fontStyle: 'italic'
              }}>
                No credits required - just for fun!
              </Text>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff',
                  flex: 1
                }}>
                  {betData.fixedStakeAmount ? 'Entry Fee' : (betData.hasUserParticipated ? 'Your Bet Amount' : 'Bet Amount')}
                </Text>
                {betData.fixedStakeAmount && (
                  <View style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6
                  }}>
                    <Text style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: 12,
                      fontWeight: '500'
                    }}>Fixed</Text>
                  </View>
                )}
              </View>

              {betData.fixedStakeAmount && (
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: 12
                }}>
                  Everyone must bet exactly this amount
                </Text>
              )}

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: betData.fixedStakeAmount ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: betData.fixedStakeAmount ? 0 : 1,
                borderColor: betData.fixedStakeAmount ? 'transparent' : (isValidBetAmount() ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.2)'),
                opacity: betData.status !== 'OPEN' ? 0.6 : 1
              }}>
                <Text style={{
                  color: '#00D4AA',
                  fontSize: 18,
                  fontWeight: '600',
                  marginRight: 8
                }}>$</Text>

                <TextInput
                  style={{
                    flex: 1,
                    color: betData.fixedStakeAmount ? 'rgba(255, 255, 255, 0.7)' : '#ffffff',
                    fontSize: 18,
                    fontWeight: '600',
                    padding: 0
                  }}
                  value={getBetAmountForDisplay()}
                  onChangeText={setUserBetAmount}
                  placeholder={betData.fixedStakeAmount ? betData.fixedStakeAmount.toString() : '0'}
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
              keyboardType="numeric"
              editable={!betData.fixedStakeAmount && betData.status === 'OPEN'}
              selectTextOnFocus={!betData.fixedStakeAmount && betData.status === 'OPEN'}
            />

                {betData.fixedStakeAmount && (
                  <MaterialIcons name="lock" size={18} color="rgba(255, 255, 255, 0.4)" />
                )}
              </View>

              {!betData.fixedStakeAmount && userBetAmount && !isValidBetAmount() && (
                <Text style={{
                  color: '#FF6B6B',
                  fontSize: 12,
                  marginTop: 8
                }}>
                  Please enter a valid amount
                </Text>
              )}
            </>
          )}
        </View>

        {/* Insurance Section */}
        {betData.hasUserParticipated && betData.hasInsurance && betData.insuranceRefundPercentage && (
          <View style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderRadius: 18,
            marginHorizontal: 20,
            marginBottom: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: 'rgba(59, 130, 246, 0.2)'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <MaterialIcons name="shield" size={24} color="#3B82F6" style={{ marginRight: 12 }} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#3B82F6'
              }}>
                Insurance Active
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>Refund Coverage</Text>
                <Text style={{ color: '#3B82F6', fontSize: 18, fontWeight: '700' }}>
                  {betData.insuranceRefundPercentage}%
                </Text>
              </View>

              {betData.insuranceRefundAmount && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>Guaranteed Refund</Text>
                  <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '600' }}>
                    ${betData.insuranceRefundAmount}
                  </Text>
                </View>
              )}

              {betData.insuranceTier && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>Insurance Tier</Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '500' }}>
                    {betData.insuranceTier}
                  </Text>
                </View>
              )}

              <View style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: 'rgba(59, 130, 246, 0.2)'
              }}>
                <Text style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: 12,
                  lineHeight: 18
                }}>
                  If you lose this bet, you'll receive {betData.insuranceRefundPercentage}% of your stake back as a refund.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Resolution Information */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Resolution
          </Text>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Resolved by</Text>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                {betData.resolvedBy === 'CREATOR' ? 'Bet Creator' :
                 betData.resolvedBy === 'PARTICIPANTS' ? 'Participants' : 'Admin'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Evidence Required</Text>
              <Text style={{ color: betData.evidenceRequired ? '#00D4AA' : 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: '500' }}>
                {betData.evidenceRequired ? 'Yes' : 'No'}
              </Text>
            </View>

            {betData.evidenceRequired && betData.evidenceDescription && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, marginBottom: 4 }}>
                  Evidence Requirements:
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 14, lineHeight: 22 }}>
                  {betData.evidenceDescription}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Fulfillment Tracking - Show only for RESOLVED SOCIAL bets */}
        {betData.status === 'RESOLVED' && betData.stakeType === 'SOCIAL' && betData.socialStakeDescription && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <FulfillmentTracker
              betId={betData.id}
              betTitle={betData.title}
              socialStakeDescription={betData.socialStakeDescription}
              onRefresh={loadBetDetails}
            />
          </View>
        )}

        {/* Action Buttons */}
        {betData.status === 'OPEN' && !betData.hasUserParticipated && (
          <View style={{
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 40
          }}>
            <LoadingButton
              title="Join Bet"
              onPress={handleJoinBet}
              loading={isJoining}
              disabled={(!betData.fixedStakeAmount && !isValidBetAmount()) || !isValidBetSelection()}
              style={{
                shadowColor: '#00D4AA',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            />
          </View>
        )}

        {/* Already Joined Message */}
        {betData.status === 'OPEN' && betData.hasUserParticipated && (
          <View style={{
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 40
          }}>
            <View style={{
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 170, 0.3)',
              flexDirection: 'row',
              justifyContent: 'center'
            }}>
              <MaterialIcons name="check-circle" size={20} color="#00D4AA" style={{ marginRight: 8 }} />
              <Text style={{
                color: '#00D4AA',
                fontSize: 16,
                fontWeight: '700'
              }}>
                Already Joined
              </Text>
            </View>
          </View>
        )}

        {/* Resolve Button - Show when bet is CLOSED and user can resolve */}
        {betData.status === 'CLOSED' && canUserResolve() && (
          <View style={{
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 40
          }}>
            <TouchableOpacity
              onPress={() => setShowResolutionModal(true)}
              style={{
                backgroundColor: '#00D4AA',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: '#00D4AA',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              <MaterialIcons name="gavel" size={20} color="#000000" style={{ marginRight: 8 }} />
              <Text style={{
                color: '#000000',
                fontSize: 16,
                fontWeight: '700'
              }}>
                {betData.resolutionMethod === 'CONSENSUS_VOTING' ? 'Vote on Resolution' : 'Resolve Bet'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Resolution Modal */}
      <BetResolutionModal
        visible={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        onResolve={handleResolveBet}
        bet={betData}
        resolutionType={betData?.resolutionMethod === 'CONSENSUS_VOTING' ? 'vote' : 'resolve'}
      />

      {/* Cancel Bet Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: '#1a1a1f',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 8
            }}>
              Cancel Bet?
            </Text>

            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 20,
              lineHeight: 20
            }}>
              All participants will be refunded. This action cannot be undone.
            </Text>

            {/* Optional reason input */}
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 8
            }}>
              Reason for cancellation (optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                padding: 12,
                color: '#ffffff',
                fontSize: 14,
                marginBottom: 24,
                minHeight: 80,
                textAlignVertical: 'top'
              }}
              placeholder="e.g., Event was cancelled, Wrong bet setup..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              maxLength={500}
            />

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelBet}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  opacity: isCancelling ? 0.6 : 1
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}