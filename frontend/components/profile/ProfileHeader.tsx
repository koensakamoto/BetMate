import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from '../common/Avatar';

interface ProfileHeaderProps {
  userId?: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isVerified?: boolean;
  onActionPress: () => void;
  actionText: string;
  actionIcon: string;
  actionStyle: 'primary' | 'secondary' | 'disabled';
  isLoading?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userId,
  username,
  firstName,
  lastName,
  profileImageUrl,
  isVerified = false,
  onActionPress,
  actionText,
  actionIcon,
  actionStyle,
  isLoading = false
}) => {
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : undefined;

  const getActionButtonStyle = () => {
    switch (actionStyle) {
      case 'primary':
        return {
          backgroundColor: '#00D4AA',
          borderColor: 'transparent',
          textColor: '#000000'
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          textColor: '#ffffff'
        };
      case 'disabled':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          textColor: 'rgba(255, 255, 255, 0.6)'
        };
      default:
        return {
          backgroundColor: '#00D4AA',
          borderColor: 'transparent',
          textColor: '#000000'
        };
    }
  };

  const buttonStyle = getActionButtonStyle();

  return (
    <View>
      {/* Cover Photo Area */}
      <View style={{
        height: 160,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Gradient Overlay */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 212, 170, 0.05)'
        }} />

        {/* Decorative Elements */}
        <View style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          opacity: 0.5
        }} />
        <View style={{
          position: 'absolute',
          bottom: 30,
          left: 30,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          opacity: 0.3
        }} />
      </View>

      {/* Profile Content */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 0,
        paddingBottom: 24,
        marginTop: -60
      }}>
        {/* Profile Picture */}
        <View style={{
          alignItems: 'center',
          marginBottom: 16
        }}>
          <View style={{
            position: 'relative',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8
          }}>
            <Avatar
              imageUrl={profileImageUrl}
              firstName={firstName}
              lastName={lastName}
              username={username}
              userId={userId}
              size="xl"
              showBorder
              borderColor="#0a0a0f"
            />

            {/* Verification Badge */}
            {isVerified && (
              <View style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#00D4AA',
                borderWidth: 2,
                borderColor: '#0a0a0f',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <MaterialIcons name="verified" size={14} color="#000000" />
              </View>
            )}
          </View>
        </View>

        {/* User Info */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{
            fontSize: 28,
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: 4,
            textAlign: 'center'
          }}>
            {username}
          </Text>

          {displayName && (
            <Text style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {displayName}
            </Text>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={onActionPress}
          disabled={isLoading || actionStyle === 'disabled'}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? `${actionText}, loading` : actionText}
          accessibilityHint={actionStyle === 'disabled' ? undefined : `Double tap to ${actionText.toLowerCase()}`}
          accessibilityState={{
            disabled: isLoading || actionStyle === 'disabled',
            busy: isLoading,
          }}
          style={{
            backgroundColor: buttonStyle.backgroundColor,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 32,
            opacity: isLoading ? 0.7 : 1,
            borderWidth: actionStyle === 'secondary' ? 1 : 0,
            borderColor: buttonStyle.borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: actionStyle === 'primary' ? '#00D4AA' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: actionStyle === 'primary' ? 4 : 0
          }}
        >
          <MaterialIcons
            name={actionIcon as any}
            size={18}
            color={buttonStyle.textColor}
            style={{ marginRight: 8 }}
            accessible={false}
          />
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: buttonStyle.textColor
          }} accessible={false}>
            {actionText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileHeader;