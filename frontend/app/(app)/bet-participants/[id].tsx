import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useBetDetailsCache } from '../../../hooks/useBetDetailsCache';
import { useAuth } from '../../../contexts/AuthContext';
import { Avatar } from '../../../components/common/Avatar';

export default function BetParticipants() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bet: betData, participants, isLoading } = useBetDetailsCache(id ? parseInt(id) : null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WON' | 'LOST' | 'DRAW'>('ALL');
  const currentUserId = user?.id ?? null;

  const handleBackPress = () => {
    router.back();
  };

  // Filter and sort participants
  const filteredAndSortedParticipants = [...participants]
    .filter((p) => {
      if (betData?.status !== 'RESOLVED' || statusFilter === 'ALL') return true;
      return p.status === statusFilter;
    })
    .sort((a, b) => {
      if (betData?.status === 'RESOLVED') {
        // Winners first, then draws, then losers
        const statusOrder: Record<string, number> = { WON: 0, DRAW: 1, LOST: 2 };
        const aOrder = statusOrder[a.status] ?? 3;
        const bOrder = statusOrder[b.status] ?? 3;
        return aOrder - bOrder;
      }
      // Default: keep original order (join order)
      return 0;
    });

  // Count participants by status for filter badges
  const statusCounts = {
    WON: participants.filter(p => p.status === 'WON').length,
    LOST: participants.filter(p => p.status === 'LOST').length,
    DRAW: participants.filter(p => p.status === 'DRAW').length,
  };

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

      {/* Filter chips for resolved bets */}
      {betData?.status === 'RESOLVED' && (
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 8
        }}>
          {[
            { key: 'ALL', label: 'All', count: participants.length },
            { key: 'WON', label: 'Won', count: statusCounts.WON, activeColor: '#10b981', activeBg: 'rgba(16, 185, 129, 0.15)', activeBorder: 'rgba(16, 185, 129, 0.3)' },
            { key: 'DRAW', label: 'Draw', count: statusCounts.DRAW },
            { key: 'LOST', label: 'Lost', count: statusCounts.LOST, activeColor: '#ef4444', activeBg: 'rgba(239, 68, 68, 0.15)', activeBorder: 'rgba(239, 68, 68, 0.3)' },
          ].filter(f => f.key === 'ALL' || f.count > 0).map((filter) => {
            const isActive = statusFilter === filter.key;
            const activeColor = filter.activeColor || '#00D4AA';
            const activeBg = filter.activeBg || 'rgba(0, 212, 170, 0.15)';
            const activeBorder = filter.activeBorder || 'rgba(0, 212, 170, 0.3)';
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setStatusFilter(filter.key as typeof statusFilter)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isActive ? activeBg : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? activeBorder : 'transparent',
                  gap: 6
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? activeColor : 'rgba(255, 255, 255, 0.7)'
                }}>
                  {filter.label}
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isActive ? activeColor : 'rgba(255, 255, 255, 0.4)'
                }}>
                  {filter.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredAndSortedParticipants.length > 0 ? (
          <View style={{ gap: 12 }}>
            {filteredAndSortedParticipants.map((participant) => {
              const isWinner = betData?.status === 'RESOLVED' && participant.status === 'WON';
              const isLoser = betData?.status === 'RESOLVED' && participant.status === 'LOST';
              const isDraw = betData?.status === 'RESOLVED' && participant.status === 'DRAW';
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
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      {participant.displayName || participant.username}
                    </Text>

                    {/* Choice */}
                    {participant.chosenOptionText && (
                      <Text style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginTop: 4
                      }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.35)' }}>Pick: </Text>
                        {participant.chosenOptionText}
                      </Text>
                    )}
                    {participant.predictedValue && !participant.chosenOptionText && (
                      <Text style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginTop: 4
                      }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.35)' }}>Pick: </Text>
                        {participant.predictedValue}
                      </Text>
                    )}
                  </View>

                  {/* Status and vote count for resolved bets */}
                  {betData?.status === 'RESOLVED' && (
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
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
                      {/* Vote count for PREDICTION bets */}
                      {participant.totalVoters !== undefined && participant.totalVoters > 0 && (
                        <Text style={{
                          fontSize: 11,
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}>
                          {participant.votesReceived ?? 0}/{participant.totalVoters} votes
                        </Text>
                      )}
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
            <MaterialIcons
              name={statusFilter !== 'ALL' ? 'filter-list' : 'group'}
              size={48}
              color="rgba(255, 255, 255, 0.15)"
            />
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 16,
              marginTop: 16,
              fontWeight: '500'
            }}>
              {statusFilter !== 'ALL' && participants.length > 0
                ? `No ${statusFilter === 'WON' ? 'winners' : statusFilter === 'LOST' ? 'losers' : 'draws'}`
                : 'No participants yet'}
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: 13,
              marginTop: 6
            }}>
              {statusFilter !== 'ALL' && participants.length > 0
                ? 'Try selecting a different filter'
                : 'Be the first to join this bet'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
