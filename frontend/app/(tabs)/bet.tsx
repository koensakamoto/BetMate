import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import BetCard from '../../components/bet/BetCard';
import { betService, BetSummaryResponse } from '../../services/bet/betService';
import { SkeletonBetCard } from '../../components/common/SkeletonCard';
import * as Haptics from 'expo-haptics';

export default function Bet() {
  const insets = useSafeAreaInsets();
  const { refresh } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['My Bets']; // 'Discover' commented out - TODO: Implement guest/public betting
  const [searchQuery, setSearchQuery] = useState('');
  const [myBets, setMyBets] = useState<BetSummaryResponse[]>([]);
  // const [discoverBets, setDiscoverBets] = useState<BetSummaryResponse[]>([]); // Commented out - TODO: Implement guest/public betting
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter states for My Bets tab
  const [myBetsFilter, setMyBetsFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const myBetsFilters = [
    { key: 'all' as const, label: 'All' },
    { key: 'active' as const, label: 'Active' },
    { key: 'resolved' as const, label: 'Resolved' }
  ];

  // Cache management: 5 minute cache
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const isCacheValid = useCallback(() => {
    return (Date.now() - lastFetchTime.current) < CACHE_DURATION;
  }, []);

  // Smart refresh on focus: only refetch if cache expired or forced
  useFocusEffect(
    useCallback(() => {
      if (!isCacheValid() || myBets.length === 0 || refreshKey > 0) {
        loadBets(false);
      }
    }, [refreshKey, isCacheValid, myBets.length])
  );

  // Trigger refresh when URL refresh parameter changes (from bet creation)
  useEffect(() => {
    if (refresh) {
      loadBets(false);
    }
  }, [refresh]);

  const loadBets = async (isRefreshing: boolean = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Load my bets
      const myBetsData = await betService.getMyBets();
      setMyBets(myBetsData);

      // TODO: Implement guest/public betting - Discover bets loading commented out
      // Load discover bets (all open bets excluding user's own and participated bets)
      // const openBets = await betService.getBetsByStatus('OPEN');
      // Filter out bets the user has already participated in
      // const discoverableBets = openBets.filter(bet => !bet.hasUserParticipated);
      // setDiscoverBets(discoverableBets);

      // Update cache timestamp
      lastFetchTime.current = Date.now();

    } catch (error) {
      console.error('Failed to load bets:', error);
      Alert.alert('Error', 'Failed to load bets. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    loadBets(true);
  }, []);

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
      participantPreviews: bet.participantPreviews,
      stakeAmount: Math.round(bet.totalPool / Math.max(bet.totalParticipants, 1)),
      status: bet.status.toLowerCase() as 'open' | 'active' | 'resolved',
      isJoined: bet.hasUserParticipated,
      creatorName: bet.creatorUsername,
      userStake: bet.userAmount
    };
  }, [calculateTimeRemaining]);

  // Filter my bets based on selected filter - memoized to avoid recalculating on every render
  const filteredMyBets = useMemo(() => {
    return myBets.filter(bet => {
      switch (myBetsFilter) {
        case 'active':
          return bet.status === 'OPEN' || bet.status === 'ACTIVE';
        case 'resolved':
          return bet.status === 'CLOSED' || bet.status === 'RESOLVED';
        case 'all':
        default:
          return true;
      }
    });
  }, [myBets, myBetsFilter]);

  // Memoize transformed bet arrays to avoid recalculating on every render
  const transformedMyBets = useMemo(() => {
    return filteredMyBets.map(bet => transformBetData(bet));
  }, [filteredMyBets, transformBetData]);

  // TODO: Implement guest/public betting - Discover bets transformation commented out
  // const transformedDiscoverBets = useMemo(() => {
  //   return discoverBets.map(bet => transformBetData(bet));
  // }, [discoverBets, transformBetData]);

  // Memoize tab change handler to provide stable reference
  const handleTabChange = useCallback((index: number) => {
    Haptics.selectionAsync();
    setActiveTab(index);
  }, []);

  // Memoize filter change handler to provide stable reference
  const handleFilterChange = useCallback((filter: 'all' | 'active' | 'resolved') => {
    Haptics.selectionAsync();
    setMyBetsFilter(filter);
  }, []);

  const betHistory = [
    { id: '1', game: 'Chiefs vs Bills', bet: 'Chiefs -2.5', amount: 100, odds: -110, status: 'won', payout: 190.91, date: '2 days ago' },
    { id: '2', game: 'Lakers vs Warriors', bet: 'Over 225.5', amount: 50, odds: -110, status: 'lost', payout: 0, date: '1 week ago' },
    { id: '3', game: 'Cowboys vs Giants', bet: 'Cowboys ML', amount: 75, odds: -150, status: 'pending', payout: 0, date: 'Today' }
  ];

  const HistoryItem = ({ bet }: { bet: any }) => (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: bet.status === 'won' ? '#00D4AA' : bet.status === 'lost' ? '#FF4757' : '#FFA726'
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
          {bet.game}
        </Text>
        <View style={{
          backgroundColor: bet.status === 'won' ? '#00D4AA' : bet.status === 'lost' ? '#FF4757' : '#FFA726',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <Text style={{
            fontSize: 10,
            fontWeight: '600',
            color: bet.status === 'pending' ? '#000000' : '#ffffff',
            textTransform: 'uppercase'
          }}>
            {bet.status}
          </Text>
        </View>
      </View>
      
      <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 8 }}>
        {bet.bet} • ${bet.amount} @ {bet.odds > 0 ? '+' : ''}{bet.odds}
      </Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
          {bet.date}
        </Text>
        {bet.payout > 0 && (
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#00D4AA' }}>
            +${bet.payout}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Solid background behind status bar - Instagram style */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />

      <View style={{ flex: 1, marginTop: insets.top }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00D4AA"
              colors={['#00D4AA']}
            />
          }
        >
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            {/* Clean Search */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <View style={{
                width: 16,
                height: 16,
                marginRight: 8,
                position: 'relative'
              }}>
                {/* Search circle */}
                <View style={{
                  position: 'absolute',
                  top: 1,
                  left: 1,
                  width: 10,
                  height: 10,
                  borderWidth: 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 5,
                  backgroundColor: 'transparent'
                }} />
                {/* Search handle */}
                <View style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 5,
                  height: 1.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 1,
                  transform: [{ rotate: '45deg' }]
                }} />
              </View>
              
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#ffffff',
                  paddingVertical: 4
                }}
                placeholder="Search bets..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectionColor="#ffffff"
              />
              
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={{ paddingLeft: 8 }}
                >
                  <Text style={{
                    fontSize: 16,
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Clean Tab Navigation */}
            <View style={{
              flexDirection: 'row',
              marginBottom: 24,
              paddingHorizontal: 0
            }}>
              {tabs.map((tab, index) => {
                const isActive = index === activeTab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => handleTabChange(index)}
                    style={{
                      marginRight: 32,
                      paddingBottom: 8,
                      borderBottomWidth: isActive ? 2 : 0,
                      borderBottomColor: '#ffffff'
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter Buttons for My Bets Tab */}
            {activeTab === 0 && (
              <View style={{
                flexDirection: 'row',
                marginBottom: 24,
                gap: 8
              }}>
                {myBetsFilters.map((filter) => {
                  const isActive = filter.key === myBetsFilter;
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      onPress={() => handleFilterChange(filter.key)}
                      style={{
                        backgroundColor: isActive ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderWidth: isActive ? 1 : 0,
                        borderColor: isActive ? 'rgba(0, 212, 170, 0.3)' : 'transparent'
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: isActive ? '600' : '500',
                        color: isActive ? '#00D4AA' : 'rgba(255, 255, 255, 0.7)'
                      }}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Search Results Info */}
            {searchQuery.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>Searching for &quot;{searchQuery}&quot;</Text>
              </View>
            )}

            {/* Content based on active tab */}
            {activeTab === 0 ? (
              /* My Bets Section */
              <>
                {/* My Bets Feed */}
                {loading ? (
                  <>
                    <SkeletonBetCard />
                    <SkeletonBetCard />
                    <SkeletonBetCard />
                  </>
                ) : (() => {
                  return transformedMyBets.length > 0 ? (
                    transformedMyBets.map((bet) => (
                      <BetCard
                        key={bet.id}
                        {...bet}
                        showJoinedIndicator={false}
                      />
                    ))
                  ) : (
                  <View style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 8,
                    padding: 24,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.05)',
                    marginBottom: 32
                  }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 16
                    }}>
                      <MaterialIcons name="casino" size={24} color="rgba(255, 255, 255, 0.4)" />
                    </View>
                    <Text style={{
                      fontSize: 16,
                      color: 'rgba(255, 255, 255, 0.7)',
                      textAlign: 'center',
                      marginBottom: 4
                    }}>
                      No bets yet
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.4)',
                      textAlign: 'center'
                    }}>
                      {myBetsFilter === 'active' ? 'No active bets' :
                       myBetsFilter === 'resolved' ? 'No resolved bets' :
                       'Create your first bet to get started'}
                    </Text>
                  </View>
                  );
                })()}
              </>
            ) : null}
            {/* TODO: Implement guest/public betting - Discover Section commented out
            : (
              // Discover Section
              <>
                {/* Discover Bets Feed *\/}
                {loading ? (
                  <>
                    <SkeletonBetCard />
                    <SkeletonBetCard />
                    <SkeletonBetCard />
                  </>
                ) : transformedDiscoverBets.length > 0 ? (
                  transformedDiscoverBets.map((bet) => (
                    <BetCard
                      key={bet.id}
                      {...bet}
                    />
                  ))
                ) : (
                  <View style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 8,
                    padding: 24,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.05)',
                    marginBottom: 32
                  }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 16
                    }}>
                      <MaterialIcons name="explore" size={24} color="rgba(255, 255, 255, 0.4)" />
                    </View>
                    <Text style={{
                      fontSize: 16,
                      color: 'rgba(255, 255, 255, 0.7)',
                      textAlign: 'center',
                      marginBottom: 4
                    }}>
                      No bets to discover
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.4)',
                      textAlign: 'center'
                    }}>
                      Public bets from the community will appear here
                    </Text>
                  </View>
                )}
              </>
            )
            */}

            {/* Additional spacing for scroll */}
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}