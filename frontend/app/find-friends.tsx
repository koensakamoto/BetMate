import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UserCard from '../components/user/UserCard';
import { userService, UserSearchResult } from '../services/user/userService';
import { friendshipService, FriendshipService, FriendshipStatus } from '../services/user/friendshipService';
import { debugLog, errorLog } from '../config/env';

export default function FindFriends() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [friendStatuses, setFriendStatuses] = useState<Map<number, 'none' | 'pending_sent' | 'pending_received' | 'friends'>>(new Map());
  const [loadingFriendStatus, setLoadingFriendStatus] = useState<Set<number>>(new Set());

  // Handle search with debouncing
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length > 0) {
        setIsLoading(true);
        try {
          const results = await userService.searchUsers(searchQuery.trim());
          setSearchResults(results);
          debugLog('User search results:', results);

          // Load friendship statuses for all search results
          if (results.length > 0) {
            loadFriendshipStatuses(results.map(user => user.id));
          }
        } catch (error) {
          errorLog('Error searching users:', error);
          setSearchResults([]);
          Alert.alert('Error', 'Failed to search users. Please try again.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setFriendStatuses(new Map());
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
          setFriendStatuses(prev => new Map(prev).set(userId, 'pending_sent'));
          debugLog(`Sent friend request to user ${userId}`);
        } else {
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
                  const response = await friendshipService.removeFriend(userId);
                  if (response.success) {
                    setFriendStatuses(prev => new Map(prev).set(userId, 'none'));
                    debugLog(`Removed friend ${userId}`);
                  } else {
                    Alert.alert('Error', response.message || 'Failed to remove friend');
                  }
                } catch (error) {
                  errorLog('Error removing friend:', error);
                  Alert.alert('Error', 'Failed to remove friend. Please try again.');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24
          }}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}
            >
              <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
            </TouchableOpacity>
            
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#ffffff',
              flex: 1
            }}>
              Find Friends
            </Text>
          </View>

          {/* Search Input */}
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
              placeholder="Search by username or name..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor="#ffffff"
              autoCapitalize="none"
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

          {/* Search Status */}
          {searchQuery.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {isLoading ? 'Searching...' : `Searching for "${searchQuery}"`}
              </Text>
            </View>
          )}

          {/* Results */}
          {searchQuery.length === 0 ? (
            /* No search query - show instructions */
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 12,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.05)',
              marginTop: 40
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
                <MaterialIcons name="search" size={24} color="rgba(255, 255, 255, 0.4)" />
              </View>
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                marginBottom: 4
              }}>
                Search for friends
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center'
              }}>
                Enter a username or name to find other users
              </Text>
            </View>
          ) : isLoading ? (
            /* Loading state */
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
                Searching for users...
              </Text>
            </View>
          ) : searchResults.length > 0 ? (
            /* Search results */
            <View>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 16
              }}>
                Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
              </Text>
              
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
          ) : (
            /* No results */
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
                <MaterialIcons name="person-search" size={24} color="rgba(255, 255, 255, 0.4)" />
              </View>
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                marginBottom: 4
              }}>
                No users found
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center'
              }}>
                Try searching with a different username or name
              </Text>
            </View>
          )}

          {/* Additional spacing for scroll */}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}