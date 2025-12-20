import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { betService, BetResponse, BetParticipationResponse } from '../../../../services/bet/betService';
import { Avatar } from '../../../../components/common/Avatar';

// Simple in-memory cache for resolver vote data
const cache: Map<string, { betData: BetResponse; participations: BetParticipationResponse[]; timestamp: number }> = new Map();
const CACHE_TTL = 60000; // 1 minute cache

// Skeleton placeholder component
const SkeletonBox: React.FC<{ width: number | string; height: number; borderRadius?: number; style?: object }> = ({
  width, height, borderRadius = 8, style
}) => (
  <View style={[{
    width,
    height,
    borderRadius,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  }, style]} />
);

const LoadingSkeleton: React.FC = () => (
  <View style={{ padding: 20 }}>
    {/* Vote section skeleton */}
    <SkeletonBox width={100} height={14} style={{ marginBottom: 12 }} />
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 16,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 24
    }}>
      <SkeletonBox width={36} height={36} borderRadius={18} />
      <SkeletonBox width={150} height={20} />
    </View>

    {/* Reasoning skeleton */}
    <SkeletonBox width={80} height={14} style={{ marginBottom: 12 }} />
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 14,
      padding: 18,
    }}>
      <SkeletonBox width="100%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBox width="80%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBox width="60%" height={16} />
    </View>
  </View>
);

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
    if (!betId || !resolverId) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `${betId}-${resolverId}`;
    const cached = cache.get(cacheKey);

    // Use cache if valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setBetData(cached.betData);
      setParticipations(cached.participations);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load bet details and participations in parallel
      const [betResponse, participationsResponse] = await Promise.all([
        betService.getBetById(parseInt(betId)),
        betService.getBetParticipations(parseInt(betId))
      ]);

      setBetData(betResponse);
      setParticipations(participationsResponse);

      // Update cache
      cache.set(cacheKey, {
        betData: betResponse,
        participations: participationsResponse,
        timestamp: Date.now()
      });

    } catch {
      // Error loading resolver vote
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (isLoading) {
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
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
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
        <LoadingSkeleton />
      </View>
    );
  }

  // Find the resolver's vote
  const resolver = betData?.resolvers?.find(r => r.id === parseInt(resolverId || '0'));
  const votedWinnerUserIds = resolver?.votedWinnerUserIds || [];
  const votedOutcome = resolver?.votedOutcome;
  const reasoning = resolver?.reasoning;
  const isPredictionBet = betData?.betType === 'PREDICTION';
  const isMCQBet = betData?.betType === 'MULTIPLE_CHOICE';

  // Filter participations to only show those the resolver voted for (for prediction bets)
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* MCQ Bet - Show voted option */}
        {isMCQBet && votedOutcome && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Voted Option
            </Text>
            <View style={{
              backgroundColor: 'rgba(0, 212, 170, 0.08)',
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 170, 0.2)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MaterialIcons name="check" size={20} color="#00D4AA" />
              </View>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#ffffff',
                flex: 1
              }}>
                {votedOutcome}
              </Text>
            </View>
          </View>
        )}

        {/* Prediction Bet - Show selected winners */}
        {isPredictionBet && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Selected {votedParticipants.length} Winner{votedParticipants.length !== 1 ? 's' : ''}
            </Text>
            {votedParticipants.length > 0 ? (
              <View style={{ gap: 10 }}>
                {votedParticipants.map((participant) => (
                  <View
                    key={participant.participationId}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.06)',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: 'rgba(16, 185, 129, 0.15)'
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
                          marginTop: 2
                        }}>
                          @{participant.username}
                        </Text>
                      </View>

                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <MaterialIcons name="check" size={16} color="#10b981" />
                      </View>
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
                          fontSize: 11,
                          color: 'rgba(255, 255, 255, 0.4)',
                          marginBottom: 4,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}>
                          Their Prediction
                        </Text>
                        <Text style={{
                          fontSize: 15,
                          color: '#ffffff',
                          fontWeight: '600'
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
                paddingVertical: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 14,
              }}>
                <MaterialIcons name="how-to-vote" size={36} color="rgba(255, 255, 255, 0.15)" />
                <Text style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: 14,
                  marginTop: 12,
                }}>
                  No winners selected
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Reasoning Section */}
        {reasoning && (
          <View>
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Reasoning
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 14,
              padding: 18,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
              borderLeftWidth: 3,
              borderLeftColor: '#00D4AA',
            }}>
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <MaterialIcons name="format-quote" size={20} color="rgba(0, 212, 170, 0.4)" />
              </View>
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 24,
              }}>
                {reasoning}
              </Text>
            </View>
          </View>
        )}

        {/* No vote info */}
        {!votedOutcome && votedParticipants.length === 0 && !reasoning && (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60
          }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <MaterialIcons name="how-to-vote" size={32} color="rgba(255, 255, 255, 0.2)" />
            </View>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 16,
              fontWeight: '500'
            }}>
              No vote information available
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: 13,
              marginTop: 4
            }}>
              This resolver hasn&apos;t submitted their vote yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
