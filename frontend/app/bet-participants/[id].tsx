import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService, BetResponse, BetParticipationResponse } from '../../services/bet/betService';
import { authService } from '../../services/auth/authService';
import { Avatar } from '../../components/common/Avatar';

export default function BetParticipants() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [betData, setBetData] = useState<BetResponse | null>(null);
  const [participants, setParticipants] = useState<BetParticipationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (!id) {
        throw new Error('Bet ID is required');
      }

      // Load current user
      const userData = await authService.getCurrentUser();
      if (userData?.id) {
        setCurrentUserId(userData.id);
      }

      // Load bet details
      const betResponse = await betService.getBetById(parseInt(id));
      setBetData(betResponse);

      // Load participants
      const participantsData = await betService.getBetParticipations(parseInt(id));
      setParticipants(participantsData);

    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // Sort participants: winners first when resolved, otherwise by join order
  const sortedParticipants = [...participants].sort((a, b) => {
    if (betData?.status === 'RESOLVED') {
      // Winners first, then losers, then others
      const statusOrder: Record<string, number> = { WON: 0, LOST: 1, DRAW: 2 };
      const aOrder = statusOrder[a.status] ?? 3;
      const bOrder = statusOrder[b.status] ?? 3;
      return aOrder - bOrder;
    }
    // Default: keep original order (join order)
    return 0;
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 44
        }}>
          <Text style={{
            position: 'absolute',
            left: 0,
            right: 0,
            fontSize: 17,
            fontWeight: '600',
            color: '#ffffff',
            textAlign: 'center'
          }}>
            Participants
          </Text>

          <TouchableOpacity
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {sortedParticipants.length > 0 ? (
          <View style={{ gap: 12 }}>
            {sortedParticipants.map((participant) => {
              const isWinner = betData?.status === 'RESOLVED' && participant.status === 'WON';
              const isLoser = betData?.status === 'RESOLVED' && participant.status === 'LOST';
              const isDraw = betData?.status === 'RESOLVED' && betData?.outcome === 'DRAW';
              const isCurrentUser = participant.userId === currentUserId;

              return (
                <View
                  key={participant.participationId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: isCurrentUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {/* Avatar */}
                  <Avatar
                    imageUrl={participant.profileImageUrl}
                    firstName={participant.displayName?.split(' ')[0] || participant.username}
                    lastName={participant.displayName?.split(' ')[1] || ''}
                    username={participant.username}
                    userId={participant.userId}
                    customSize={44}
                  />

                  {/* Name & Choice */}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#ffffff'
                      }}>
                        {participant.displayName || participant.username}
                      </Text>
                      {isCurrentUser && (
                        <View style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4
                        }}>
                          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 9, fontWeight: '600' }}>YOU</Text>
                        </View>
                      )}
                    </View>

                    {/* Choice */}
                    {participant.chosenOptionText && (
                      <Text style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginTop: 4
                      }}>
                        {participant.chosenOptionText}
                      </Text>
                    )}
                    {participant.predictedValue && !participant.chosenOptionText && (
                      <Text style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginTop: 4
                      }}>
                        {participant.predictedValue}
                      </Text>
                    )}
                  </View>

                  {/* Status for resolved bets */}
                  {betData?.status === 'RESOLVED' && (
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: isWinner ? 'rgba(16, 185, 129, 0.1)' :
                                      isLoser ? 'rgba(239, 68, 68, 0.1)' :
                                      isDraw ? 'rgba(255, 255, 255, 0.06)' :
                                      'rgba(255, 255, 255, 0.06)'
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isWinner ? '#10b981' :
                               isLoser ? '#ef4444' :
                               isDraw ? 'rgba(255, 255, 255, 0.5)' :
                               'rgba(255, 255, 255, 0.5)'
                      }}>
                        {isWinner ? 'Won' : isLoser ? 'Lost' : isDraw ? 'Draw' : 'Pending'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60
          }}>
            <MaterialIcons name="group" size={48} color="rgba(255, 255, 255, 0.15)" />
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 16,
              marginTop: 16,
              fontWeight: '500'
            }}>
              No participants yet
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: 13,
              marginTop: 6
            }}>
              Be the first to join this bet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
