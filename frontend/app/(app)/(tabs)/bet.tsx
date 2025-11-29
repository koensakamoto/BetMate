import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import BetCard from '../../../components/bet/BetCard';
import { betService, BetSummaryResponse } from '../../../services/bet/betService';
import { SkeletonBetCard, SkeletonOwedStakesCard } from '../../../components/common/SkeletonCard';
import * as Haptics from 'expo-haptics';
import { parseBackendDate } from '../../../utils/dateUtils';
import { colors, cache } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';

export default function Bet() {
  const insets = useSafeAreaInsets();
  const { refresh } = useLocalSearchParams();
  const { user: authUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['My Bets', 'Owed Stakes'];
  const [searchQuery, setSearchQuery] = useState('');
  const [myBets, setMyBets] = useState<BetSummaryResponse[]>([]);
  // const [discoverBets, setDiscoverBets] = useState<BetSummaryResponse[]>([]); // Commented out - TODO: Implement guest/public betting
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Owed Stakes state
  const [unfulfilledBets, setUnfulfilledBets] = useState<BetSummaryResponse[]>([]);
  const [loadingUnfulfilledBets, setLoadingUnfulfilledBets] = useState(false);
  const [owedStakesFilter, setOwedStakesFilter] = useState<'all' | 'owed_to_you' | 'you_owe'>('all');
  const owedStakesFilters = [
    { key: 'all' as const, label: 'All' },
    { key: 'owed_to_you' as const, label: 'Owed to You' },
    { key: 'you_owe' as const, label: 'You Owe' }
  ];

  // Filter states for My Bets tab
  const [myBetsFilter, setMyBetsFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const myBetsFilters = [
    { key: 'all' as const, label: 'All' },
    { key: 'open' as const, label: 'Open' },
    { key: 'pending' as const, label: 'Pending' },
    { key: 'resolved' as const, label: 'Resolved' }
  ];

  // Cache management
  const lastFetchTime = useRef<number>(0);
  const hasFetchedMyBets = useRef<boolean>(false);

  // Cache management for owed stakes
  const lastOwedStakesFetchTime = useRef<number>(0);
  const OWED_STAKES_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  const isCacheValid = useCallback(() => {
    return (Date.now() - lastFetchTime.current) < cache.DEFAULT_DURATION;
  }, []);

  const isOwedStakesCacheValid = useCallback(() => {
    return lastOwedStakesFetchTime.current > 0 && (Date.now() - lastOwedStakesFetchTime.current) < OWED_STAKES_CACHE_DURATION;
  }, []);

  // Always refresh on focus to ensure fresh data after bet creation/updates
  useFocusEffect(
    useCallback(() => {
      loadBets(false);
    }, [])
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

      // Update cache timestamp and fetch status
      lastFetchTime.current = Date.now();
      hasFetchedMyBets.current = true;

    } catch (error) {
      console.error('Failed to load bets:', error);
      Alert.alert('Error', 'Failed to load bets. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch user unfulfilled bets with caching
  const fetchUnfulfilledBets = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated) {
      return;
    }

    // Check cache validity - skip fetch if cache is still valid and not forced
    if (!forceRefresh && isOwedStakesCacheValid()) {
      return;
    }

    try {
      setLoadingUnfulfilledBets(true);
      const allBets = await betService.getMyBets();
      // Filter for unfulfilled social bets only
      // Unfulfilled means: status is RESOLVED and fulfillmentStatus is PENDING or PARTIALLY_FULFILLED
      const unfulfilled = allBets.filter(bet =>
        bet.status === 'RESOLVED' &&
        bet.stakeType === 'SOCIAL' &&
        (bet.fulfillmentStatus === 'PENDING' || bet.fulfillmentStatus === 'PARTIALLY_FULFILLED')
      );
      setUnfulfilledBets(unfulfilled);
      lastOwedStakesFetchTime.current = Date.now();
    } catch (err) {
      console.error('Failed to load unfulfilled bets:', err);
    } finally {
      setLoadingUnfulfilledBets(false);
    }
  }, [isAuthenticated, isOwedStakesCacheValid]);

  // Fetch unfulfilled bets when Owed Stakes tab is active
  useEffect(() => {
    if (activeTab === 1 && isAuthenticated) {
      fetchUnfulfilledBets();
    }
  }, [activeTab, isAuthenticated, fetchUnfulfilledBets]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    loadBets(true);
    if (activeTab === 1) {
      fetchUnfulfilledBets(true);
    }
  }, [activeTab, fetchUnfulfilledBets]);

  // Calculate time remaining until deadline - memoized for performance
  const calculateTimeRemaining = useCallback((deadline: string | null | undefined): string => {
    if (!deadline) return 'N/A';

    const now = new Date();
    const deadlineDate = parseBackendDate(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // Check if deadline is urgent (< 24 hours remaining)
  const isDeadlineUrgent = useCallback((deadline: string | null | undefined): boolean => {
    if (!deadline) return false;
    const diff = parseBackendDate(deadline).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }, []);

  // Transform backend bet data to frontend format - memoized for performance
  const transformBetData = useCallback((bet: BetSummaryResponse) => {
    const bettingTimeRemaining = calculateTimeRemaining(bet.bettingDeadline);
    const resolveTimeRemaining = calculateTimeRemaining(bet.resolveDate);

    // Map backend status to frontend display status
    let displayStatus: 'open' | 'active' | 'resolved';
    if (bet.status === 'OPEN') {
      displayStatus = 'open';
    } else if (bet.status === 'CLOSED') {
      displayStatus = 'active';
    } else {
      displayStatus = 'resolved'; // Both RESOLVED and CANCELLED
    }

    return {
      id: bet.id.toString(),
      title: bet.title,
      description: '',  // Description not in summary, would need full bet details
      timeRemaining: bettingTimeRemaining,
      resolveTimeRemaining: resolveTimeRemaining,
      isUrgent: isDeadlineUrgent(bet.bettingDeadline),
      isResolveUrgent: isDeadlineUrgent(bet.resolveDate),
      participantCount: bet.totalParticipants,
      participantPreviews: bet.participantPreviews,
      stakeAmount: bet.stakeType === 'SOCIAL' ? 0 : (bet.fixedStakeAmount || Math.round(bet.totalPool / Math.max(bet.totalParticipants, 1))),
      stakeType: bet.stakeType,
      socialStakeDescription: bet.socialStakeDescription,
      status: displayStatus,
      backendStatus: bet.status, // Pass original backend status for badge display
      isJoined: bet.hasUserParticipated,
      creatorName: bet.creatorUsername,
      userStake: bet.userAmount,
      hasInsurance: bet.hasInsurance,
      insuranceRefundPercentage: bet.insuranceRefundPercentage
    };
  }, [calculateTimeRemaining, isDeadlineUrgent]);

  // Filter my bets based on selected filter and search query - memoized to avoid recalculating on every render
  const filteredMyBets = useMemo(() => {
    return myBets.filter(bet => {
      // Status filter
      let matchesStatus = false;
      switch (myBetsFilter) {
        case 'open':
          matchesStatus = bet.status === 'OPEN';
          break;
        case 'pending':
          matchesStatus = bet.status === 'CLOSED';
          break;
        case 'resolved':
          // Include both RESOLVED and CANCELLED in the Resolved filter
          matchesStatus = bet.status === 'RESOLVED' || bet.status === 'CANCELLED';
          break;
        case 'all':
        default:
          matchesStatus = true;
      }

      // Search filter - search across title, creator, group name, and bet type
      const matchesSearch = searchQuery.length === 0 ||
        bet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bet.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bet.groupName && bet.groupName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        bet.betType.toLowerCase().includes(searchQuery.toLowerCase());

      // Both filters must match
      return matchesStatus && matchesSearch;
    });
  }, [myBets, myBetsFilter, searchQuery]);

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
  const handleFilterChange = useCallback((filter: 'all' | 'open' | 'pending' | 'resolved') => {
    Haptics.selectionAsync();
    setMyBetsFilter(filter);
  }, []);

  // Memoize owed stakes filter change handler
  const handleOwedStakesFilterChange = useCallback((filter: 'all' | 'owed_to_you' | 'you_owe') => {
    Haptics.selectionAsync();
    setOwedStakesFilter(filter);
  }, []);

  interface BetHistoryItem {
    id: string;
    game: string;
    bet: string;
    amount: number;
    odds: number;
    status: 'won' | 'lost' | 'pending';
    payout: number;
    date: string;
  }

  const betHistory: BetHistoryItem[] = [
    { id: '1', game: 'Chiefs vs Bills', bet: 'Chiefs -2.5', amount: 100, odds: -110, status: 'won', payout: 190.91, date: '2 days ago' },
    { id: '2', game: 'Lakers vs Warriors', bet: 'Over 225.5', amount: 50, odds: -110, status: 'lost', payout: 0, date: '1 week ago' },
    { id: '3', game: 'Cowboys vs Giants', bet: 'Cowboys ML', amount: 75, odds: -150, status: 'pending', payout: 0, date: 'Today' }
  ];

  const HistoryItem = ({ bet }: { bet: BetHistoryItem }) => (
    <View style={{
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: bet.status === 'won' ? colors.success : bet.status === 'lost' ? colors.errorAlt : colors.warning
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
          {bet.game}
        </Text>
        <View style={{
          backgroundColor: bet.status === 'won' ? colors.success : bet.status === 'lost' ? colors.errorAlt : colors.warning,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <Text style={{
            fontSize: 10,
            fontWeight: '600',
            color: bet.status === 'pending' ? colors.textDark : colors.textPrimary,
            textTransform: 'uppercase'
          }}>
            {bet.status}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
        {bet.bet} • ${bet.amount} @ {bet.odds > 0 ? '+' : ''}{bet.odds}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>
          {bet.date}
        </Text>
        {bet.payout > 0 && (
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success }}>
            +${bet.payout}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        backgroundColor: colors.background,
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
              tintColor={colors.primary}
              colors={[colors.primary]}
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
              borderBottomColor: colors.border
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
                  borderColor: colors.textMuted,
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
                  backgroundColor: colors.textMuted,
                  borderRadius: 1,
                  transform: [{ rotate: '45deg' }]
                }} />
              </View>

              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: colors.textPrimary,
                  paddingVertical: 4
                }}
                placeholder="Search bets..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectionColor={colors.textPrimary}
                accessible={true}
                accessibilityLabel="Search bets"
                accessibilityHint="Enter text to filter bets"
              />

              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={{ paddingLeft: 8 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  accessibilityHint="Double tap to clear search text"
                >
                  <Text style={{
                    fontSize: 16,
                    color: colors.textMuted
                  }} accessible={false}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Clean Tab Navigation */}
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 24,
                paddingHorizontal: 0
              }}
              accessibilityRole="tablist"
            >
              {tabs.map((tab, index) => {
                const isActive = index === activeTab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => handleTabChange(index)}
                    accessible={true}
                    accessibilityRole="tab"
                    accessibilityLabel={tab}
                    accessibilityState={{ selected: isActive }}
                    accessibilityHint={isActive ? 'Currently selected' : `Double tap to view ${tab}`}
                    style={{
                      marginRight: 32,
                      paddingBottom: 8,
                      borderBottomWidth: isActive ? 2 : 0,
                      borderBottomColor: colors.textPrimary
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? colors.textPrimary : colors.textSecondary
                    }} accessible={false}>
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
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${filter.label}`}
                      accessibilityState={{ selected: isActive }}
                      accessibilityHint={isActive ? 'Currently selected' : `Double tap to filter by ${filter.label}`}
                      style={{
                        backgroundColor: isActive ? colors.primaryLight : colors.surfaceMedium,
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
                        color: isActive ? colors.primary : colors.textSecondary
                      }} accessible={false}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Content based on active tab */}
            {activeTab === 0 ? (
              /* My Bets Section */
              <>
                {/* My Bets Feed */}
                {loading && !hasFetchedMyBets.current ? (
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
                    borderColor: colors.borderLight,
                    marginBottom: 32
                  }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.surfaceMedium,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 16
                    }}>
                      <MaterialIcons name="casino" size={24} color={colors.textDisabled} />
                    </View>
                    <Text style={{
                      fontSize: 16,
                      color: colors.textSecondary,
                      textAlign: 'center',
                      marginBottom: 4
                    }}>
                      No bets yet
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: colors.textDisabled,
                      textAlign: 'center'
                    }}>
                      {myBetsFilter === 'open' ? 'No open bets' :
                       myBetsFilter === 'pending' ? 'No pending bets' :
                       myBetsFilter === 'resolved' ? 'No resolved bets' :
                       'Create your first bet to get started'}
                    </Text>
                  </View>
                  );
                })()}
              </>
            ) : activeTab === 1 ? (
              /* Owed Stakes Section */
              <View>
                {/* Filter Tabs */}
                <View style={{
                  flexDirection: 'row',
                  marginBottom: 16,
                  gap: 8
                }}>
                  {owedStakesFilters.map((filter) => {
                    const isActive = filter.key === owedStakesFilter;
                    return (
                      <TouchableOpacity
                        key={filter.key}
                        onPress={() => handleOwedStakesFilterChange(filter.key)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Filter: ${filter.label}`}
                        accessibilityState={{ selected: isActive }}
                        accessibilityHint={isActive ? 'Currently selected' : `Double tap to filter by ${filter.label}`}
                        style={{
                          backgroundColor: isActive ? colors.primaryLight : colors.surfaceMedium,
                          borderRadius: 20,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderWidth: 1,
                          borderColor: isActive ? 'rgba(0, 212, 170, 0.3)' : 'transparent'
                        }}
                      >
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: isActive ? colors.primary : colors.textSecondary
                        }} accessible={false}>
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {loadingUnfulfilledBets ? (
                  <>
                    <SkeletonOwedStakesCard />
                    <SkeletonOwedStakesCard />
                    <SkeletonOwedStakesCard />
                  </>
                ) : (() => {
                  // Determine if bet is owed to user or user owes based on participation status
                  const isOwedToUser = (bet: BetSummaryResponse) => {
                    if (bet.userParticipationStatus === 'WON') {
                      return true;
                    }
                    if (!bet.hasUserParticipated && bet.creatorUsername === authUser?.username) {
                      return true;
                    }
                    return false;
                  };

                  const isUserOwes = (bet: BetSummaryResponse) => {
                    return bet.userParticipationStatus === 'LOST';
                  };

                  // Filter based on selected filter
                  const filteredBets = unfulfilledBets.filter(bet => {
                    if (owedStakesFilter === 'all') return true;
                    if (owedStakesFilter === 'owed_to_you') return isOwedToUser(bet);
                    if (owedStakesFilter === 'you_owe') return isUserOwes(bet);
                    return true;
                  });

                  // Helper function to render a bet card
                  const renderBetCard = (bet: BetSummaryResponse) => {
                    const isOwedToYou = isOwedToUser(bet);
                    const youOwe = isUserOwes(bet);
                    let badgeConfig: { bgColor: string; textColor: string; text: string };

                    if (bet.fulfillmentStatus === 'FULFILLED') {
                      badgeConfig = {
                        bgColor: 'rgba(0, 212, 170, 0.1)',
                        textColor: colors.primary,
                        text: 'Completed'
                      };
                    } else if (isOwedToYou) {
                      badgeConfig = {
                        bgColor: 'rgba(156, 163, 175, 0.1)',
                        textColor: '#9CA3AF',
                        text: 'Waiting'
                      };
                    } else if (youOwe) {
                      if (bet.hasCurrentUserClaimedFulfillment) {
                        badgeConfig = {
                          bgColor: 'rgba(6, 182, 212, 0.1)',
                          textColor: '#06B6D4',
                          text: 'Submitted'
                        };
                      } else {
                        badgeConfig = {
                          bgColor: 'rgba(239, 68, 68, 0.1)',
                          textColor: colors.errorAlt,
                          text: 'To-Do'
                        };
                      }
                    } else {
                      badgeConfig = {
                        bgColor: 'rgba(156, 163, 175, 0.1)',
                        textColor: '#9CA3AF',
                        text: 'Pending'
                      };
                    }

                    return (
                      <TouchableOpacity
                        key={bet.id}
                        onPress={() => {
                          router.push(`/(app)/fulfillment-details/${bet.id}`);
                        }}
                        activeOpacity={0.7}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          position: 'relative'
                        }}
                      >
                        {/* Status Badge */}
                        <View
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: badgeConfig.bgColor,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: badgeConfig.textColor
                            }}
                          >
                            {badgeConfig.text}
                          </Text>
                        </View>

                        {/* Win/Loss indicator */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 8
                        }}>
                          <MaterialIcons
                            name={isOwedToYou ? 'emoji-events' : 'warning'}
                            size={16}
                            color={isOwedToYou ? colors.primary : colors.errorAlt}
                          />
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: isOwedToYou ? colors.primary : colors.errorAlt
                          }}>
                            {isOwedToYou ? 'You Won' : 'You Lost'}
                          </Text>
                        </View>

                        {/* Bet Title */}
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: colors.textPrimary,
                            marginBottom: 8,
                            paddingRight: 80
                          }}
                          numberOfLines={2}
                        >
                          {bet.title}
                        </Text>

                        {/* Social Stake Description */}
                        <View
                          style={{
                            backgroundColor: isOwedToYou ? 'rgba(0, 212, 170, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            marginBottom: 12
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: isOwedToYou ? colors.primary : colors.errorAlt,
                              fontWeight: '600'
                            }}
                          >
                            {bet.socialStakeDescription || 'Social bet'}
                          </Text>
                        </View>

                        {/* Group Name */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <MaterialIcons
                            name="groups"
                            size={14}
                            color={colors.textMuted}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.textSecondary
                            }}
                            numberOfLines={1}
                          >
                            {bet.groupName}
                          </Text>
                        </View>

                        {/* Tap to view indicator */}
                        <View
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTopWidth: 0.5,
                            borderTopColor: colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: colors.textMuted,
                              fontWeight: '600',
                              marginRight: 4
                            }}
                          >
                            Tap to view details
                          </Text>
                          <MaterialIcons
                            name="arrow-forward"
                            size={12}
                            color={colors.textMuted}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  };

                  // Empty state
                  if (filteredBets.length === 0) {
                    const emptyMessage = owedStakesFilter === 'owed_to_you'
                      ? 'No one owes you anything right now'
                      : owedStakesFilter === 'you_owe'
                      ? "You don't owe anyone anything"
                      : 'No stakes to fulfill';

                    return (
                      <View style={{
                        alignItems: 'center',
                        paddingVertical: 60
                      }}>
                        <MaterialIcons name="check-circle-outline" size={48} color={colors.textDisabled} />
                        <Text style={{
                          fontSize: 16,
                          color: colors.textSecondary,
                          textAlign: 'center',
                          marginTop: 16,
                          fontWeight: '500'
                        }}>
                          All caught up!
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          color: colors.textMuted,
                          textAlign: 'center',
                          marginTop: 8
                        }}>
                          {emptyMessage}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View>
                      {filteredBets.map(bet => renderBetCard(bet))}
                    </View>
                  );
                })()}
              </View>
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