import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

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
  const [betData, setBetData] = useState<BetDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userBetAmount, setUserBetAmount] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    loadBetDetails();
  }, [id]);

  const loadBetDetails = async () => {
    try {
      setIsLoading(true);

      // Mock data for demonstration
      const mockBetData: BetDetailsData = {
        id: parseInt(id || '1'),
        title: "Who will win the NBA Finals 2024?",
        description: "Place your bets on which team will take home the championship trophy this year. Must be decided by official NBA announcement.",
        category: "Sports",
        creator: {
          id: 1,
          username: "sportsking",
          firstName: "Alex",
          lastName: "Johnson",
          profileImageUrl: undefined
        },
        createdAt: "2024-01-15T10:30:00Z",
        joinDeadline: "2024-06-01T23:59:59Z",
        betEndDate: "2024-06-20T23:59:59Z",
        betAmount: 50,
        isFixedAmount: false,
        bettingType: 'MULTIPLE_CHOICE',
        options: ["Lakers", "Celtics", "Warriors", "Heat"],
        participants: [
          {
            id: 2,
            username: "betmaster",
            firstName: "Sarah",
            lastName: "Davis",
            profileImageUrl: undefined,
            choice: "Lakers",
            amount: 50
          },
          {
            id: 3,
            username: "hoopsfan",
            firstName: "Mike",
            lastName: "Wilson",
            profileImageUrl: undefined,
            choice: "Celtics",
            amount: 50
          }
        ],
        resolvedBy: 'CREATOR',
        evidenceRequired: true,
        evidenceDescription: "Official NBA championship announcement or verified sports news source",
        status: 'OPEN'
      };

      // Simulate API delay
      setTimeout(() => {
        setBetData(mockBetData);
        setIsLoading(false);
      }, 800);

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

  const handleJoinBet = () => {
    if (!betData?.isFixedAmount && !userBetAmount.trim()) {
      Alert.alert('Error', 'Please enter a bet amount');
      return;
    }

    const amount = betData?.isFixedAmount ? betData.betAmount : parseFloat(userBetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    setIsJoining(true);
    // TODO: Implement join bet functionality
    setTimeout(() => {
      setIsJoining(false);
      Alert.alert('Coming Soon', `Bet joining functionality will be implemented next. Amount: $${amount}`);
    }, 1000);
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
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
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
                @{betData.creator.username}
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
            Betting Options
          </Text>

          {betData.bettingType === 'MULTIPLE_CHOICE' && betData.options ? (
            <View style={{ gap: 8 }}>
              {betData.options.map((option, index) => (
                <View key={index} style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.06)'
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                    {option}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)'
            }}>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                {betData.bettingType === 'YES_NO' ? 'Yes or No' : 'Enter custom value'}
              </Text>
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
            Participants ({betData.participants.length})
          </Text>

          {betData.participants.length > 0 ? (
            <View style={{ gap: 12 }}>
              {betData.participants.map((participant) => (
                <View key={participant.id} style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                    @{participant.username}
                  </Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    {participant.choice && (
                      <Text style={{ color: '#00D4AA', fontSize: 12, marginBottom: 2 }}>
                        {participant.choice}
                      </Text>
                    )}
                    <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
                      ${participant.amount}
                    </Text>
                  </View>
                </View>
              ))}
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
      </ScrollView>

      {/* Action Button */}
      {betData.status === 'OPEN' && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0a0a0f',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <TouchableOpacity
            onPress={handleJoinBet}
            disabled={isJoining || (!betData.isFixedAmount && !isValidBetAmount())}
            style={{
              backgroundColor: (isJoining || (!betData.isFixedAmount && !isValidBetAmount())) ? 'rgba(0, 212, 170, 0.3)' : '#00D4AA',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#00D4AA',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: (isJoining || (!betData.isFixedAmount && !isValidBetAmount())) ? 0.1 : 0.3,
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
    </View>
  );
}