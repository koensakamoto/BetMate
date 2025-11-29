import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Animated } from 'react-native';
import { router } from 'expo-router';
import { haptic } from '../../utils/haptics';
import { Avatar } from '../common/Avatar';

export interface UserCardProps {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isActive: boolean;
  onFriendPress?: (userId: number) => void;
  isFriend?: boolean;
  friendRequestStatus?: 'none' | 'pending_sent' | 'pending_received' | 'friends';
  showFollowButton?: boolean;
  isLoading?: boolean;
}

function UserCard({
  id,
  username,
  firstName,
  lastName,
  profileImageUrl,
  isActive,
  onFriendPress,
  isFriend = false,
  friendRequestStatus = 'none',
  showFollowButton = true,
  isLoading = false
}: UserCardProps) {
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : username;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleUserPress = useCallback(() => {
    haptic.light(); // Light haptic on card press
    // Navigate to user profile page
    router.push(`/(app)/profile/${id}`);
  }, [id]);

  const handleFriendPress = useCallback(() => {
    if (onFriendPress) {
      onFriendPress(id);
    }
  }, [id, onFriendPress]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
      marginBottom: 12
    }}>
      <TouchableOpacity
        onPress={handleUserPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${displayName}, @${username}${isActive ? ', online' : ''}`}
        accessibilityHint="Double tap to view profile"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
      {/* User Avatar */}
      <View style={{ marginRight: 12 }}>
        <Avatar
          imageUrl={profileImageUrl}
          firstName={firstName}
          lastName={lastName}
          username={username}
          userId={id}
          customSize={50}
          showOnlineIndicator={true}
          isOnline={isActive}
        />
      </View>

      {/* User Info */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 2
        }} accessible={false}>
          {displayName}
        </Text>
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.6)'
        }} accessible={false}>
          @{username}
        </Text>
      </View>

      {/* Friend Button */}
      {showFollowButton && (
        <TouchableOpacity
          onPress={handleFriendPress}
          disabled={isLoading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isLoading ? 'Loading' :
            friendRequestStatus === 'friends' ? `Friends with ${displayName}` :
            friendRequestStatus === 'pending_sent' ? `Friend request pending to ${displayName}` :
            friendRequestStatus === 'pending_received' ? `Accept friend request from ${displayName}` :
            `Add ${displayName} as friend`
          }
          accessibilityState={{
            disabled: isLoading,
            busy: isLoading,
          }}
          accessibilityHint={
            isLoading ? undefined :
            friendRequestStatus === 'friends' ? 'Double tap to manage friendship' :
            friendRequestStatus === 'pending_sent' ? 'Double tap to cancel request' :
            friendRequestStatus === 'pending_received' ? 'Double tap to accept' :
            'Double tap to send friend request'
          }
          style={{
            backgroundColor:
              friendRequestStatus === 'friends' ? 'rgba(255, 255, 255, 0.1)' :
              friendRequestStatus === 'pending_sent' ? 'rgba(255, 255, 255, 0.1)' :
              friendRequestStatus === 'pending_received' ? '#00D4AA' :
              '#00D4AA',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth:
              friendRequestStatus === 'friends' || friendRequestStatus === 'pending_sent' ? 1 : 0,
            borderColor:
              friendRequestStatus === 'friends' || friendRequestStatus === 'pending_sent' ?
              'rgba(255, 255, 255, 0.3)' : 'transparent',
            opacity: isLoading ? 0.7 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 80
          }}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={friendRequestStatus === 'friends' || friendRequestStatus === 'pending_sent' ? '#ffffff' : '#000000'}
              accessible={false}
            />
          ) : (
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color:
                friendRequestStatus === 'friends' || friendRequestStatus === 'pending_sent' ?
                '#ffffff' : '#000000'
            }} accessible={false}>
              {friendRequestStatus === 'friends' ? 'Friends' :
               friendRequestStatus === 'pending_sent' ? 'Pending' :
               friendRequestStatus === 'pending_received' ? 'Accept' :
               'Add Friend'}
            </Text>
          )}
        </TouchableOpacity>
      )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(UserCard);