import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert, Keyboard, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UserCard from '../../components/user/UserCard';
import { SkeletonUserCard } from '../../components/common/SkeletonCard';
import { userService, UserSearchResult } from '../../services/user/userService';
import { friendshipService, FriendshipService, FriendshipStatus } from '../../services/user/friendshipService';
import { debugLog, errorLog } from '../../config/env';
import { haptic } from '../../utils/haptics';
import { colors, spacing, borderRadius, fontSize } from '../../constants/theme';

export default function FindFriends() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false); // True only after a search fully completes
  const [friendStatuses, setFriendStatuses] = useState<Map<number, 'none' | 'pending_sent' | 'pending_received' | 'friends'>>(new Map());
  const [loadingFriendStatus, setLoadingFriendStatus] = useState<Set<number>>(new Set());

  // Refs for animations
  const searchIconScale = useRef(new Animated.Value(1)).current;
  const emptyIconFloat = useRef(new Animated.Value(0)).current;

  // Handle search with debouncing
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    // If query is empty, reset everything
    if (trimmedQuery.length === 0) {
      setSearchResults([]);
      setFriendStatuses(new Map());
      setIsLoading(false);
      setSearchCompleted(false);
      return;
    }

    // Show loading state when query changes
    setIsLoading(true);

    const handleSearch = async () => {
      try {
        const results = await userService.searchUsers(trimmedQuery);
        debugLog('User search results:', results);

        // Load friendship statuses BEFORE setting search results to prevent flickering
        if (results.length > 0) {
          await loadFriendshipStatuses(results.map(user => user.id));
        }

        // Set results and mark search as completed atomically
        setSearchResults(results);
        setSearchCompleted(true);
      } catch (error) {
        errorLog('Error searching users:', error);
        setSearchResults([]);
        setSearchCompleted(true);
        Alert.alert('Error', 'Failed to search users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);


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

  const handleFriendPress = async (userId: number) => {
    // Dismiss keyboard to improve UX
    Keyboard.dismiss();
    haptic.medium(); // Haptic feedback on button press

    const currentStatus = friendStatuses.get(userId) || 'none';

    // Prevent multiple clicks
    if (loadingFriendStatus.has(userId)) {
      return;
    }

    setLoadingFriendStatus(prev => new Set(prev).add(userId));

    try {
      if (currentStatus === 'none') {
        // Send friend request
        const response = await friendshipService.sendFriendRequest(userId);
        if (response.success) {
          haptic.success(); // Success haptic
          setFriendStatuses(prev => new Map(prev).set(userId, 'pending_sent'));
          debugLog(`Sent friend request to user ${userId}`);
        } else {
          haptic.error(); // Error haptic
          Alert.alert('Error', response.message || 'Failed to send friend request');
        }
      } else if (currentStatus === 'pending_received') {
        // Accept friend request - we'd need the friendship ID for this
        // For now, let's reload the status to get the correct state
        const status = await friendshipService.getFriendshipStatus(userId);
        const simpleStatus = FriendshipService.getFriendRequestStatus(status);
        setFriendStatuses(prev => new Map(prev).set(userId, simpleStatus));

        if (simpleStatus === 'pending_received') {
          Alert.alert('Info', 'Please accept the friend request from your notifications.');
        }
      } else if (currentStatus === 'friends') {
        // Remove friend
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
                  haptic.medium(); // Haptic on confirm remove
                  const response = await friendshipService.removeFriend(userId);
                  if (response.success) {
                    haptic.success(); // Success haptic
                    setFriendStatuses(prev => new Map(prev).set(userId, 'none'));
                    debugLog(`Removed friend ${userId}`);
                  } else {
                    haptic.error(); // Error haptic
                    Alert.alert('Error', response.message || 'Failed to remove friend');
                  }
                } catch (error) {
                  haptic.error(); // Error haptic
                  errorLog('Error removing friend:', error);
                  Alert.alert('Error', 'Failed to remove friend. Please try again.');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      haptic.error(); // Error haptic
      errorLog('Error updating friend status:', error);
      Alert.alert('Error', 'Failed to update friend status. Please try again.');

      // Reload the current status on error
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
  };

  const handleBackPress = () => {
    router.back();
  };

  // Determine what to show - simple and predictable logic
  const showEmptyState = searchQuery.trim().length === 0;
  const showLoading = isLoading;
  const showResults = !isLoading && searchCompleted && searchResults.length > 0;
  const showNoResults = !isLoading && searchCompleted && searchResults.length === 0;

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

      <ScrollView
        style={{ flex: 1, marginTop: insets.top }}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
          {/* Header with Title and Search Input */}
          <View style={{ marginBottom: spacing.xl }}>
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

          {/* Results */}
          {showEmptyState ? (
            /* No search query - show instructions */
            <View style={{
              backgroundColor: colors.surfaceLight,
              borderRadius: borderRadius.lg,
              padding: spacing.xxl,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.borderLight,
              marginTop: spacing.xxxl
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
          ) : showLoading ? (
            /* Loading - show skeleton cards */
            <View>
              <SkeletonUserCard />
              <SkeletonUserCard />
              <SkeletonUserCard />
            </View>
          ) : showResults ? (
            /* Search results */
            <View>
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
                    {searchResults.length}
                  </Text>
                </View>
              </View>

              {searchResults.map((user) => (
                <UserCard
                  key={user.id}
                  id={user.id}
                  username={user.username}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  profileImageUrl={user.profileImageUrl}
                  isActive={user.isActive}
                  onFriendPress={handleFriendPress}
                  friendRequestStatus={friendStatuses.get(user.id) || 'none'}
                  showFollowButton={true}
                  isLoading={loadingFriendStatus.has(user.id)}
                />
              ))}
            </View>
          ) : showNoResults ? (
            /* No results found */
            <View style={{
              backgroundColor: colors.surfaceLight,
              borderRadius: borderRadius.lg,
              padding: spacing.xxl,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.borderLight,
              marginTop: spacing.lg
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
          ) : null}

          {/* Additional spacing for scroll */}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}