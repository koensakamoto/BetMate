import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, Alert, TextInput, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { friendshipService, FriendDto } from '../../services/friendship/friendshipService';
import { debugLog, errorLog } from '../../config/env';
import { getErrorMessage } from '../../utils/errorUtils';
import { getDisplayName } from '../../utils/memberUtils';
import { Avatar } from '../../components/common/Avatar';
import { SkeletonUserCard } from '../../components/common/SkeletonCard';

export default function FriendsList() {
  const insets = useSafeAreaInsets();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadFriends();
      } else {
        router.replace('/auth/login');
      }
    }
  }, [authLoading, isAuthenticated]);

  const loadFriends = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const friendsList = await friendshipService.getFriends();
      setFriends(friendsList);
      debugLog('Friends loaded:', friendsList);

    } catch (err) {
      errorLog('Failed to load friends:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadFriends(true);
  };

  const handleViewProfile = (friend: FriendDto) => {
    router.push(`/(app)/profile/${friend.id}`);
  };

  const handleRemoveFriend = async (friend: FriendDto) => {
    // Create display name with fallback to username
    const displayName = friend.firstName && friend.lastName
      ? `${friend.firstName} ${friend.lastName}`
      : friend.username;

    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendshipService.removeFriend(friend.id);
              setFriends(prev => prev.filter(f => f.id !== friend.id));
              // No success alert - the friend disappearing from the list is enough feedback
            } catch (error) {
              errorLog('Failed to remove friend:', error);
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Only show full loading state for auth, not for friends list loading
  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show skeleton loading state while friends are loading
  const showSkeletons = isLoading && friends.length === 0;

  if (error && friends.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 18, textAlign: 'center' }}>Failed to load friends</Text>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 8, fontSize: 14, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={() => loadFriends()}
          style={{
            backgroundColor: '#00D4AA',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 20
          }}
        >
          <Text style={{ color: '#000000', fontWeight: '600', fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }}
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
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginBottom: 20
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: -0.5
            }}>
              Friends
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: 2
            }}>
              {showSkeletons ? 'Loading...' : `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'}`}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10
          }}>
            <MaterialIcons
              name="search"
              size={20}
              color="rgba(255, 255, 255, 0.3)"
              style={{ marginRight: 10 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search friends..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              style={{
                flex: 1,
                fontSize: 15,
                color: '#ffffff',
                padding: 0
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons
                  name="close"
                  size={18}
                  color="rgba(255, 255, 255, 0.3)"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Friends List */}
        <View style={{ paddingHorizontal: 20 }}>
          {showSkeletons ? (
            /* Show skeleton cards while loading */
            <View>
              <SkeletonUserCard />
              <SkeletonUserCard />
              <SkeletonUserCard />
              <SkeletonUserCard />
            </View>
          ) : filteredFriends.length === 0 ? (
            <View style={{
              alignItems: 'center',
              paddingVertical: 60
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <MaterialIcons
                  name={friends.length === 0 ? "people-outline" : "search-off"}
                  size={40}
                  color="rgba(255, 255, 255, 0.2)"
                />
              </View>
              <Text style={{
                fontSize: 18,
                color: '#ffffff',
                textAlign: 'center',
                fontWeight: '600',
                marginBottom: 8
              }}>
                {friends.length === 0 ? 'No friends yet' : 'No friends found'}
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
                marginBottom: 24,
                paddingHorizontal: 40
              }}>
                {friends.length === 0
                  ? 'Start adding friends to build your network'
                  : 'Try searching with a different name'}
              </Text>

              {friends.length === 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/(app)/find-friends')}
                  style={{
                    backgroundColor: '#00D4AA',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <MaterialIcons name="person-add" size={18} color="#000000" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#000000', fontWeight: '600', fontSize: 15 }}>Find Friends</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredFriends.map((friend, index) => (
              <TouchableOpacity
                key={friend.id}
                onPress={() => handleViewProfile(friend)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                {/* Avatar */}
                <View style={{ marginRight: 12 }}>
                  <Avatar
                    imageUrl={friend.profileImageUrl}
                    firstName={friend.firstName}
                    lastName={friend.lastName}
                    username={friend.username}
                    userId={friend.id}
                    customSize={52}
                  />
                </View>

                {/* Friend Info */}
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: 2,
                    letterSpacing: -0.2
                  }}>
                    {getDisplayName(friend)}
                  </Text>

                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    @{friend.username}
                  </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveFriend(friend);
                  }}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: '500'
                  }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
