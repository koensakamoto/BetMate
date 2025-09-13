import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { betService, BetSummaryResponse } from '../../services/bet/betService';

interface GroupBetsTabProps {
  groupData: {
    id: string | string[];
  };
}

const GroupBetsTab: React.FC<GroupBetsTabProps> = ({ groupData }) => {
  const [activeBetFilter, setActiveBetFilter] = useState('All');
  const betFilters = ['All', 'OPEN', 'CLOSED', 'RESOLVED'];
  const [bets, setBets] = useState<BetSummaryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Load bets data
  useEffect(() => {
    loadGroupBets();
  }, [groupData.id]);

  const loadGroupBets = async () => {
    setLoading(true);
    try {
      const groupId = Array.isArray(groupData.id) ? parseInt(groupData.id[0]) : parseInt(groupData.id as string);
      const groupBets = await betService.getGroupBets(groupId);
      setBets(groupBets);
    } catch (error) {
      console.error('Failed to load group bets:', error);
      Alert.alert('Error', 'Failed to load group bets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBets = () => {
    if (activeBetFilter === 'All') return bets;
    return bets.filter(bet => bet.status === activeBetFilter);
  };

  // Calculate time remaining until deadline
  const calculateTimeRemaining = (deadline: string): string => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <View>
      {/* Bet Filters */}
      <View style={{
        marginBottom: 20
      }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 0
          }}
        >
          <View style={{ 
            flexDirection: 'row',
            gap: 8
          }}>
            {betFilters.map((filter) => {
              const isActive = filter === activeBetFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveBetFilter(filter)}
                  style={{
                    backgroundColor: isActive ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: isActive ? 0 : 0.5,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    minWidth: 60,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: isActive ? '#000000' : '#ffffff',
                    fontSize: 13,
                    fontWeight: '600'
                  }}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 8,
          padding: 24,
          alignItems: 'center',
          marginBottom: 32
        }}>
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center'
          }}>
            Loading bets...
          </Text>
        </View>
      ) : getFilteredBets().map((bet) => (
        <View key={bet.id} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12
        }}>
          {/* Bet Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 4
              }}>
{bet.title}
              </Text>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 16
              }}>
Pool: ${bet.totalPool.toFixed(2)}
              </Text>
            </View>
            
            {/* Status Badge */}
            <View style={{
              backgroundColor: 
                bet.status === 'OPEN' ? 'rgba(255, 255, 255, 0.08)' :
                bet.status === 'CLOSED' ? 'rgba(0, 212, 170, 0.2)' :
                bet.status === 'RESOLVED' ? 'rgba(34, 197, 94, 0.2)' :
                'rgba(156, 163, 175, 0.2)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              marginLeft: 12
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: 
                  bet.status === 'OPEN' ? 'rgba(255, 255, 255, 0.7)' :
                  bet.status === 'CLOSED' ? '#00D4AA' :
                  bet.status === 'RESOLVED' ? '#22C55E' :
                  '#9CA3AF'
              }}>
                {bet.status}
              </Text>
            </View>
          </View>

          {/* Bet Stats */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12
          }}>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
{bet.totalParticipants} players • {calculateTimeRemaining(bet.bettingDeadline)}
            </Text>
            
            <TouchableOpacity style={{
              backgroundColor: 
                bet.status === 'OPEN' && !bet.hasUserParticipated ? 'rgba(0, 212, 170, 0.15)' :
                'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: bet.status === 'OPEN' && !bet.hasUserParticipated ? '#00D4AA' : '#ffffff'
              }}>
                {bet.status === 'OPEN' && !bet.hasUserParticipated ? 'Join' :
                 bet.status === 'OPEN' && bet.hasUserParticipated ? 'Joined' :
                 'View'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

export default GroupBetsTab;