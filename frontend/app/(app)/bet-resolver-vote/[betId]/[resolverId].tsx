import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService, BetResponse, BetParticipationResponse } from '../../../../services/bet/betService';
import { Avatar } from '../../../../components/common/Avatar';

export default function BetResolverVote() {
  const { betId, resolverId, resolverName } = useLocalSearchParams<{
    betId: string;
    resolverId: string;
    resolverName: string;
  }>();
  const insets = useSafeAreaInsets();
  const [betData, setBetData] = useState<BetResponse | null>(null);
  const [participations, setParticipations] = useState<BetParticipationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [betId, resolverId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (!betId || !resolverId) {
        throw new Error('Bet ID and Resolver ID are required');
      }

      // Load bet details (includes resolver vote info)
      const betResponse = await betService.getBetById(parseInt(betId));
      setBetData(betResponse);

      // Load all participations
      const participationsResponse = await betService.getBetParticipations(parseInt(betId));
      setParticipations(participationsResponse);

    } catch (error) {
      console.error('Error loading resolver vote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Find the resolver's vote
  const resolver = betData?.resolvers?.find(r => r.id === parseInt(resolverId || '0'));
  const votedWinnerUserIds = resolver?.votedWinnerUserIds || [];

  // Filter participations to only show those the resolver voted for
  const votedParticipants = participations.filter(p => votedWinnerUserIds.includes(p.userId));

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
            {resolverName ? `${resolverName}'s Vote` : 'Resolver Vote'}
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

      {/* Subheader */}
      <View style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)'
      }}>
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center'
        }}>
          Selected {votedParticipants.length} winner{votedParticipants.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {votedParticipants.length > 0 ? (
          <View style={{ gap: 12 }}>
            {votedParticipants.map((participant) => (
              <View
                key={participant.participationId}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar
                    imageUrl={participant.profileImageUrl}
                    firstName={participant.displayName?.split(' ')[0] || participant.username}
                    lastName={participant.displayName?.split(' ')[1] || ''}
                    username={participant.username}
                    userId={participant.userId}
                    customSize={44}
                  />

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      {participant.displayName || participant.username}
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: 4
                    }}>
                      @{participant.username}
                    </Text>
                  </View>

                  <MaterialIcons name="check-circle" size={22} color="#10b981" />
                </View>

                {/* Show prediction */}
                {participant.predictedValue && (
                  <View style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255, 255, 255, 0.06)'
                  }}>
                    <Text style={{
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginBottom: 4
                    }}>
                      Prediction
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      {participant.predictedValue}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60
          }}>
            <MaterialIcons name="how-to-vote" size={48} color="rgba(255, 255, 255, 0.15)" />
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 16,
              marginTop: 16,
              fontWeight: '500'
            }}>
              No winners selected
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
