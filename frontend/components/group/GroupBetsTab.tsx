import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import BetCard from '../bet/BetCard';
import { betService, BetSummaryResponse } from '../../services/bet/betService';

const icon = require("../../assets/images/icon.png");

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
  const searchParams = useLocalSearchParams();

  // Load bets data - reload when group changes or refresh parameter changes
  useEffect(() => {
    console.log(`🔄 [GroupBetsTab] Loading bets for group ${groupData.id}, refresh: ${searchParams.refresh}`);
    loadGroupBets();
  }, [groupData.id, searchParams.refresh]);

  const loadGroupBets = async () => {
    setLoading(true);
    try {
      const groupId = Array.isArray(groupData.id) ? parseInt(groupData.id[0]) : parseInt(groupData.id as string);
      console.log(`📡 [GroupBetsTab] Fetching bets for group ${groupId}`);
      const groupBets = await betService.getGroupBets(groupId);
      console.log(`✅ [GroupBetsTab] Loaded ${groupBets.length} bets for group ${groupId}`);
      setBets(groupBets);
    } catch (error) {
      console.error('Failed to load group bets:', error);
      Alert.alert('Error', 'Failed to load group bets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate time remaining until deadline - memoized for performance
  const calculateTimeRemaining = useCallback((deadline: string): string => {
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
  }, []);

  // Transform backend bet data to frontend format - memoized for performance
  const transformBetData = useCallback((bet: BetSummaryResponse) => ({
    id: bet.id.toString(),
    title: bet.title,
    description: '',  // Description not in summary, would need full bet details
    category: bet.betType,
    categoryIcon: '🎯',  // Default icon
    timeRemaining: calculateTimeRemaining(bet.bettingDeadline),
    participantCount: bet.totalParticipants,
    participantAvatars: [icon, icon, icon],  // Placeholder avatars
    stakeAmount: Math.round(bet.totalPool / Math.max(bet.totalParticipants, 1)),
    status: bet.status.toLowerCase() as 'open' | 'active' | 'closed',
    isJoined: bet.hasUserParticipated,
    creatorName: bet.creatorUsername
  }), [calculateTimeRemaining]);

  // Filter bets based on selected filter - memoized to avoid recalculating on every render
  const filteredBets = useMemo(() => {
    if (activeBetFilter === 'All') return bets;
    return bets.filter(bet => bet.status === activeBetFilter);
  }, [activeBetFilter, bets]);

  // Memoize transformed bets array to avoid recalculating on every render
  const transformedBets = useMemo(() => {
    return filteredBets.map(bet => transformBetData(bet));
  }, [filteredBets, transformBetData]);

  const handleCreateBet = () => {
    const groupIdParam = Array.isArray(groupData.id) ? groupData.id[0] : groupData.id;
    router.push(`/create-bet?groupId=${groupIdParam}`);
  };

  return (
    <View>
      {/* Create Bet Button */}
      <TouchableOpacity
        onPress={handleCreateBet}
        style={{
          backgroundColor: '#00D4AA',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: '#00D4AA',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5
        }}
      >
        <MaterialIcons name="add-circle" size={20} color="#000000" style={{ marginRight: 8 }} />
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#000000'
        }}>
          Create New Bet
        </Text>
      </TouchableOpacity>

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
      ) : transformedBets.map((bet) => (
        <BetCard
          key={bet.id}
          {...bet}
        />
      ))}
    </View>
  );
};

export default GroupBetsTab;