import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService, BetResponse } from '../../services/bet/betService';
import BetResolutionModal from '../../components/bet/BetResolutionModal';
import { authService } from '../../services/auth/authService';
import { useAuth } from '../../contexts/AuthContext';

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
      setBetData(betResponse);

      // Set default bet amount if it's a fixed amount bet
      if (betResponse.minimumBet) {
        setUserBetAmount(betResponse.minimumBet.toString());
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
      case 'CLOSED': return '#FFA500';
      case 'RESOLVED': return '#6B7280';
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

  const handleResolveBet = async (outcome: string, reasoning?: string) => {
    try {
      // Determine if this is a direct resolution or a vote
      const resolutionType = betData?.resolutionMethod === 'CONSENSUS_VOTING' ? 'vote' : 'resolve';

      if (resolutionType === 'resolve') {
        await betService.resolveBet(parseInt(id), outcome, reasoning);
        Alert.alert('Success', 'Bet has been resolved successfully!');
      } else {
        await betService.voteOnResolution(parseInt(id), outcome, reasoning);
        Alert.alert('Success', 'Your vote has been submitted!');
      }

      // Reload bet details to show updated status
      await loadBetDetails();
    } catch (error) {
      console.error('Error resolving bet:', error);
      throw error;
    }
  };

  const handleJoinBet = async () => {
    if (!betData || !id) {
      Alert.alert('Error', 'Invalid bet data');
      return;
    }

    // Validate bet amount
    const amount = parseFloat(userBetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    // Validate minimum bet amount
    if (amount < betData.minimumBet) {
      Alert.alert('Error', `Minimum bet amount is $${betData.minimumBet}`);
      return;
    }

    // Validate maximum bet amount if set
    if (betData.maximumBet && amount > betData.maximumBet) {
      Alert.alert('Error', `Maximum bet amount is $${betData.maximumBet}`);
      return;
    }

    // Validate bet option selection
    if (!selectedOption) {
      Alert.alert('Error', 'Please select a betting option');
      return;
    }

    try {
      setIsJoining(true);

      // Map string option to number based on bet type
      let chosenOptionNumber = 1;
      if (betData.betType === 'BINARY') {
        chosenOptionNumber = selectedOption === 'Yes' ? 1 : 2;
      } else {
        // For other bet types, we need to map option text to number
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

      const placeBetRequest = {
        chosenOption: chosenOptionNumber,
        amount: amount,
        comment: undefined
      };

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
        Alert.alert('Error', errorMessage);
        return;
      }

      // Update the local bet data with the response
      setBetData(updatedBet);

      Alert.alert('Success', `Bet placed successfully!\nAmount: $${amount}\nOption: ${selectedOption}`);

      // Navigate back to the group page
      router.push(`/groups/${betData.groupId}`);

    } catch (error) {
      console.error('=== BET PLACEMENT ERROR ===');
      console.error('Error placing bet:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      Alert.alert('Error', 'Failed to place bet. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const getBetAmountForDisplay = () => {
    if (betData?.isFixedAmount) {
      return betData.betAmount.toString();
    }
    return userBetAmount;
  };

  const isValidBetAmount = () => {
    if (betData?.isFixedAmount) return true;
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
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
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
          </View>

          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#ffffff',
            lineHeight: 30,
            marginBottom: 12
          }}>
            {betData.title}
          </Text>

          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 22
          }}>
            {betData.description}
          </Text>
        </View>

        {/* Essential Details Card */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 16,
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 20,
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
                {formatDate(betData.joinDeadline)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Bet Ends</Text>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                {formatDate(betData.betEndDate)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>Bet Amount</Text>
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '600' }}>
                {betData.isFixedAmount ? `$${betData.betAmount} (Fixed)` : 'Variable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Betting Options Section */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 16,
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Your Selection
          </Text>


          {betData.betType === 'MULTIPLE_CHOICE' ? (
            <View style={{ gap: 8 }}>
              {(betData.options && betData.options.length > 0 ? betData.options : ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleOptionSelect(option)}
                  style={{
                    backgroundColor: selectedOption === option ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: selectedOption === option ? 2 : 1,
                    borderColor: selectedOption === option ? '#00D4AA' : 'rgba(255, 255, 255, 0.06)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
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
                style={{
                  flex: 1,
                  backgroundColor: selectedOption === 'Yes' ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: selectedOption === 'Yes' ? 2 : 1,
                  borderColor: selectedOption === 'Yes' ? '#00D4AA' : 'rgba(255, 255, 255, 0.06)',
                  alignItems: 'center'
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
                style={{
                  flex: 1,
                  backgroundColor: selectedOption === 'No' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: selectedOption === 'No' ? 2 : 1,
                  borderColor: selectedOption === 'No' ? '#FF3B30' : 'rgba(255, 255, 255, 0.06)',
                  alignItems: 'center'
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
                  borderColor: customValue ? 'rgba(0, 212, 170, 0.3)' : 'transparent'
                }}
                value={customValue}
                onChangeText={setCustomValue}
                placeholder="Enter your prediction"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
          )}
        </View>

        {/* Participants Overview */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 16,
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 20,
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
          borderRadius: 16,
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Your Bet Amount
          </Text>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: betData.isFixedAmount ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: betData.isFixedAmount ? 0 : 1,
            borderColor: betData.isFixedAmount ? 'transparent' : (isValidBetAmount() ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.2)')
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
                color: '#ffffff',
                fontSize: 18,
                fontWeight: '600',
                padding: 0
              }}
              value={getBetAmountForDisplay()}
              onChangeText={setUserBetAmount}
              placeholder={betData.isFixedAmount ? betData.betAmount.toString() : '0'}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              keyboardType="numeric"
              editable={!betData.isFixedAmount}
              selectTextOnFocus={!betData.isFixedAmount}
            />

            {betData.isFixedAmount && (
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

          {!betData.isFixedAmount && userBetAmount && !isValidBetAmount() && (
            <Text style={{
              color: '#FF6B6B',
              fontSize: 12,
              marginTop: 8
            }}>
              Please enter a valid amount
            </Text>
          )}
        </View>

        {/* Resolution Information */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 16,
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 20,
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
                <Text style={{ color: '#ffffff', fontSize: 14, lineHeight: 20 }}>
                  {betData.evidenceDescription}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {betData.status === 'OPEN' && (
          <View style={{
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 40
          }}>
            <TouchableOpacity
              onPress={handleJoinBet}
              disabled={isJoining || (!betData.isFixedAmount && !isValidBetAmount()) || !isValidBetSelection()}
              style={{
                backgroundColor: (isJoining || (!betData.isFixedAmount && !isValidBetAmount()) || !isValidBetSelection()) ? 'rgba(0, 212, 170, 0.3)' : '#00D4AA',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: '#00D4AA',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: (isJoining || (!betData.isFixedAmount && !isValidBetAmount()) || !isValidBetSelection()) ? 0.1 : 0.3,
                shadowRadius: 8,
                elevation: 8,
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              {isJoining ? (
                <>
                  <ActivityIndicator size="small" color="#000000" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: '#000000',
                    fontSize: 16,
                    fontWeight: '700'
                  }}>
                    Joining...
                  </Text>
                </>
              ) : (
                <Text style={{
                  color: '#000000',
                  fontSize: 16,
                  fontWeight: '700'
                }}>
                  Join Bet
                </Text>
              )}
            </TouchableOpacity>
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
                backgroundColor: '#FF9500',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: '#FF9500',
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
    </View>
  );
}