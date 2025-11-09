import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import BetCard from '../bet/BetCard';
import { betService, BetSummaryResponse } from '../../services/bet/betService';

const icon = require("../../assets/images/icon.png");

interface GroupBetsTabProps {
  groupData: {
    id: string | string[];
  };
  forceRefresh?: number; // Increment this to force a refresh
}

const GroupBetsTab: React.FC<GroupBetsTabProps> = ({ groupData, forceRefresh }) => {
  const [activeBetFilter, setActiveBetFilter] = useState('All');
  const betFilters = ['All', 'OPEN', 'CLOSED', 'RESOLVED'];
  const [bets, setBets] = useState<BetSummaryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useLocalSearchParams();

  // Cache management: 5 minute cache
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const isCacheValid = useCallback(() => {
    return (Date.now() - lastFetchTime.current) < CACHE_DURATION;
  }, []);

  // Load bets data - reload when group changes or refresh parameter changes
  useEffect(() => {
    // Only fetch if cache is invalid, no data, or forced refresh
    if (!isCacheValid() || bets.length === 0 || searchParams.refresh) {
      console.log(`🔄 [GroupBetsTab] Loading bets for group ${groupData.id}, refresh: ${searchParams.refresh}`);
      loadGroupBets();
    } else {
      console.log(`✅ [GroupBetsTab] Using cached bets for group ${groupData.id}`);
    }
  }, [groupData.id, searchParams.refresh, isCacheValid, bets.length]);

  // Handle force refresh from parent (pull-to-refresh)
  useEffect(() => {
    if (forceRefresh && forceRefresh > 0) {
      console.log(`🔄 [GroupBetsTab] Force refresh triggered`);
      loadGroupBets();
    }
  }, [forceRefresh]);

  const loadGroupBets = async () => {
    setLoading(true);
    try {
      const groupId = Array.isArray(groupData.id) ? parseInt(groupData.id[0]) : parseInt(groupData.id as string);
      console.log(`📡 [GroupBetsTab] Fetching bets for group ${groupId}`);
      const groupBets = await betService.getGroupBets(groupId);
      console.log(`✅ [GroupBetsTab] Loaded ${groupBets.length} bets for group ${groupId}`);
      setBets(groupBets);

      // Update cache timestamp
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error('Failed to load group bets:', error);
      Alert.alert('Error', 'Failed to load group bets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate time remaining until deadline - memoized for performance
  const calculateTimeRemaining = useCallback((deadline: string | null | undefined): string => {
    if (!deadline) return 'N/A';

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
  const transformBetData = useCallback((bet: BetSummaryResponse) => {
    const bettingTimeRemaining = calculateTimeRemaining(bet.bettingDeadline);
    const resolveTimeRemaining = calculateTimeRemaining(bet.resolveDate);

    return {
      id: bet.id.toString(),
      title: bet.title,
      description: '',  // Description not in summary, would need full bet details
      category: bet.betType,
      timeRemaining: bettingTimeRemaining,
      resolveTimeRemaining: resolveTimeRemaining,
      participantCount: bet.totalParticipants,
      participantAvatars: [icon, icon, icon],  // Placeholder avatars
      stakeAmount: Math.round(bet.totalPool / Math.max(bet.totalParticipants, 1)),
      status: bet.status.toLowerCase() as 'open' | 'active' | 'resolved',
      isJoined: bet.hasUserParticipated,
      creatorName: bet.creatorUsername,
      userStake: bet.userAmount
    };
  }, [calculateTimeRemaining]);

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
      {/* Create Bet Banner */}
      <TouchableOpacity
        onPress={handleCreateBet}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 0,
          marginBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <Text style={{
          fontSize: 20,
          color: 'rgba(255, 255, 255, 0.4)',
          marginRight: 12
        }}>+</Text>

        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            color: '#ffffff',
            marginBottom: 2
          }}>Create New Bet</Text>

          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.5)'
          }}>Challenge friends with your predictions</Text>
        </View>
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