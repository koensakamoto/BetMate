import React, { useState, useCallback, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BetCard from '../../../components/bet/BetCard';
import { BetSummaryResponse } from '../../../services/bet/betService';
import { SkeletonBetCard, SkeletonOwedStakesCard } from '../../../components/common/SkeletonCard';
import * as Haptics from 'expo-haptics';
import { parseBackendDate } from '../../../utils/dateUtils';
import { colors } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useMyBets, useMyLosses, useMyWinnings, useInvalidateBets } from '../../../hooks/useBetQueries';

export default function Bet() {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['My Bets', 'Losses', 'Winnings'];
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // React Query hooks - handles caching automatically with infinite scroll
  const {
    data: myBetsData,
    isLoading: isLoadingMyBets,
    refetch: refetchMyBets,
    fetchNextPage: fetchNextMyBets,
    hasNextPage: hasNextMyBets,
    isFetchingNextPage: isFetchingNextMyBets,
  } = useMyBets();

  const {
    data: lossesData,
    isLoading: isLoadingLosses,
    refetch: refetchLosses,
    fetchNextPage: fetchNextLosses,
    hasNextPage: hasNextLosses,
    isFetchingNextPage: isFetchingNextLosses,
  } = useMyLosses();

  const {
    data: winningsData,
    isLoading: isLoadingWinnings,
    refetch: refetchWinnings,
    fetchNextPage: fetchNextWinnings,
    hasNextPage: hasNextWinnings,
    isFetchingNextPage: isFetchingNextWinnings,
  } = useMyWinnings();

  const { invalidateMyBets } = useInvalidateBets();

  // Flatten paginated data
  const myBets = useMemo(() =>
    myBetsData?.pages?.flatMap(page => page?.content ?? []).filter(Boolean) ?? [],
    [myBetsData]
  );

  const lossesBets = useMemo(() =>
    lossesData?.pages?.flatMap(page => page?.content ?? []).filter(Boolean) ?? [],
    [lossesData]
  );

  const winningsBets = useMemo(() =>
    winningsData?.pages?.flatMap(page => page?.content ?? []).filter(Boolean) ?? [],
    [winningsData]
  );

  // Loading state based on active tab
  const loading = activeTab === 0 ? isLoadingMyBets : activeTab === 1 ? isLoadingLosses : isLoadingWinnings;

  // Filters for "My Bets" tab
  const [myBetsFilter, setMyBetsFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const myBetsFilters = [
    { key: 'all' as const, label: 'All' },
    { key: 'open' as const, label: 'Open' },
    { key: 'pending' as const, label: 'Pending' },
    { key: 'resolved' as const, label: 'Resolved' }
  ];

  // Filters for "Losses" tab
  const [lossesFilter, setLossesFilter] = useState<'all' | 'todo' | 'submitted'>('all');
  const lossesFilters = [
    { key: 'all' as const, label: 'All' },
    { key: 'todo' as const, label: 'To-Do' },
    { key: 'submitted' as const, label: 'Submitted' }
  ];

  // Filters for "Winnings" tab
  const [winningsFilter, setWinningsFilter] = useState<'all' | 'waiting' | 'completed'>('all');
  const winningsFilters = [
    { key: 'all' as const, label: 'All' },
    { key: 'waiting' as const, label: 'Waiting' },
    { key: 'completed' as const, label: 'Completed' }
  ];

  // Pull-to-refresh handler based on active tab
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 0) {
      await refetchMyBets();
    } else if (activeTab === 1) {
      await refetchLosses();
    } else {
      await refetchWinnings();
    }
    setRefreshing(false);
  }, [activeTab, refetchMyBets, refetchLosses, refetchWinnings]);

  // Infinite scroll handlers
  const handleMyBetsEndReached = useCallback(() => {
    if (hasNextMyBets && !isFetchingNextMyBets) {
      fetchNextMyBets();
    }
  }, [hasNextMyBets, isFetchingNextMyBets, fetchNextMyBets]);

  const handleLossesEndReached = useCallback(() => {
    if (hasNextLosses && !isFetchingNextLosses) {
      fetchNextLosses();
    }
  }, [hasNextLosses, isFetchingNextLosses, fetchNextLosses]);

  const handleWinningsEndReached = useCallback(() => {
    if (hasNextWinnings && !isFetchingNextWinnings) {
      fetchNextWinnings();
    }
  }, [hasNextWinnings, isFetchingNextWinnings, fetchNextWinnings]);

  // Footer loading component for infinite scroll
  const renderFooter = useCallback((isFetching: boolean) => {
    if (!isFetching) return <View style={{ height: 80 }} />;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, []);

  // Calculate time remaining until deadline
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

  // Transform backend bet data to frontend format
  const transformBetData = useCallback((bet: BetSummaryResponse) => {
    const bettingTimeRemaining = calculateTimeRemaining(bet.bettingDeadline);
    const resolveTimeRemaining = calculateTimeRemaining(bet.resolveDate);

    let displayStatus: 'open' | 'active' | 'resolved';
    if (bet.status === 'OPEN') {
      displayStatus = 'open';
    } else if (bet.status === 'CLOSED') {
      displayStatus = 'active';
    } else {
      displayStatus = 'resolved';
    }

    return {
      id: bet.id.toString(),
      title: bet.title,
      description: '',
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
      backendStatus: bet.status,
      isJoined: bet.hasUserParticipated,
      creatorName: bet.creatorUsername,
      userStake: bet.userAmount,
      hasInsurance: bet.hasInsurance,
      insuranceRefundPercentage: bet.insuranceRefundPercentage
    };
  }, [calculateTimeRemaining, isDeadlineUrgent]);

  // Filter my bets based on selected filter and search query
  const filteredMyBets = useMemo(() => {
    return myBets.filter(bet => {
      let matchesStatus = false;
      switch (myBetsFilter) {
        case 'open':
          matchesStatus = bet.status === 'OPEN';
          break;
        case 'pending':
          matchesStatus = bet.status === 'CLOSED';
          break;
        case 'resolved':
          matchesStatus = bet.status === 'RESOLVED' || bet.status === 'CANCELLED';
          break;
        case 'all':
        default:
          matchesStatus = true;
      }

      const matchesSearch = searchQuery.length === 0 ||
        bet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bet.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bet.groupName && bet.groupName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        bet.betType.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [myBets, myBetsFilter, searchQuery]);

  // Memoize transformed bet arrays
  const transformedMyBets = useMemo(() => {
    return filteredMyBets.map(bet => transformBetData(bet));
  }, [filteredMyBets, transformBetData]);

  // Memoize tab change handler
  const handleTabChange = useCallback((index: number) => {
    Haptics.selectionAsync();
    setActiveTab(index);
  }, []);

  // Memoize filter change handler
  const handleFilterChange = useCallback((filter: 'all' | 'open' | 'pending' | 'resolved') => {
    Haptics.selectionAsync();
    setMyBetsFilter(filter);
  }, []);

  // Handler for "Losses" tab filters
  const handleLossesFilterChange = useCallback((filter: 'all' | 'todo' | 'submitted') => {
    Haptics.selectionAsync();
    setLossesFilter(filter);
  }, []);

  // Handler for "Winnings" tab filters
  const handleWinningsFilterChange = useCallback((filter: 'all' | 'waiting' | 'completed') => {
    Haptics.selectionAsync();
    setWinningsFilter(filter);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
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
                {isLoadingMyBets && myBets.length === 0 ? (
                  <>
                    <SkeletonBetCard />
                    <SkeletonBetCard />
                    <SkeletonBetCard />
                  </>
                ) : transformedMyBets.length > 0 ? (
                  <>
                    {transformedMyBets.map((bet) => (
                      <BetCard
                        key={bet.id}
                        {...bet}
                        showJoinedIndicator={false}
                      />
                    ))}
                    {hasNextMyBets && (
                      <TouchableOpacity
                        onPress={handleMyBetsEndReached}
                        disabled={isFetchingNextMyBets}
                        style={{
                          alignItems: 'center',
                          paddingVertical: 16,
                          marginTop: 8
                        }}
                      >
                        {isFetchingNextMyBets ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>
                            Load More
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
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
                )}
              </>
            ) : activeTab === 1 ? (
              /* You Owe Tab */
              <View>
                {/* Filter Tabs */}
                <View style={{
                  flexDirection: 'row',
                  marginBottom: 16,
                  gap: 8
                }}>
                  {lossesFilters.map((filter) => {
                    const isActive = filter.key === lossesFilter;
                    return (
                      <TouchableOpacity
                        key={filter.key}
                        onPress={() => handleLossesFilterChange(filter.key)}
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

                {isLoadingLosses && lossesBets.length === 0 ? (
                  <>
                    <SkeletonOwedStakesCard />
                    <SkeletonOwedStakesCard />
                  </>
                ) : (() => {
                  const filteredBets = lossesBets.filter(bet => {
                    if (lossesFilter === 'all') return true;
                    if (lossesFilter === 'todo') return !bet.hasCurrentUserClaimedFulfillment && bet.fulfillmentStatus !== 'FULFILLED';
                    if (lossesFilter === 'submitted') return bet.hasCurrentUserClaimedFulfillment || bet.fulfillmentStatus === 'FULFILLED';
                    return true;
                  });

                  const renderYouOweBetCard = (bet: BetSummaryResponse) => {
                    let badgeConfig: { bgColor: string; textColor: string; text: string };

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

                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 8
                        }}>
                          <MaterialIcons
                            name="warning"
                            size={16}
                            color={colors.errorAlt}
                          />
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: colors.errorAlt
                          }}>
                            You Lost
                          </Text>
                        </View>

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

                        <View
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            marginBottom: 12
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.errorAlt,
                              fontWeight: '600'
                            }}
                          >
                            {bet.socialStakeDescription || 'Social bet'}
                          </Text>
                        </View>

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

                  if (filteredBets.length === 0) {
                    const emptyMessage = lossesFilter === 'todo'
                      ? 'No pending stakes to fulfill'
                      : lossesFilter === 'submitted'
                      ? 'No submitted stakes yet'
                      : "You don't owe anyone anything";

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
                      {filteredBets.map(bet => renderYouOweBetCard(bet))}
                      {hasNextLosses && (
                        <TouchableOpacity
                          onPress={handleLossesEndReached}
                          disabled={isFetchingNextLosses}
                          style={{
                            alignItems: 'center',
                            paddingVertical: 16,
                            marginTop: 8
                          }}
                        >
                          {isFetchingNextLosses ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>
                              Load More
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()}
              </View>
            ) : activeTab === 2 ? (
              /* Owed to You Tab */
              <View>
                {/* Filter Tabs */}
                <View style={{
                  flexDirection: 'row',
                  marginBottom: 16,
                  gap: 8
                }}>
                  {winningsFilters.map((filter) => {
                    const isActive = filter.key === winningsFilter;
                    return (
                      <TouchableOpacity
                        key={filter.key}
                        onPress={() => handleWinningsFilterChange(filter.key)}
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

                {isLoadingWinnings && winningsBets.length === 0 ? (
                  <>
                    <SkeletonOwedStakesCard />
                    <SkeletonOwedStakesCard />
                  </>
                ) : (() => {
                  const filteredBets = winningsBets.filter(bet => {
                    if (winningsFilter === 'all') return true;
                    if (winningsFilter === 'waiting') return bet.fulfillmentStatus !== 'FULFILLED';
                    if (winningsFilter === 'completed') return bet.fulfillmentStatus === 'FULFILLED';
                    return true;
                  });

                  const renderOwedToYouBetCard = (bet: BetSummaryResponse) => {
                    let badgeConfig: { bgColor: string; textColor: string; text: string };

                    if (bet.fulfillmentStatus === 'FULFILLED') {
                      badgeConfig = {
                        bgColor: 'rgba(0, 212, 170, 0.1)',
                        textColor: colors.primary,
                        text: 'Completed'
                      };
                    } else {
                      badgeConfig = {
                        bgColor: 'rgba(156, 163, 175, 0.1)',
                        textColor: '#9CA3AF',
                        text: 'Waiting'
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

                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 8
                        }}>
                          <MaterialIcons
                            name="emoji-events"
                            size={16}
                            color={colors.primary}
                          />
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: colors.primary
                          }}>
                            You Won
                          </Text>
                        </View>

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

                        <View
                          style={{
                            backgroundColor: 'rgba(0, 212, 170, 0.08)',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            marginBottom: 12
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.primary,
                              fontWeight: '600'
                            }}
                          >
                            {bet.socialStakeDescription || 'Social bet'}
                          </Text>
                        </View>

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

                  if (filteredBets.length === 0) {
                    const emptyMessage = winningsFilter === 'waiting'
                      ? 'No pending stakes from others'
                      : winningsFilter === 'completed'
                      ? 'No stakes have been fulfilled yet'
                      : 'No one owes you anything right now';

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
                      {filteredBets.map(bet => renderOwedToYouBetCard(bet))}
                      {hasNextWinnings && (
                        <TouchableOpacity
                          onPress={handleWinningsEndReached}
                          disabled={isFetchingNextWinnings}
                          style={{
                            alignItems: 'center',
                            paddingVertical: 16,
                            marginTop: 8
                          }}
                        >
                          {isFetchingNextWinnings ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>
                              Load More
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()}
              </View>
            ) : null}

            {/* Additional spacing for scroll */}
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
