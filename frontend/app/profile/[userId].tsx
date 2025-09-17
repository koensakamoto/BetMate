import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types/api';
import { friendshipService } from '../../services/user/friendshipService';

export default function UserProfilePage() {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friends' | 'blocked'>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      checkFriendshipStatus();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Note: You'll need to implement this API call
      // const response = await userService.getUserProfile(Number(userId));
      // setUser(response);

      // Placeholder user data - replace with actual API call
      setUser({
        id: Number(userId),
        username: `User${userId}`,
        email: `user${userId}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        profileImageUrl: undefined,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      setError('Failed to load user profile');
      console.error('Error loading user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      // Check if already friends
      const friends = await friendshipService.getFriends();
      const isFriend = friends.some(friend => friend.user.id === Number(userId));

      if (isFriend) {
        setFriendshipStatus('friends');
        return;
      }

      // Check if there's a pending request
      const sentRequests = await friendshipService.getPendingRequestsSent();
      const hasPendingRequest = sentRequests.some(request => request.user.id === Number(userId));

      if (hasPendingRequest) {
        setFriendshipStatus('pending');
      } else {
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error('Error checking friendship status:', err);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!userId) return;

    setIsProcessing(true);
    try {
      await friendshipService.sendFriendRequest(Number(userId));
      setFriendshipStatus('pending');
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      Alert.alert('Error', 'Failed to send friend request');
      console.error('Error sending friend request:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!userId) return;

    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // You'll need to implement this API call
              // await friendshipService.removeFriend(Number(userId));
              setFriendshipStatus('none');
              Alert.alert('Success', 'Friend removed');
            } catch (err) {
              Alert.alert('Error', 'Failed to remove friend');
              console.error('Error removing friend:', err);
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const renderActionButton = () => {
    switch (friendshipStatus) {
      case 'friends':
        return (
          <TouchableOpacity
            onPress={handleRemoveFriend}
            disabled={isProcessing}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 24,
              opacity: isProcessing ? 0.7 : 1,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="person-remove" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                  Remove Friend
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );

      case 'pending':
        return (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="schedule" size={16} color="rgba(255, 255, 255, 0.6)" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)' }}>
                Request Sent
              </Text>
            </View>
          </View>
        );

      case 'none':
      default:
        return (
          <TouchableOpacity
            onPress={handleSendFriendRequest}
            disabled={isProcessing}
            style={{
              backgroundColor: '#00D4AA',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 24,
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="person-add" size={16} color="#000000" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }}>
                  Add Friend
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.6)', marginTop: 16 }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialIcons name="error-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
        <Text style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.8)', marginTop: 16, textAlign: 'center' }}>
          {error || 'User not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: '#00D4AA',
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 24,
            marginTop: 24
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 20,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            <MaterialIcons name="arrow-back" size={18} color="#ffffff" />
          </TouchableOpacity>

          <Text style={{
            fontSize: 24,
            fontWeight: '600',
            color: '#ffffff',
            flex: 1
          }}>
            Profile
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 32, alignItems: 'center' }}>
          {/* Profile Picture */}
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <MaterialIcons name="person" size={48} color="rgba(255, 255, 255, 0.6)" />
          </View>

          {/* Username */}
          <Text style={{
            fontSize: 24,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 8
          }}>
            {user.username}
          </Text>

          {/* Full Name */}
          {(user.firstName || user.lastName) && (
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 16
            }}>
              {[user.firstName, user.lastName].filter(Boolean).join(' ')}
            </Text>
          )}

          {/* Action Button */}
          {renderActionButton()}
        </View>

        {/* Profile Details */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            About
          </Text>

          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 16
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialIcons name="email" size={20} color="rgba(255, 255, 255, 0.6)" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
                {user.email}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="schedule" size={20} color="rgba(255, 255, 255, 0.6)" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}