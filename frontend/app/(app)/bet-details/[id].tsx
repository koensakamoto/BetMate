import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService } from '../../../services/bet/betService';
import BetResolutionModal, { BetResolutionModalRef } from '../../../components/bet/BetResolutionModal';
import { FulfillmentTracker } from '../../../components/bet/FulfillmentTracker';
import { ResolverInfoSection } from '../../../components/bet/ResolverInfoSection';
import { BetJoinSuccessModal } from '../../../components/bet/BetJoinSuccessModal';
import { ResultsCard } from '../../../components/bet/ResultsCard';
import { useAuth } from '../../../contexts/AuthContext';
import { haptic } from '../../../utils/haptics';
import LoadingButton from '../../../components/common/LoadingButton';
import { formatDisplayDate } from '../../../utils/dateUtils';
import { Avatar } from '../../../components/common/Avatar';
import { SkeletonBetDetails } from '../../../components/common/SkeletonCard';
import { useBetDetailsCache, invalidateBet, updateBetCache } from '../../../hooks/useBetDetailsCache';

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
  const betId = id ? parseInt(id) : null;

  // Use cached bet details with stale-while-revalidate
  const {
    bet: betData,
    participants,
    isLoading,
    error,
    refresh: refreshBetDetails,
  } = useBetDetailsCache(betId);

  // Refs
  const resolutionModalRef = useRef<BetResolutionModalRef>(null);

  // Local UI state
  const [userBetAmount, setUserBetAmount] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showJoinSuccessModal, setShowJoinSuccessModal] = useState(false);
  const [showResolutionInfo, setShowResolutionInfo] = useState(false);

  // Sync local form state when cached bet data changes
  useEffect(() => {
    if (!betData) return;

    // If user has already participated, pre-populate their selection and amount
    if (betData.hasUserParticipated) {
      // Pre-populate bet amount
      if (betData.userAmount) {
        setUserBetAmount(betData.userAmount.toString());
      }

      // Pre-populate selected option
      if (betData.userChoice) {
        // Map backend choice to display option
        if (betData.betType === 'BINARY') {
          // For binary bets, map OPTION_1 to 'Yes', OPTION_2 to 'No'
          const displayChoice = betData.userChoice === 'OPTION_1' ? 'Yes' : 'No';
          setSelectedOption(displayChoice);
        } else if (betData.betType === 'MULTIPLE_CHOICE') {
          // For multiple choice, map option number to option text
          const optionMap = {
            'OPTION_1': 0,
            'OPTION_2': 1,
            'OPTION_3': 2,
            'OPTION_4': 3
          };
          const optionIndex = optionMap[betData.userChoice as keyof typeof optionMap];
          const options = betData.options && betData.options.length > 0
            ? betData.options
            : ['Option 1', 'Option 2', 'Option 3'];
          if (optionIndex !== undefined && options[optionIndex]) {
            setSelectedOption(options[optionIndex]);
          }
        } else if (betData.betType === 'PREDICTION') {
          setCustomValue(betData.userChoice);
        }
      }
    } else {
      // Set default bet amount if it's a fixed amount bet and user hasn't joined
      if (betData.fixedStakeAmount) {
        setUserBetAmount(betData.fixedStakeAmount.toString());
      } else if (betData.minimumBet) {
        setUserBetAmount(betData.minimumBet.toString());
      }
    }
  }, [betData]);

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
    if (!betData || !user?.id) {
      return false;
    }

    // Check based on resolution method
    if (betData.resolutionMethod === 'SELF') {
      return betData.creator?.id === user?.id;
    } else if (betData.resolutionMethod === 'ASSIGNED_RESOLVERS') {
      // Check if user is in the assigned resolvers list
      const resolvers = betData.resolvers || [];
      return resolvers.some(resolver => resolver.id === user?.id);
    } else if (betData.resolutionMethod === 'PARTICIPANT_VOTE') {
      // In participant voting, all participants are potential resolvers
      return betData.hasUserParticipated;
    }

    return false;
  };

  // Check if user can resolve the bet (must be CLOSED and be a resolver)
  const canUserResolve = () => {
    if (!betData || !user?.id) {
      return false;
    }

    // Check if bet is in CLOSED status (ready for resolution)
    if (betData.status !== 'CLOSED') {
      return false;
    }

    return isUserResolver();
  };

  const handleResolveBet = async (outcome?: string, winnerUserIds?: number[], reasoning?: string) => {
    if (!betId) return;
    haptic.heavy();
    try {
      // Always use voting - resolution method determines WHO resolves, not HOW
      // Backend handles: wait for all resolvers OR deadline, then resolve with consensus
      // - BINARY/MULTIPLE_CHOICE bets use outcome
      // - PREDICTION bets use winnerUserIds
      await betService.voteOnResolution(betId, outcome, winnerUserIds, reasoning);
      haptic.success();
      Alert.alert('Success', 'Your vote has been submitted!');

      // Invalidate cache and refresh to show updated status
      invalidateBet(betId);
      await refreshBetDetails();
    } catch (error) {
      haptic.error();
      throw error;
    }
  };

  const handleCancelBet = async () => {
    if (!betId) return;
    haptic.heavy();
    setIsCancelling(true);
    try {
      const reason = cancelReason.trim();
      await betService.cancelBet(betId, reason || undefined);
      haptic.success();

      // Close modal and reset state immediately
      setShowCancelModal(false);
      setCancelReason('');
      setIsCancelling(false);

      // Invalidate cache since bet state changed
      invalidateBet(betId);

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
    } catch {
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

          const optionIndex = usingFallbackOptions
            ? displayedOptions.indexOf(selectedOption)
            : backendOptions.indexOf(selectedOption);

          if (optionIndex === -1) {
            Alert.alert('Error', 'Invalid option selected. Please try again.');
            return;
          }

          chosenOptionNumber = optionIndex + 1;
        }

        placeBetRequest = {
          chosenOption: chosenOptionNumber,
          amount: amount,
        };
      }

      const updatedBet = await betService.placeBet(betId!, placeBetRequest);

      // Check if the response indicates an error
      if (updatedBet.success === false || updatedBet.error) {
        const errorMessage = updatedBet.message || updatedBet.error || 'Failed to place bet';
        haptic.error();
        Alert.alert('Error', errorMessage);
        return;
      }

      haptic.success();

      // Update cache with the response (optimistic update)
      updateBetCache(betId!, updatedBet);

      // Refresh to get updated participants in background
      refreshBetDetails();

      // Show success modal
      setShowJoinSuccessModal(true);

    } catch (error: any) {
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

  // Show skeleton only when loading with no cached data
  if (isLoading && !betData) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        <SkeletonBetDetails />
      </>
    );
  }

  // Error state (when no cached data to show)
  if (error && !betData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, marginBottom: 16 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => refreshBetDetails()}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#00D4AA'
          }}
        >
          <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
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
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={100}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        resetScrollToCoords={null}
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
            {betData.creator.id === user?.id && betData.status !== 'RESOLVED' && betData.status !== 'CANCELLED' && (
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
              marginBottom: isUserResolver() && betData.status === 'OPEN' ? 16 : 0
            }}>
              {betData.description}
            </Text>
          )}

          {/* Resolver Badge - Only show when bet is OPEN and user is a resolver */}
          {isUserResolver() && betData.status === 'OPEN' && (
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
                }}>
                  {/* Determine resolver count based on resolution method */}
                  {betData.resolutionMethod === 'SELF'
                    ? 'You are the resolver'
                    : betData.resolutionMethod === 'ASSIGNED_RESOLVERS'
                      ? (betData.resolvers && betData.resolvers.length > 1 ? 'You are a resolver' : 'You are the resolver')
                      : 'You are a resolver'}
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

            {/* Resolver Information */}
            <ResolverInfoSection bet={betData} currentUserId={user?.id || null} />

            {/* Collapsible Resolution Info - only show for multi-resolver methods */}
            {(betData.resolutionMethod === 'ASSIGNED_RESOLVERS' || betData.resolutionMethod === 'PARTICIPANT_VOTE') && (
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowResolutionInfo(!showResolutionInfo)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="help-outline" size={16} color="rgba(255, 255, 255, 0.5)" />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13 }}>
                      How does resolution work?
                    </Text>
                  </View>
                  <MaterialIcons
                    name={showResolutionInfo ? 'expand-less' : 'expand-more'}
                    size={20}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </TouchableOpacity>

                {showResolutionInfo && (
                  <View style={{
                    backgroundColor: 'rgba(0, 212, 170, 0.08)',
                    borderRadius: 10,
                    padding: 12,
                    marginTop: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(0, 212, 170, 0.15)'
                  }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, lineHeight: 18 }}>
                      {betData.betType === 'MULTIPLE_CHOICE'
                        ? 'Resolvers vote on which option won. The option with the most votes wins. If there\'s a tie, the bet ends in a draw.'
                        : 'Resolvers vote on each participant\'s prediction. Participants with majority votes win, 50% results in a draw, less than 50% lose.'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Bet Options / Results Section - Hide entirely for PREDICTION bets (they use custom value input) */}
        {betData.betType !== 'PREDICTION' && (
          betData.status === 'RESOLVED' ? (
            // RESOLVED: Use new ResultsCard component
            <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
              <ResultsCard
                outcome={betData.outcome || null}
                userChoice={betData.userChoice || null}
                hasUserParticipated={betData.hasUserParticipated || false}
                betType={betData.betType as 'BINARY' | 'MULTIPLE_CHOICE' | 'PREDICTION'}
                options={betData.options || []}
                cancellationReason={betData.cancellationReason}
                voteDistribution={betData.votingProgress?.voteDistribution}
                totalResolvers={betData.votingProgress?.totalResolvers}
              />
            </View>
          ) : (
            // NOT RESOLVED: Show betting options (existing UI)
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
                  {betData.hasUserParticipated ? 'Your Selection' : 'Bet Options'}
                </Text>
              </View>

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
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          color: selectedOption === option ? '#00D4AA' : '#ffffff',
                          fontSize: 14,
                          fontWeight: selectedOption === option ? '600' : '500'
                        }}>
                          {option}
                        </Text>
                      </View>
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
            </View>
          )
        )}

        {/* Participants Overview - Clickable Card (only show if there are participants) */}
        {participants.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/bet-participants/${betData.id}`)}
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
                What's at Stake
              </Text>
              <Text style={{
                color: '#00D4AA',
                fontSize: 17,
                fontWeight: '600',
                lineHeight: 24
              }}>
                {betData.socialStakeDescription || 'Just for fun'}
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
              onRefresh={refreshBetDetails}
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
            {/* Show disabled state if user has already voted */}
            {betData.hasUserVoted ? (
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
                onPress={() => resolutionModalRef.current?.present()}
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
        ref={resolutionModalRef}
        onClose={() => {}}
        onResolve={handleResolveBet}
        bet={betData}
        participations={participants}
        resolutionType="vote"
      />

      {/* Bet Join Success Modal */}
      <BetJoinSuccessModal
        visible={showJoinSuccessModal}
        onClose={() => setShowJoinSuccessModal(false)}
        betTitle={betData?.title}
        selectedOption={betData?.betType === 'PREDICTION' ? customValue : selectedOption || undefined}
        amount={parseFloat(userBetAmount) || betData?.fixedStakeAmount}
        isSocialBet={betData?.stakeType === 'SOCIAL'}
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