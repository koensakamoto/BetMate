import { Text, View, Image, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import { userService, UserProfileResponse, UserStatistics } from '../../../services/user/userService';
import { friendshipService } from '../../../services/friendship/friendshipService';
import { debugLog, errorLog } from '../../../config/env';
import { NotificationIconButton } from '../../../components/ui/NotificationBadge';
import { SkeletonProfile } from '../../../components/common/SkeletonCard';
import { formatNumber, formatPercentage } from '../../../utils/formatters';
import { storeService, InventoryItemResponse } from '../../../services/store/storeService';
import InventoryItemDetailSheet from '../../../components/store/InventoryItemDetailSheet';
import { Avatar } from '../../../components/common/Avatar';
import { getErrorMessage } from '../../../utils/errorUtils';

const icon = require("../../../assets/images/icon.png");

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshUnreadCount } = useNotificationContext();
  const [activeTab, setActiveTab] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItemResponse[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItemResponse | null>(null);
  const [inventoryDetailVisible, setInventoryDetailVisible] = useState(false);
  const [profileImageTimestamp, setProfileImageTimestamp] = useState<number>(Date.now());
  // MVP: Inventory tab commented out - focusing on social bets first
  // const tabs = ['Stats', 'Inventory'];
  const tabs = ['Stats'];

  // Cache management: 5 minute cache for stats
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Cache management: 1 minute cache for inventory
  const lastInventoryFetchTime = useRef<number>(0);
  const INVENTORY_CACHE_DURATION = 60 * 1000; // 1 minute

  // Invalidate inventory cache (to be called after purchases)
  const invalidateInventoryCache = useCallback(() => {
    lastInventoryFetchTime.current = 0;
    debugLog('Inventory cache invalidated');
  }, []);

  const isCacheValid = useCallback(() => {
    return (Date.now() - lastFetchTime.current) < CACHE_DURATION;
  }, []);

  const isInventoryCacheValid = useCallback(() => {
    // Cache is only valid if we've fetched before (lastInventoryFetchTime > 0) and it's within the duration
    return lastInventoryFetchTime.current > 0 && (Date.now() - lastInventoryFetchTime.current) < INVENTORY_CACHE_DURATION;
  }, []);

  // Initial load on mount
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadUserData(false); // Initial load, not forced
      } else {
        router.replace('/auth/login');
      }
    }
  }, [authLoading, isAuthenticated]);

  // Smart refresh on focus: only refetch if cache expired
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !authLoading && !isCacheValid()) {
        loadUserData(false);
      }
    }, [isAuthenticated, authLoading, isCacheValid])
  );

  // MVP: Inventory tab commented out - focusing on social bets first
  // Smart refresh for inventory on focus: refresh if on inventory tab and cache expired
  // useFocusEffect(
  //   useCallback(() => {
  //     if (isAuthenticated && !authLoading && activeTab === 1 && !isInventoryCacheValid()) {
  //       fetchInventory(false);
  //     }
  //   }, [isAuthenticated, authLoading, activeTab, isInventoryCacheValid, fetchInventory])
  // );

  const loadUserData = async (isRefreshing: boolean = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Load user profile
      const profile = await userService.getCurrentUserProfile();
      setUserProfile(profile);
      // Refresh image timestamp to bust cache when profile is reloaded
      setProfileImageTimestamp(Date.now());
      debugLog('User profile loaded:', profile);

      // Load user statistics
      const stats = await userService.getCurrentUserStatistics();
      setUserStats(stats);
      debugLog('User stats loaded:', stats);

      // Load friends count
      const count = await friendshipService.getFriendsCount();
      setFriendsCount(count);
      debugLog('Friends count loaded:', count);

      // Update cache timestamp
      lastFetchTime.current = Date.now();

    } catch (err) {
      errorLog('Failed to load user data:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch user inventory with caching
  const fetchInventory = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated) {
      return;
    }

    // Check cache validity - skip fetch if cache is still valid and not forced
    if (!forceRefresh && isInventoryCacheValid()) {
      debugLog('Using cached inventory data');
      return;
    }

    try {
      setLoadingInventory(true);
      const items = await storeService.getUserInventory();

      // Defensive filtering: exclude booster items (should already be filtered by backend)
      const filteredItems = items.filter(item => !item.itemType.endsWith('_BOOSTER'));

      setInventory(filteredItems);
      lastInventoryFetchTime.current = Date.now();
      debugLog('User inventory loaded:', filteredItems);
    } catch (err) {
      errorLog('Failed to load inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  }, [isAuthenticated, isInventoryCacheValid]);

  // MVP: Inventory tab commented out - focusing on social bets first
  // Fetch inventory when Inventory tab is active
  // useEffect(() => {
  //   if (activeTab === 1 && isAuthenticated) {
  //     fetchInventory();
  //   }
  // }, [activeTab, isAuthenticated, fetchInventory]);

  // Pull-to-refresh handler - force refresh all caches
  const onRefresh = useCallback(() => {
    loadUserData(true);
    refreshUnreadCount(); // Refresh notification count
    // MVP: Inventory tab commented out - focusing on social bets first
    // if (activeTab === 1) {
    //   fetchInventory(true); // Force refresh inventory
    // }
  }, [refreshUnreadCount]);


  // Memoize detailed stats array to avoid recalculating on every render
  const detailedStats = useMemo(() => [
    { label: 'Wins', value: formatNumber(userStats?.winCount), color: '#00D4AA' },
    { label: 'Losses', value: formatNumber(userStats?.lossCount), color: '#EF4444' },
    { label: 'Win Rate', value: formatPercentage(userStats?.winRate ? userStats.winRate * 100 : 0), color: '#00D4AA' },
    { label: 'Total Games', value: formatNumber(userStats?.totalGames), color: '#ffffff' },
    { label: 'Longest Streak', value: formatNumber(userStats?.longestStreak), color: '#00D4AA' },
    { label: 'Current Streak', value: formatNumber(userStats?.currentStreak), color: '#FFB800' }
  ], [userStats]);

  // Memoize navigation handlers to provide stable references
  const navigateToEditProfile = useCallback(() => {
    router.push('/(app)/edit-profile');
  }, []);

  const navigateToSettings = useCallback(() => {
    router.push('/(app)/settings');
  }, []);

  const navigateToFindFriends = useCallback(() => {
    router.push('/(app)/find-friends');
  }, []);

  const navigateToFriendsList = useCallback(() => {
    router.push('/(app)/friends-list');
  }, []);

  const handleInventoryItemPress = useCallback((item: InventoryItemResponse) => {
    setSelectedInventoryItem(item);
    setInventoryDetailVisible(true);
  }, []);

  const handleCloseInventoryDetail = useCallback(() => {
    setInventoryDetailVisible(false);
    setTimeout(() => setSelectedInventoryItem(null), 300);
  }, []);

  const handleEquipItem = useCallback(async (item: InventoryItemResponse) => {
    try {
      await storeService.equipItem(item.id);
      // Force refresh inventory to get updated status and invalidate cache
      await fetchInventory(true);
      handleCloseInventoryDetail();
    } catch (error) {
      errorLog('Failed to equip item:', error);
      Alert.alert('Error', 'Failed to activate item. Please try again.');
    }
  }, [fetchInventory]);

  const handleUnequipItem = useCallback(async (item: InventoryItemResponse) => {
    try {
      await storeService.unequipItem(item.id);
      // Force refresh inventory to get updated status and invalidate cache
      await fetchInventory(true);
      handleCloseInventoryDetail();
    } catch (error) {
      errorLog('Failed to unequip item:', error);
      Alert.alert('Error', 'Failed to deactivate item. Please try again.');
    }
  }, [fetchInventory]);

  // Show loading while checking authentication or loading profile data
  if (authLoading || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20
          }}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonProfile />
        </ScrollView>
      </View>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 18, textAlign: 'center' }}>Failed to load profile</Text>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 8, fontSize: 14, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={() => loadUserData()}
          style={{
            backgroundColor: '#00D4AA',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 20
          }}
        >
          <Text style={{ color: '#000000', fontWeight: '600', fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = userProfile?.firstName && userProfile?.lastName 
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : userProfile?.username || 'Unknown User';
  
  const username = userProfile?.username || '';


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

      <ScrollView
        style={{ flex: 1, marginTop: insets.top }}
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
        {/* Header Icons */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          paddingHorizontal: 20, 
          marginBottom: 8,
          alignItems: 'center'
        }}>
          {/* Find Friends Icon */}
          <TouchableOpacity
            onPress={navigateToFindFriends}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <MaterialIcons 
              name="person-add" 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>

          <View style={{ 
            flexDirection: 'row', 
            gap: 16 
          }}>
            {/* Notifications Icon with Badge */}
            <NotificationIconButton size={20} />

            {/* Settings Icon */}
            <TouchableOpacity
              onPress={navigateToSettings}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <MaterialIcons 
                name="settings" 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleek Header */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          {/* Avatar & Basic Info */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <Avatar
                imageUrl={userProfile?.profileImageUrl}
                firstName={userProfile?.firstName}
                lastName={userProfile?.lastName}
                username={userProfile?.username}
                userId={userProfile?.id}
                size="lg"
                showBorder
                borderColor="rgba(255, 255, 255, 0.1)"
                cacheBuster={profileImageTimestamp}
              />
            </View>
            
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '500', 
                color: '#ffffff',
                marginBottom: 4
              }}>
                {displayName}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: 8
              }}>
                @{username}
              </Text>
            </View>

            {/* Social Stats */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 24,
              marginBottom: 20
            }}>
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={navigateToFriendsList}
              >
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  {formatNumber(friendsCount)}
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Friends
                </Text>
              </TouchableOpacity>
              
              <View style={{
                width: 1,
                height: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }} />
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: '#00D4AA',
                  marginBottom: 2
                }}>
                  {formatNumber(userStats?.totalGames || 0)}
                </Text>
                <Text style={{ 
                  fontSize: 11, 
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Bets
                </Text>
              </View>
            </View>

            {/* Bio Section */}
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 20,
              paddingHorizontal: 20
            }}>
              {userProfile?.bio || "No bio yet. Tap edit to add one!"}
            </Text>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 16
            }}>
              {/* Sleek Edit Button */}
              <TouchableOpacity
                onPress={navigateToEditProfile}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                  borderRadius: 20,
                  borderWidth: 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  flex: 1
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '500',
                  letterSpacing: 0.2,
                  textAlign: 'center'
                }}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* Tab Navigation */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 24,
          marginBottom: 12
        }}>
          {tabs.map((tab, index) => {
            const isActive = index === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: isActive ? 1 : 0,
                  borderBottomColor: '#ffffff',
                  flex: 1,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
                }} numberOfLines={1}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 24, flex: 1 }}>
          {activeTab === 0 && (
            /* Stats Tab - Comprehensive betting statistics */
            <View>
              {/* Performance Overview */}
              <View style={{
                flexDirection: 'row',
                marginBottom: 16,
                gap: 12
              }}>
                {/* Win Rate */}
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 212, 170, 0.08)',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(0, 212, 170, 0.2)'
                }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#00D4AA',
                    marginBottom: 4
                  }}>
                    {formatPercentage(userStats?.winRate ? userStats.winRate * 100 : 0)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Win Rate
                  </Text>
                </View>

                {/* Total Bets */}
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: 4
                  }}>
                    {formatNumber(userStats?.totalGames)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Total Bets
                  </Text>
                </View>
              </View>

              {/* Win/Loss Summary */}
              <View style={{
                flexDirection: 'row',
                marginBottom: 16,
                gap: 12
              }}>
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: '#00D4AA',
                    marginBottom: 4
                  }}>
                    {formatNumber(userStats?.winCount)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Wins
                  </Text>
                </View>

                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: '#EF4444',
                    marginBottom: 4
                  }}>
                    {formatNumber(userStats?.lossCount)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Losses
                  </Text>
                </View>
              </View>

              {/* Additional Stats */}
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 16
                }}>
                  Statistics
                </Text>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: 0.5,
                  borderBottomColor: 'rgba(255, 255, 255, 0.1)'
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    Best Streak
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#00D4AA'
                  }}>
                    {formatNumber(userStats?.longestStreak)}
                  </Text>
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    Current Streak
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#ffffff'
                  }}>
                    {formatNumber(userStats?.currentStreak)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* MVP: Inventory Tab hidden - focusing on social bets first */}
          {false && activeTab === 999 && (
            <View>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 16
              }}>
                My Items
              </Text>

              {loadingInventory ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#00D4AA" />
                </View>
              ) : inventory.length === 0 ? (
                <View style={{
                  alignItems: 'center',
                  paddingVertical: 60
                }}>
                  <MaterialIcons name="inventory-2" size={48} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={{
                    fontSize: 16,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                    marginTop: 16,
                    fontWeight: '500'
                  }}>
                    No items yet
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.4)',
                    textAlign: 'center',
                    marginTop: 8
                  }}>
                    Visit the store to purchase items
                  </Text>
                </View>
              ) : (
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  {inventory.map((item) => {
                    // Map rarity to enhanced colors and icons
                    const rarityConfig: Record<string, { bgColor: string; borderColor: string; textColor: string; icon: string }> = {
                      'COMMON': {
                        bgColor: 'rgba(156, 163, 175, 0.1)',
                        borderColor: 'rgba(156, 163, 175, 0.3)',
                        textColor: '#9CA3AF',
                        icon: '⚪'
                      },
                      'UNCOMMON': {
                        bgColor: 'rgba(16, 185, 129, 0.1)',
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                        textColor: '#10B981',
                        icon: '🟢'
                      },
                      'RARE': {
                        bgColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                        textColor: '#3B82F6',
                        icon: '🔵'
                      },
                      'EPIC': {
                        bgColor: 'rgba(139, 92, 246, 0.1)',
                        borderColor: 'rgba(139, 92, 246, 0.4)',
                        textColor: '#8B5CF6',
                        icon: '🟣'
                      },
                      'LEGENDARY': {
                        bgColor: 'rgba(245, 158, 11, 0.15)',
                        borderColor: 'rgba(245, 158, 11, 0.5)',
                        textColor: '#F59E0B',
                        icon: '🟡'
                      }
                    };
                    const config = rarityConfig[item.rarity] || {
                      bgColor: 'rgba(255, 255, 255, 0.03)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      textColor: '#ffffff',
                      icon: '⚪'
                    };

                    // Use iconUrl from API (it contains the MaterialIcons name)
                    const iconName = item.iconUrl || 'stars';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleInventoryItemPress(item)}
                        activeOpacity={0.7}
                        style={{
                          backgroundColor: config.bgColor,
                          padding: 14,
                          borderRadius: 16,
                          width: '47%',
                          borderWidth: item.isEquipped ? 2 : 1,
                          borderColor: item.isEquipped ? '#00D4AA' : config.borderColor,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Equipped Badge - Top Right */}
                        {item.isEquipped && (
                          <View style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: '#00D4AA',
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            zIndex: 1
                          }}>
                            <MaterialIcons name="check-circle" size={10} color="#000000" />
                            <Text style={{
                              fontSize: 9,
                              fontWeight: '700',
                              color: '#000000',
                              textTransform: 'uppercase',
                              letterSpacing: 0.3
                            }}>
                              Active
                            </Text>
                          </View>
                        )}

                        {/* Icon Container */}
                        <View style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          marginBottom: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                          alignSelf: 'center',
                          borderWidth: 2,
                          borderColor: config.borderColor
                        }}>
                          <MaterialIcons name={iconName as any} size={28} color={config.textColor} />
                        </View>

                        {/* Item Name */}
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: '#ffffff',
                          textAlign: 'center',
                          marginBottom: 6,
                          lineHeight: 16
                        }} numberOfLines={2}>
                          {item.itemName}
                        </Text>

                        {/* Item Description */}
                        <Text style={{
                          fontSize: 10,
                          color: 'rgba(255, 255, 255, 0.5)',
                          textAlign: 'center',
                          lineHeight: 14,
                          paddingHorizontal: 4
                        }} numberOfLines={2}>
                          {item.shortDescription || item.description}
                        </Text>

                        {/* Subtle glow effect for equipped items */}
                        {item.isEquipped && (
                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 212, 170, 0.03)',
                            borderRadius: 16,
                            pointerEvents: 'none'
                          }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

        </View>

      </ScrollView>

      {/* Inventory Item Detail Sheet */}
      <InventoryItemDetailSheet
        visible={inventoryDetailVisible}
        item={selectedInventoryItem}
        onClose={handleCloseInventoryDetail}
        onEquip={handleEquipItem}
        onUnequip={handleUnequipItem}
      />
    </View>
  );
}