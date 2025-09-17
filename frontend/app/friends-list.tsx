import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { friendshipService, FriendDto } from '../services/friendship/friendshipService';
import { debugLog, errorLog } from '../config/env';

const icon = require("../assets/images/icon.png");

// Use FriendDto from service instead of local interface

export default function FriendsList() {
  const insets = useSafeAreaInsets();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadFriends();
      } else {
        router.replace('/auth/login');
      }
    }
  }, [authLoading, isAuthenticated]);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const friendsList = await friendshipService.getFriends();
      setFriends(friendsList);
      debugLog('Friends loaded:', friendsList);

    } catch (err: any) {
      errorLog('Failed to load friends:', err);

      // If API fails but user has at least 1 friend (from friends count), show a message
      // In production, this would be handled by proper error recovery
      if (err.status === 500) {
        setError('Unable to load friends list. Please try again later.');

        // Optionally show mock data for development
        const mockFriends: FriendDto[] = [
          {
            id: 1,
            username: 'friend_user',
            firstName: 'Friend',
            lastName: 'User',
            isActive: true,
            bio: 'Your connected friend',
            isOnline: true
          }
        ];
        setFriends(mockFriends);
      } else {
        setError(err.message || 'Failed to load friends');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = (friend: FriendDto) => {
    // TODO: Navigate to user profile with user ID
    Alert.alert(
      'View Profile',
      `Navigate to ${friend.firstName} ${friend.lastName}'s profile`,
      [{ text: 'OK' }]
    );
  };

  const handleRemoveFriend = async (friend: FriendDto) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.firstName} ${friend.lastName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendshipService.removeFriend(friend.id);
              setFriends(prev => prev.filter(f => f.id !== friend.id));
              Alert.alert('Friend Removed', `${friend.firstName} ${friend.lastName} has been removed from your friends.`);
            } catch (error: any) {
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

  const getDisplayName = (friend: FriendDto): string => {
    return friend.firstName && friend.lastName
      ? `${friend.firstName} ${friend.lastName}`
      : friend.username;
  };


  if (authLoading || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 16 }}>
          Loading friends...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 18, textAlign: 'center' }}>Failed to load friends</Text>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 8, fontSize: 14, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={loadFriends}
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
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginBottom: 24
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
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
              marginBottom: 4
            }}>
              Friends
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </Text>
          </View>
        </View>

        {/* Friends List */}
        <View style={{ paddingHorizontal: 20 }}>
          {filteredFriends.length === 0 ? (
            <View style={{
              alignItems: 'center',
              paddingVertical: 60
            }}>
              <MaterialIcons name="people-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
              <Text style={{
                fontSize: 18,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                fontWeight: '500',
                marginTop: 16
              }}>
                {friends.length === 0 ? 'No friends yet' : 'No friends found'}
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
                marginTop: 8
              }}>
                {friends.length === 0 ? 'Start adding friends to see them here' : 'Try adjusting your search'}
              </Text>

              {friends.length === 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/find-friends')}
                  style={{
                    backgroundColor: '#00D4AA',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 20,
                    marginTop: 20
                  }}
                >
                  <Text style={{ color: '#000000', fontWeight: '600', fontSize: 16 }}>Find Friends</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredFriends.map((friend) => (
              <TouchableOpacity
                key={friend.id}
                onPress={() => handleViewProfile(friend)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                {/* Avatar */}
                <View style={{ marginRight: 16 }}>
                  <Image
                    source={icon}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25
                    }}
                  />
                </View>

                {/* Friend Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: 2
                  }}>
                    {getDisplayName(friend)}
                  </Text>

                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: 4
                  }}>
                    @{friend.username}
                  </Text>

                  {friend.bio && (
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)'
                    }} numberOfLines={1}>
                      {friend.bio}
                    </Text>
                  )}
                </View>

                {/* Actions */}
                <TouchableOpacity
                  onPress={() => handleRemoveFriend(friend)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    marginLeft: 12
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.6)',
                    letterSpacing: 0.3
                  }}>
                    Unfollow
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