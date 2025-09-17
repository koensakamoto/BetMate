import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types/api';
import { friendshipService } from '../../services/user/friendshipService';

const icon = require("../../assets/images/icon.png");

export default function UserProfilePage() {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked'>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [friendsCount, setFriendsCount] = useState<number>(0);

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

      // Load their friends count - placeholder
      setFriendsCount(Math.floor(Math.random() * 500) + 10);
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
      const isFriend = friends.some(friend => friend.id === Number(userId));

      if (isFriend) {
        setFriendshipStatus('friends');
        return;
      }

      // Check if there's a pending request
      const sentRequests = await friendshipService.getPendingRequestsSent();
      const hasPendingRequest = sentRequests.some(request => request.user.id === Number(userId));

      if (hasPendingRequest) {
        setFriendshipStatus('pending_sent');
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
      setFriendshipStatus('pending_sent');
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

  const getActionButtonConfig = () => {
    switch (friendshipStatus) {
      case 'friends':
        return {
          text: 'Friends',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          textColor: '#ffffff',
          onPress: handleRemoveFriend
        };
      case 'pending_sent':
        return {
          text: 'Request Sent',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          textColor: 'rgba(255, 255, 255, 0.5)',
          onPress: () => {}
        };
      case 'none':
      default:
        return {
          text: 'Add Friend',
          backgroundColor: '#00D4AA',
          borderColor: '#00D4AA',
          textColor: '#000000',
          onPress: handleSendFriendRequest
        };
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username;

  const username = user.username;
  const actionButton = getActionButtonConfig();

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
        {/* Header with Back Button */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          paddingHorizontal: 20,
          marginBottom: 8,
          alignItems: 'center'
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
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
              name="arrow-back"
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {/* Profile Header - Same Layout as User's Own Profile */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          {/* Avatar & Basic Info */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <Image
                source={user.profileImageUrl ? { uri: user.profileImageUrl } : icon}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45
                }}
              />
              {/* Subtle ring indicator */}
              <View style={{
                position: 'absolute',
                inset: -3,
                borderRadius: 48,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }} />
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
              <View style={{ alignItems: 'center' }}>
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
              </View>

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
                  {formatNumber(Math.floor(Math.random() * 200) + 10)}
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
              Welcome to my profile! 🎯 Love making smart bets and connecting with friends.
            </Text>

            {/* Action Button - Replace Edit Profile with Friend Actions */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 16
            }}>
              <TouchableOpacity
                onPress={actionButton.onPress}
                disabled={isProcessing || friendshipStatus === 'pending_sent'}
                style={{
                  backgroundColor: actionButton.backgroundColor,
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                  borderRadius: 20,
                  borderWidth: 0.5,
                  borderColor: actionButton.borderColor,
                  flex: 1,
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={actionButton.textColor} />
                ) : (
                  <Text style={{
                    color: actionButton.textColor,
                    fontSize: 14,
                    fontWeight: '500',
                    letterSpacing: 0.2,
                    textAlign: 'center'
                  }}>
                    {actionButton.text}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Betting Statistics */}
        <View style={{ paddingHorizontal: 24, flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Betting Performance
          </Text>

          {/* Performance Overview Cards */}
          <View style={{
            flexDirection: 'row',
            marginBottom: 20,
            gap: 12
          }}>
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0, 212, 170, 0.1)',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 170, 0.2)'
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#00D4AA',
                marginBottom: 4
              }}>
                {Math.floor(Math.random() * 40 + 50)}%
              </Text>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Win Rate
              </Text>
            </View>

            <View style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              padding: 16,
              borderRadius: 12
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: 4
              }}>
                {formatNumber(Math.floor(Math.random() * 200) + 50)}
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
            marginBottom: 20,
            gap: 12
          }}>
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0, 212, 170, 0.05)',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#00D4AA',
                marginBottom: 4
              }}>
                {formatNumber(Math.floor(Math.random() * 120) + 30)}
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
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#EF4444',
                marginBottom: 4
              }}>
                {formatNumber(Math.floor(Math.random() * 80) + 20)}
              </Text>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Losses
              </Text>
            </View>
          </View>

          {/* Current Streak */}
          <View style={{
            backgroundColor: 'rgba(255, 184, 0, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 184, 0, 0.2)'
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                Current Streak
              </Text>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFB800'
              }}>
                {Math.floor(Math.random() * 8) + 1} {Math.random() > 0.5 ? 'W' : 'L'}
              </Text>
            </View>
          </View>

          {/* Recent Activity */}
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Recent Activity
          </Text>

          {[
            { result: 'win', game: 'Lakers vs Warriors', amount: '+$125', time: '2 hours ago' },
            { result: 'loss', game: 'Celtics vs Heat', amount: '-$75', time: '1 day ago' },
            { result: 'win', game: 'Bulls vs Nets', amount: '+$200', time: '3 days ago' }
          ].map((activity, index) => (
            <View key={index} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              borderLeftWidth: 3,
              borderLeftColor: activity.result === 'win' ? '#00D4AA' : '#EF4444'
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  {activity.game}
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: activity.result === 'win' ? '#00D4AA' : '#EF4444'
                }}>
                  {activity.amount}
                </Text>
              </View>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                {activity.time}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}