import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PendingRequestResponse } from '../../services/group/groupService';
import { Avatar } from '../common/Avatar';

interface PendingRequestCardProps {
  request: PendingRequestResponse;
  onApprove: (requestId: number) => Promise<void>;
  onDeny: (requestId: number) => Promise<void>;
}

const PendingRequestCard: React.FC<PendingRequestCardProps> = ({ request, onApprove, onDeny }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(request.requestId);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeny = async () => {
    Alert.alert(
      'Deny Request',
      `Are you sure you want to deny ${request.displayName || request.username}'s request to join?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: async () => {
            setIsDenying(true);
            try {
              await onDeny(request.requestId);
            } catch (error) {
              Alert.alert('Error', 'Failed to deny request. Please try again.');
            } finally {
              setIsDenying(false);
            }
          }
        }
      ]
    );
  };

  const formatRequestTime = (dateString: string): string => {
    const requestDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - requestDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const displayName = request.displayName || request.username;
  const isProcessing = isApproving || isDenying;

  return (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 10,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center'
    }}>
      {/* Avatar */}
      <View style={{ marginRight: 12 }}>
        <Avatar
          imageUrl={request.profilePictureUrl}
          firstName={request.displayName?.split(' ')[0]}
          lastName={request.displayName?.split(' ').slice(1).join(' ')}
          username={request.username}
          userId={request.userId}
          customSize={44}
        />
      </View>

      {/* User Info */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: 2
        }}>
          {displayName}
        </Text>
        <Text style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: 1
        }}>
          @{request.username}
        </Text>
        <Text style={{
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          Requested {formatRequestTime(request.requestedAt)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8
      }}>
        {/* Deny Button */}
        <TouchableOpacity
          onPress={handleDeny}
          disabled={isProcessing}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: isProcessing ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isProcessing ? 0.5 : 1
          }}
        >
          {isDenying ? (
            <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.5)" />
          ) : (
            <MaterialIcons name="close" size={18} color="rgba(255, 70, 70, 0.9)" />
          )}
        </TouchableOpacity>

        {/* Approve Button */}
        <TouchableOpacity
          onPress={handleApprove}
          disabled={isProcessing}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: isProcessing ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 212, 170, 0.15)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isProcessing ? 0.5 : 1
          }}
        >
          {isApproving ? (
            <ActivityIndicator size="small" color="rgba(0, 212, 170, 0.8)" />
          ) : (
            <MaterialIcons name="check" size={18} color="#00D4AA" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PendingRequestCard;
