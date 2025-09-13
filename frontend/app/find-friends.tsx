import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UserCard from '../components/user/UserCard';
import { userService, UserSearchResult } from '../services/user/userService';
import { debugLog, errorLog } from '../config/env';

export default function FindFriends() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());

  // Handle search with debouncing
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length > 0) {
        setIsLoading(true);
        try {
          const results = await userService.searchUsers(searchQuery.trim());
          setSearchResults(results);
          debugLog('User search results:', results);
        } catch (error) {
          errorLog('Error searching users:', error);
          setSearchResults([]);
          Alert.alert('Error', 'Failed to search users. Please try again.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleFollowPress = async (userId: number) => {
    try {
      // TODO: Implement follow/unfollow API calls when backend is ready
      const isCurrentlyFollowing = followingUsers.has(userId);
      
      if (isCurrentlyFollowing) {
        // Unfollow user
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        debugLog(`Unfollowed user ${userId}`);
      } else {
        // Follow user
        setFollowingUsers(prev => new Set(prev).add(userId));
        debugLog(`Followed user ${userId}`);
      }
    } catch (error) {
      errorLog('Error toggling follow status:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
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
                  onFollowPress={handleFollowPress}
                  isFollowing={followingUsers.has(user.id)}
                  showFollowButton={true}
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