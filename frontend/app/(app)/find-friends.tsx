import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, StatusBar, TextInput, Alert, Keyboard, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UserCard from '../../components/user/UserCard';
import { SkeletonUserCard } from '../../components/common/SkeletonCard';
import { userService, UserSearchResult } from '../../services/user/userService';
import { friendshipService, FriendshipService } from '../../services/user/friendshipService';
import { debugLog, errorLog } from '../../config/env';
import { haptic } from '../../utils/haptics';
import { colors, spacing, borderRadius, fontSize } from '../../constants/theme';

const PAGE_SIZE = 20;

export default function FindFriends() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [friendStatuses, setFriendStatuses] = useState<Map<number, 'none' | 'pending_sent' | 'pending_received' | 'friends'>>(new Map());
  const [loadingFriendStatus, setLoadingFriendStatus] = useState<Set<number>>(new Set());
  const currentQueryRef = useRef('');
  const inputRef = useRef<TextInput>(null);

  // Refs for animations
  const searchIconScale = useRef(new Animated.Value(1)).current;
  const emptyIconFloat = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Handle search with debouncing
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    // If query is empty, reset everything
    if (trimmedQuery.length === 0) {
      setSearchResults([]);
      setFriendStatuses(new Map());
      setIsLoading(false);
      setSearchCompleted(false);
      setCurrentPage(0);
      setHasMore(false);
      setTotalResults(0);
      currentQueryRef.current = '';
      return;
    }

    // Show loading state when query changes
    setIsLoading(true);
    currentQueryRef.current = trimmedQuery;

    const handleSearch = async () => {
      try {
        const response = await userService.searchUsersPaginated(trimmedQuery, 0, PAGE_SIZE);
        debugLog('User search results:', response);

        // Check if query changed while waiting for response
        if (currentQueryRef.current !== trimmedQuery) {
          return;
        }

        // Load friendship statuses BEFORE setting search results to prevent flickering
        if (response.content.length > 0) {
          await loadFriendshipStatuses(response.content.map(user => user.id));
        }

        // Set results and mark search as completed atomically
        setSearchResults(response.content);
        setCurrentPage(0);
        setHasMore(!response.last);
        setTotalResults(response.totalElements);
        setSearchCompleted(true);
      } catch (error) {
        errorLog('Error searching users:', error);
        setSearchResults([]);
        setSearchCompleted(true);
        setHasMore(false);
        setTotalResults(0);
        Alert.alert('Error', 'Failed to search users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load more results
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || isLoading) return;

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    setLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const response = await userService.searchUsersPaginated(trimmedQuery, nextPage, PAGE_SIZE);

      // Check if query changed while loading
      if (currentQueryRef.current !== trimmedQuery) {
        return;
      }

      // Load friendship statuses for new results
      if (response.content.length > 0) {
        const newUserIds = response.content
          .filter(user => !friendStatuses.has(user.id))
          .map(user => user.id);
        if (newUserIds.length > 0) {
          await loadFriendshipStatuses(newUserIds);
        }
      }

      // Deduplicate and append results
      const existingIds = new Set(searchResults.map(r => r.id));
      const newResults = response.content.filter(r => !existingIds.has(r.id));

      setSearchResults(prev => [...prev, ...newResults]);
      setCurrentPage(nextPage);
      setHasMore(!response.last);
    } catch (error) {
      errorLog('Error loading more users:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, isLoading, searchQuery, currentPage, searchResults, friendStatuses]);

  // Animate search icon when loading
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(searchIconScale, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(searchIconScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      searchIconScale.setValue(1);
    }
  }, [isLoading]);

  // Animate empty state icon float
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(emptyIconFloat, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(emptyIconFloat, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Load friendship statuses for multiple users
  const loadFriendshipStatuses = async (userIds: number[]) => {
    try {
      const statusMap = await friendshipService.getMultipleFriendshipStatuses(userIds);
      const simplifiedStatusMap = new Map<number, 'none' | 'pending_sent' | 'pending_received' | 'friends'>();

      statusMap.forEach((status, userId) => {
        const simpleStatus = FriendshipService.getFriendRequestStatus(status);
        simplifiedStatusMap.set(userId, simpleStatus);
      });

      setFriendStatuses(prev => {
        const newMap = new Map(prev);
        simplifiedStatusMap.forEach((status, userId) => {
          newMap.set(userId, status);
        });
        return newMap;
      });
    } catch (error) {
      errorLog('Error loading friendship statuses:', error);
    }
  };

  const handleFriendPress = useCallback(async (userId: number) => {
    Keyboard.dismiss();
    haptic.medium();

    const currentStatus = friendStatuses.get(userId) || 'none';

    if (loadingFriendStatus.has(userId)) {
      return;
    }

    setLoadingFriendStatus(prev => new Set(prev).add(userId));

    try {
      if (currentStatus === 'none') {
        const response = await friendshipService.sendFriendRequest(userId);
        if (response.success) {
          haptic.success();
          setFriendStatuses(prev => new Map(prev).set(userId, 'pending_sent'));
          debugLog(`Sent friend request to user ${userId}`);
        } else {
          haptic.error();
          Alert.alert('Error', response.message || 'Failed to send friend request');
        }
      } else if (currentStatus === 'pending_received') {
        const status = await friendshipService.getFriendshipStatus(userId);
        const simpleStatus = FriendshipService.getFriendRequestStatus(status);
        setFriendStatuses(prev => new Map(prev).set(userId, simpleStatus));

        if (simpleStatus === 'pending_received') {
          Alert.alert('Info', 'Please accept the friend request from your notifications.');
        }
      } else if (currentStatus === 'friends') {
        Alert.alert(
          'Remove Friend',
          'Are you sure you want to remove this friend?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  haptic.medium();
                  const response = await friendshipService.removeFriend(userId);
                  if (response.success) {
                    haptic.success();
                    setFriendStatuses(prev => new Map(prev).set(userId, 'none'));
                    debugLog(`Removed friend ${userId}`);
                  } else {
                    haptic.error();
                    Alert.alert('Error', response.message || 'Failed to remove friend');
                  }
                } catch (error) {
                  haptic.error();
                  errorLog('Error removing friend:', error);
                  Alert.alert('Error', 'Failed to remove friend. Please try again.');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      haptic.error();
      errorLog('Error updating friend status:', error);
      Alert.alert('Error', 'Failed to update friend status. Please try again.');

      try {
        const status = await friendshipService.getFriendshipStatus(userId);
        const simpleStatus = FriendshipService.getFriendRequestStatus(status);
        setFriendStatuses(prev => new Map(prev).set(userId, simpleStatus));
      } catch (reloadError) {
        errorLog('Error reloading friend status:', reloadError);
      }
    } finally {
      setLoadingFriendStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [friendStatuses, loadingFriendStatus]);

  const handleBackPress = () => {
    router.back();
  };

  // Determine what to show
  const showEmptyState = searchQuery.trim().length === 0;
  const showLoading = isLoading;
  const showResults = !isLoading && searchCompleted && searchResults.length > 0;
  const showNoResults = !isLoading && searchCompleted && searchResults.length === 0;

  // Render individual user card
  const renderUserCard = useCallback(({ item }: { item: UserSearchResult }) => (
    <UserCard
      id={item.id}
      username={item.username}
      firstName={item.firstName}
      lastName={item.lastName}
      profileImageUrl={item.profileImageUrl}
      isActive={item.isActive}
      onFriendPress={handleFriendPress}
      friendRequestStatus={friendStatuses.get(item.id) || 'none'}
      showFollowButton={true}
      isLoading={loadingFriendStatus.has(item.id)}
    />
  ), [friendStatuses, loadingFriendStatus, handleFriendPress]);

  const keyExtractor = useCallback((item: UserSearchResult) => item.id.toString(), []);

  // Footer component for loading indicator
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{
          fontSize: fontSize.sm,
          color: colors.textMuted,
          marginTop: spacing.sm
        }}>
          Loading more...
        </Text>
      </View>
    );
  }, [loadingMore]);

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, loadingMore, isLoading, loadMore]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
        translucent={true}
      />

      {/* Solid background behind status bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: colors.background,
        zIndex: 1
      }} />

      {/* Fixed Header with Search - Outside FlatList */}
      <View style={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.md,
        backgroundColor: colors.background
      }}>
        {/* Back Button and Title Row */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.full,
              backgroundColor: colors.surfaceStrong,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: spacing.md
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={{
            fontSize: fontSize.xl,
            fontWeight: '600',
            color: colors.textPrimary
          }}>
            Find Friends
          </Text>
        </View>

        {/* Search Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceStrong,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderLight
        }}>
          <Animated.View style={{ transform: [{ scale: searchIconScale }] }}>
            <MaterialIcons name="search" size={20} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
          </Animated.View>

          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              fontSize: fontSize.md,
              color: colors.textPrimary,
              paddingVertical: 0
            }}
            placeholder="Search by username or name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={colors.primary}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            autoFocus={true}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              style={{
                marginLeft: spacing.sm,
                padding: spacing.xs,
                borderRadius: borderRadius.full,
                backgroundColor: colors.surfaceMedium
              }}
            >
              <MaterialIcons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Area */}
      <View style={{ flex: 1 }}>
        {showEmptyState ? (
          /* No search query - show instructions */
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl }}>
            <View style={{
              backgroundColor: colors.surfaceLight,
              borderRadius: borderRadius.lg,
              padding: spacing.xxl,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.borderLight
            }}>
              <Animated.View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.surfaceMedium,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: spacing.lg,
                transform: [{ translateY: emptyIconFloat }]
              }}>
                <MaterialIcons name="person-add" size={28} color={colors.textMuted} />
              </Animated.View>
              <Text style={{
                fontSize: fontSize.lg,
                fontWeight: '600',
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: spacing.xs
              }}>
                Search for friends
              </Text>
              <Text style={{
                fontSize: fontSize.sm,
                color: colors.textMuted,
                textAlign: 'center',
                lineHeight: 20
              }}>
                Enter a username or name to find{'\n'}people you know
              </Text>
            </View>
          </View>
        ) : showLoading ? (
          /* Loading - show skeleton cards */
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            <SkeletonUserCard />
            <SkeletonUserCard />
            <SkeletonUserCard />
          </View>
        ) : showNoResults ? (
          /* No results found */
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            <View style={{
              backgroundColor: colors.surfaceLight,
              borderRadius: borderRadius.lg,
              padding: spacing.xxl,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.borderLight
            }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.surfaceMedium,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: spacing.lg
              }}>
                <MaterialIcons name="person-search" size={28} color={colors.textMuted} />
              </View>
              <Text style={{
                fontSize: fontSize.lg,
                fontWeight: '600',
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: spacing.xs
              }}>
                No users found
              </Text>
              <Text style={{
                fontSize: fontSize.sm,
                color: colors.textMuted,
                textAlign: 'center',
                lineHeight: 20
              }}>
                Try a different username or name
              </Text>
            </View>
          </View>
        ) : showResults ? (
          /* Search results */
          <FlatList
            ref={flatListRef}
            data={searchResults}
            renderItem={renderUserCard}
            keyExtractor={keyExtractor}
            ListHeaderComponent={() => (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.lg
              }}>
                <Text style={{
                  fontSize: fontSize.sm,
                  fontWeight: '500',
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Results
                </Text>
                <View style={{
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  marginLeft: spacing.sm
                }}>
                  <Text style={{
                    fontSize: fontSize.xs,
                    fontWeight: '600',
                    color: colors.textDark
                  }}>
                    {totalResults}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={renderFooter}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              paddingBottom: insets.bottom + spacing.xl
            }}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        ) : null}
      </View>
    </View>
  );
}
