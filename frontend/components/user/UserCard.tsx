import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

const icon = require("../../assets/images/icon.png");

export interface UserCardProps {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isActive: boolean;
  onFollowPress?: (userId: number) => void;
  isFollowing?: boolean;
  showFollowButton?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  id,
  username,
  firstName,
  lastName,
  profileImageUrl,
  isActive,
  onFollowPress,
  isFollowing = false,
  showFollowButton = true
}) => {
  const displayName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : username;

  const handleUserPress = () => {
    // Navigate to user profile page (to be implemented later)
    console.log(`Navigate to user ${id} profile`);
  };

  const handleFollowPress = () => {
    if (onFollowPress) {
      onFollowPress(id);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleUserPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* User Avatar */}
      <View style={{ position: 'relative', marginRight: 12 }}>
        <Image
          source={profileImageUrl ? { uri: profileImageUrl } : icon}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25
          }}
        />
        {/* Active status indicator */}
        {isActive && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#00D4AA',
            borderWidth: 2,
            borderColor: '#0a0a0f'
          }} />
        )}
      </View>

      {/* User Info */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 2
        }}>
          {displayName}
        </Text>
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          @{username}
        </Text>
      </View>

      {/* Follow Button */}
      {showFollowButton && (
        <TouchableOpacity
          onPress={handleFollowPress}
          style={{
            backgroundColor: isFollowing ? 'rgba(255, 255, 255, 0.1)' : '#00D4AA',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: isFollowing ? 1 : 0,
            borderColor: isFollowing ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
          }}
        >
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: isFollowing ? '#ffffff' : '#000000'
          }}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default UserCard;