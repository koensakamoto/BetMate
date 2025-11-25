import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService, BetResponse, BetParticipationResponse } from '../../services/bet/betService';
import BetResolutionModal from '../../components/bet/BetResolutionModal';
import { FulfillmentTracker } from '../../components/bet/FulfillmentTracker';
import { authService } from '../../services/auth/authService';
import { useAuth } from '../../contexts/AuthContext';
import { haptic } from '../../utils/haptics';
import LoadingButton from '../../components/common/LoadingButton';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Avatar } from '../../components/common/Avatar';

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
  const [participants, setParticipants] = useState<BetParticipationResponse[]>([]);

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
        description: betResponse.description,
        status: betResponse.status,
        outcome: betResponse.outcome,
        hasUserParticipated: betResponse.hasUserParticipated,
        userChoice: betResponse.userChoice,
        fixedStakeAmount: betResponse.fixedStakeAmount,
        minimumBet: betResponse.minimumBet,
        maximumBet: betResponse.maximumBet
      });
      setBetData(betResponse);

      // Fetch participants
      try {
        const participantsData = await betService.getBetParticipations(parseInt(id));
        setParticipants(participantsData);
      } catch (participantsError) {
        console.log('Could not load participants:', participantsError);
        // Non-fatal - don't show error to user
      }

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
    return formatDisplayDate(dateString);
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

  // Check if user is a resolver (regardless of bet status)
  const isUserResolver = () => {
    if (!betData || !currentUserId) {
      console.log('[isUserResolver] No betData or currentUserId', { betData: !!betData, currentUserId });
      return false;
    }

    console.log('[isUserResolver] Checking:', {
      resolutionMethod: betData.resolutionMethod,
      creatorId: betData.creator?.id,
      currentUserId,
      hasUserParticipated: betData.hasUserParticipated
    });

    // Check based on resolution method
    if (betData.resolutionMethod === 'SELF') {
      const result = betData.creator?.id === currentUserId;
      console.log('[isUserResolver] SELF check:', result);
      return result;
    } else if (betData.resolutionMethod === 'ASSIGNED_RESOLVERS') {
      // For now, allow creator and assume resolver check will be done on backend
      // TODO: Check if user is in the assigned resolvers list
      const result = betData.creator?.id === currentUserId;
      console.log('[isUserResolver] ASSIGNED_RESOLVERS check:', result);
      return result;
    } else if (betData.resolutionMethod === 'PARTICIPANT_VOTE') {
      // In participant voting, all participants are potential resolvers
      const result = betData.hasUserParticipated;
      console.log('[isUserResolver] PARTICIPANT_VOTE check:', result);
      return result;
    }

    console.log('[isUserResolver] No matching resolution method');
    return false;
  };

  // Check if user can resolve the bet (must be CLOSED and be a resolver)
  const canUserResolve = () => {
    if (!betData || !currentUserId) {
      console.log('[canUserResolve] No betData or currentUserId');
      return false;
    }

    console.log('[canUserResolve] Checking:', { status: betData.status });

    // Check if bet is in CLOSED status (ready for resolution)
    if (betData.status !== 'CLOSED') {
      console.log('[canUserResolve] Status is not CLOSED');
      return false;
    }

    const result = isUserResolver();
    console.log('[canUserResolve] Result:', result);
    return result;
  };

  const handleResolveBet = async (outcome?: string, winnerUserIds?: number[], reasoning?: string) => {
    haptic.heavy();
    try {
      // Determine if this is a direct resolution or a vote
      const resolutionType = betData?.resolutionMethod === 'PARTICIPANT_VOTE' ? 'vote' : 'resolve';

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

      // Show success message and navigate back
      Alert.alert('Success', 'Bet cancelled. All participants have been refunded.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back - GroupBetsTab will auto-refresh via useFocusEffect
            router.back();
          }
        }
      ]);
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

    // For SOCIAL bets, use amount of 0 (no credits involved)
    // For CREDIT bets, validate the amount
    let amount: number;

    if (betData.stakeType === 'SOCIAL') {
      // Social bets don't use credits, so amount is irrelevant
      amount = 0;
    } else {
      // CREDIT bets: validate the amount
      amount = parseFloat(userBetAmount);
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

          console.log('=== OPTION MAPPING DEBUG ===');
          console.log('Backend options from betData.options:', JSON.stringify(betData?.options));
          console.log('backendOptions variable:', JSON.stringify(backendOptions));
          console.log('Displayed options:', JSON.stringify(displayedOptions));
          console.log('Selected option (exact):', JSON.stringify(selectedOption));
          console.log('Using fallback options:', usingFallbackOptions);

          let optionIndex;
          if (usingFallbackOptions) {
            // When using fallback options, map directly based on display order
            optionIndex = displayedOptions.indexOf(selectedOption);
            console.log('Using fallback - indexOf result:', optionIndex);
          } else {
            // When using real backend options, find in backend options
            optionIndex = backendOptions.indexOf(selectedOption);
            console.log('Using backend options - indexOf result:', optionIndex);
            // Also log each option comparison for debugging
            backendOptions.forEach((opt: string, idx: number) => {
              console.log(`  Option[${idx}]: "${opt}" === "${selectedOption}" ? ${opt === selectedOption}`);
            });
          }

          console.log('Final optionIndex:', optionIndex);
          console.log('Final chosenOptionNumber will be:', optionIndex + 1);

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

      haptic.success();

      // Reload bet details to show updated participation state
      await loadBetDetails();

    } catch (error: any) {
      console.error('=== BET PLACEMENT ERROR ===');
      console.error('Error placing bet:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      haptic.error();
      // Show the actual error message from the API if available
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to place bet. Please try again.';
      Alert.alert('Error', errorMessage);
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

  // Helper function to get option text from outcome enum
  const getOptionTextFromOutcome = (outcome: string | undefined): string => {
    if (!outcome || !betData) return 'Unknown';
    if (outcome === 'DRAW') return 'Draw';
    if (outcome === 'CANCELLED') return 'Cancelled';

    const optionIndexMap: Record<string, number> = {
      'OPTION_1': 0, 'OPTION_2': 1, 'OPTION_3': 2, 'OPTION_4': 3
    };
    const optionIndex = optionIndexMap[outcome];
    if (optionIndex === undefined) return outcome;

    if (betData.betType === 'BINARY') {
      return optionIndex === 0 ? 'Yes' : 'No';
    }

    const options = betData.options && betData.options.length > 0
      ? betData.options
      : ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
    return options[optionIndex] || `Option ${optionIndex + 1}`;
  };

  // Helper function to determine user's result
  const getUserBetResult = (): 'WIN' | 'LOSS' | 'DRAW' | 'CANCELLED' | 'DID_NOT_PARTICIPATE' => {
    if (!betData?.hasUserParticipated) return 'DID_NOT_PARTICIPATE';
    if (betData.outcome === 'CANCELLED') return 'CANCELLED';
    if (betData.outcome === 'DRAW') return 'DRAW';
    if (!betData.outcome) return 'DID_NOT_PARTICIPATE';
    // If user participated but userChoice is missing, try to determine from selectedOption state
    if (!betData.userChoice) {
      // User participated but we don't have their choice info - show as participated
      return 'LOSS'; // Default to showing they participated
    }
    return betData.outcome === betData.userChoice ? 'WIN' : 'LOSS';
  };

  // Get all options for display
  const getAllBetOptions = (): string[] => {
    if (!betData) return [];
    if (betData.betType === 'BINARY') {
      return ['Yes', 'No'];
    }
    return betData.options && betData.options.length > 0
      ? betData.options
      : ['Option 1', 'Option 2', 'Option 3'];
  };

  // Check if an option is the winning option
  const isWinningOption = (optionText: string, index: number): boolean => {
    if (!betData?.outcome) return false;
    const optionOutcome = `OPTION_${index + 1}`;
    return betData.outcome === optionOutcome;
  };

  // Check if an option is the user's choice
  const isUserChoice = (optionText: string, index: number): boolean => {
    if (!betData?.userChoice) return false;
    const optionOutcome = `OPTION_${index + 1}`;
    return betData.userChoice === optionOutcome;
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

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={20}
        enableOnAndroid={true}
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

            {/* 3-dot menu (only for creator on non-resolved/non-cancelled bets) */}
            {betData.creator.id === currentUserId && betData.status !== 'RESOLVED' && betData.status !== 'CANCELLED' && (
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

          {betData.description && (
            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 22,
              marginBottom: isUserResolver() && betData.status !== 'RESOLVED' ? 16 : 0
            }}>
              {betData.description}
            </Text>
          )}

          {/* Resolver Badge - Show when user is resolver and bet is not resolved */}
          {isUserResolver() && betData.status !== 'RESOLVED' && (
            <View style={{
              backgroundColor: 'rgba(0, 212, 170, 0.12)',
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 170, 0.25)',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <MaterialIcons name="verified-user" size={18} color="#00D4AA" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#00D4AA',
                  fontSize: 14,
                  fontWeight: '700',
                  marginBottom: 2
                }}>
                  You are the Resolver
                </Text>
                <Text style={{
                  color: 'rgba(0, 212, 170, 0.8)',
                  fontSize: 12,
                  lineHeight: 16
                }}>
                  {betData.status === 'OPEN'
                    ? "You'll be able to resolve this bet once betting closes"
                    : "You can resolve the bet now"}
                </Text>
              </View>
            </View>
          )}
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
          </View>
        </View>

        {/* Bet Options / Results Section - Hide entirely for PREDICTION bets (they use custom value input) */}
        {betData.betType !== 'PREDICTION' && (
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 18,
          marginHorizontal: 20,
          marginBottom: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {betData.status === 'RESOLVED' ? 'Results' : (betData.hasUserParticipated ? 'Your Selection' : 'Bet Options')}
            </Text>
            {/* Show win/loss badge for participants on resolved bets */}
            {betData.status === 'RESOLVED' && betData.hasUserParticipated === true && betData.outcome && betData.outcome !== 'CANCELLED' && betData.outcome !== 'DRAW' && (() => {
              const result = getUserBetResult();
              const isWin = result === 'WIN';
              return (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isWin ? 'rgba(0, 212, 170, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8
                }}>
                  <MaterialIcons
                    name={isWin ? 'emoji-events' : 'close'}
                    size={14}
                    color={isWin ? '#00D4AA' : '#EF4444'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isWin ? '#00D4AA' : '#EF4444'
                  }}>
                    {isWin ? 'You Won' : 'You Lost'}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* RESOLVED: Show results view */}
          {betData.status === 'RESOLVED' ? (
            betData.outcome === 'CANCELLED' ? (
              // Cancelled state
              <View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  padding: 14,
                  borderRadius: 12
                }}>
                  <MaterialIcons name="cancel" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600' }}>
                      Bet Cancelled
                    </Text>
                    {betData.cancellationReason && (
                      <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, marginTop: 4 }}>
                        {betData.cancellationReason}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ) : betData.outcome === 'DRAW' ? (
              // Draw state - show options with draw indicator
              <View style={{ gap: 10 }}>
                {/* Draw banner */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 6
                }}>
                  <MaterialIcons name="balance" size={18} color="#fbbf24" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fbbf24', fontSize: 13, fontWeight: '600' }}>
                    Draw - No Winner
                  </Text>
                </View>

                {/* Show all options */}
                {getAllBetOptions().map((option, index) => {
                  const isUserPick = isUserChoice(option, index);

                  return (
                    <View
                      key={index}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.06)',
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      {/* Empty circle (no winner) */}
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        marginRight: 12
                      }} />

                      {/* Option text */}
                      <Text style={{
                        flex: 1,
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: 14,
                        fontWeight: '500'
                      }}>
                        {option}
                      </Text>

                      {/* User pick badge */}
                      {isUserPick && betData.hasUserParticipated && (
                        <View style={{
                          backgroundColor: 'rgba(251, 191, 36, 0.2)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6
                        }}>
                          <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '700' }}>
                            YOU
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              // Normal results with options
              <View style={{ gap: 10 }}>
                {getAllBetOptions().map((option, index) => {
                  const isWinner = isWinningOption(option, index);
                  const isUserPick = isUserChoice(option, index);

                  return (
                    <View
                      key={index}
                      style={{
                        backgroundColor: isWinner ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: isWinner ? 1.5 : 1,
                        borderColor: isWinner ? 'rgba(0, 212, 170, 0.4)' : 'rgba(255, 255, 255, 0.06)',
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      {/* Checkmark circle */}
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: isWinner ? '#00D4AA' : 'rgba(255, 255, 255, 0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        {isWinner && <MaterialIcons name="check" size={12} color="#000000" />}
                      </View>

                      {/* Option text */}
                      <Text style={{
                        flex: 1,
                        color: isWinner ? '#00D4AA' : 'rgba(255, 255, 255, 0.6)',
                        fontSize: 14,
                        fontWeight: isWinner ? '600' : '500'
                      }}>
                        {option}
                      </Text>

                      {/* Badges */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {isWinner && (
                          <View style={{
                            backgroundColor: 'rgba(0, 212, 170, 0.2)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6
                          }}>
                            <Text style={{ color: '#00D4AA', fontSize: 10, fontWeight: '700' }}>
                              CORRECT
                            </Text>
                          </View>
                        )}
                        {isUserPick && betData.hasUserParticipated && (
                          <View style={{
                            backgroundColor: isWinner ? 'rgba(0, 212, 170, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6
                          }}>
                            <Text style={{ color: isWinner ? '#00D4AA' : '#EF4444', fontSize: 10, fontWeight: '700' }}>
                              YOU
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )
          ) : (
            // NOT RESOLVED: Show betting options (existing UI)
            <>
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
              ) : null}
            </>
          )}
        </View>
        )}

        {/* Participants Overview - Clickable Card (only show if there are participants) */}
        {participants.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push(`/bet-participants/${betData.id}`)}
            activeOpacity={0.7}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 18,
              marginHorizontal: 20,
              marginBottom: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {/* Stacked Avatars */}
                <View style={{ flexDirection: 'row', marginRight: 12 }}>
                  {participants.slice(0, 4).map((participant, index) => (
                    <View
                      key={participant.participationId}
                      style={{
                        marginLeft: index > 0 ? -10 : 0,
                        borderWidth: 2,
                        borderColor: '#0a0a0f',
                        borderRadius: 18,
                        zIndex: 4 - index
                      }}
                    >
                      <Avatar
                        imageUrl={participant.profileImageUrl}
                        firstName={participant.displayName?.split(' ')[0] || participant.username}
                        lastName={participant.displayName?.split(' ')[1] || ''}
                        username={participant.username}
                        userId={participant.userId}
                        customSize={32}
                      />
                    </View>
                  ))}
                  {(betData.totalParticipants || 0) > 4 && (
                    <View style={{
                      marginLeft: -10,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: 2,
                      borderColor: '#0a0a0f',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, fontWeight: '600' }}>
                        +{(betData.totalParticipants || 0) - 4}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>
                    {betData.totalParticipants || 0} {(betData.totalParticipants || 0) === 1 ? 'Participant' : 'Participants'}
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginTop: 2 }}>
                    Tap to view all
                  </Text>
                </View>
              </View>

              {/* Chevron */}
              <MaterialIcons name="chevron-right" size={24} color="rgba(255, 255, 255, 0.3)" />
            </View>
          </TouchableOpacity>
        )}

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

        {/* Prediction Input - Show for PREDICTION bets right above Join Bet */}
        {betData.betType === 'PREDICTION' && betData.status === 'OPEN' && !betData.hasUserParticipated && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 18,
            marginHorizontal: 20,
            marginBottom: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 12
            }}>
              Your Prediction
            </Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: '#ffffff',
                fontSize: 15,
                borderWidth: customValue ? 1.5 : 1,
                borderColor: customValue ? 'rgba(0, 212, 170, 0.4)' : 'rgba(255, 255, 255, 0.1)'
              }}
              value={customValue}
              onChangeText={setCustomValue}
              placeholder="Enter your prediction"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
            {/* Show disabled state if user has already voted (for PARTICIPANT_VOTE) */}
            {betData.resolutionMethod === 'PARTICIPANT_VOTE' && betData.hasUserVoted ? (
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                <MaterialIcons name="check-circle" size={20} color="#00D4AA" style={{ marginRight: 8 }} />
                <Text style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: 16,
                  fontWeight: '700'
                }}>
                  Vote Submitted
                </Text>
              </View>
            ) : (
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
                  {betData.resolutionMethod === 'PARTICIPANT_VOTE' ? 'Vote on Resolution' : 'Resolve Bet'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Resolution Modal */}
      <BetResolutionModal
        visible={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        onResolve={handleResolveBet}
        bet={betData}
        resolutionType={betData?.resolutionMethod === 'PARTICIPANT_VOTE' ? 'vote' : 'resolve'}
      />

      {/* Cancel Bet Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isCancelling && setShowCancelModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }}>
          <View style={{
            backgroundColor: '#1a1a1f',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: insets.bottom + 24
          }}>
            {/* Header with close button */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#ffffff'
              }}>
                Cancel Bet
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={isCancelling}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <MaterialIcons name="close" size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 24,
              lineHeight: 22
            }}>
              All participants will be refunded their bet amount.
            </Text>

            {/* Reason input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 10
              }}>
                Reason for cancellation
                <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: '400' }}> (optional)</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 12,
                  padding: 14,
                  color: '#ffffff',
                  fontSize: 15,
                  minHeight: 100,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: cancelReason ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'
                }}
                placeholder="Let participants know why..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                maxLength={500}
                editable={!isCancelling}
              />
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.3)',
                textAlign: 'right',
                marginTop: 6
              }}>
                {cancelReason.length}/500
              </Text>
            </View>

            {/* Action button */}
            <TouchableOpacity
              onPress={handleCancelBet}
              disabled={isCancelling}
              style={{
                backgroundColor: '#EF4444',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: isCancelling ? 0.7 : 1
              }}
            >
              {isCancelling ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#ffffff'
                  }}>
                    Cancelling...
                  </Text>
                </>
              ) : (
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  Cancel Bet
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}