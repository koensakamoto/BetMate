import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { groupService, GroupDetailResponse, InviteValidationResponse } from '../../../../services/group/groupService';
import { useAuth } from '../../../../contexts/AuthContext';
import { getFullImageUrl, getAvatarColor, getAvatarColorWithOpacity, getGroupInitials } from '../../../../utils/avatarUtils';

export default function GroupPreview() {
  const insets = useSafeAreaInsets();
  const { groupId, token } = useLocalSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [groupData, setGroupData] = useState<GroupDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [tokenValidation, setTokenValidation] = useState<InviteValidationResponse | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);

  // Extract and validate token
  useEffect(() => {
    const rawToken = Array.isArray(token) ? token[0] : token;
    if (rawToken) {
      setInviteToken(rawToken as string);
      validateToken(rawToken as string);
    }
  }, [token]);

  const validateToken = async (tokenToValidate: string) => {
    setIsValidatingToken(true);
    try {
      const result = await groupService.validateInviteToken(tokenToValidate);
      setTokenValidation(result);
    } catch (error) {
      setTokenValidation({ valid: false, reason: 'INVALID' });
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!isAuthenticated || authLoading || !groupId) return;

      try {
        setIsLoading(true);
        const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
        const data = await groupService.getGroupById(numericGroupId);

        setGroupData(data);

        // Set pending request state based on membership status from backend
        const isPending = data.userMembershipStatus === 'PENDING';
        setHasPendingRequest(isPending);
      } catch (error) {
        // Error handled silently
        Alert.alert('Error', 'Failed to load group information.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, isAuthenticated, authLoading]);

  // Check if user has a valid invite (can join private groups directly)
  const hasValidInvite = inviteToken && tokenValidation?.valid;

  const handleJoinGroup = async () => {
    if (!groupData) return;

    try {
      setIsJoining(true);

      // If we have a valid invite token, use it to join directly
      if (hasValidInvite && inviteToken) {
        const response = await groupService.acceptInviteToken(inviteToken);
        Alert.alert(
          'Joined Successfully!',
          `Welcome to ${groupData.groupName}`,
          [
            {
              text: 'Go to Group',
              onPress: () => router.replace(`/group/${groupData.id}`)
            }
          ]
        );
        return;
      }

      // Otherwise use normal join flow
      const response = await groupService.joinGroup(groupData.id);

      if (response.status === 'PENDING') {
        setHasPendingRequest(true);
        Alert.alert(
          'Request Sent',
          response.message,
          [
            {
              text: 'OK'
            }
          ]
        );
      } else {
        // APPROVED - user joined immediately
        Alert.alert(
          'Joined Successfully!',
          `Welcome to ${groupData.groupName}`,
          [
            {
              text: 'Go to Group',
              onPress: () => router.replace(`/group/${groupData.id}`)
            }
          ]
        );
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to join group. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  // Get the appropriate message for invalid tokens
  const getTokenErrorMessage = () => {
    if (!tokenValidation || tokenValidation.valid) return null;

    switch (tokenValidation.reason) {
      case 'EXPIRED':
        return 'This invite link has expired.';
      case 'MAX_USES_REACHED':
        return 'This invite link is no longer available.';
      case 'REVOKED':
        return 'This invite link has been revoked.';
      default:
        return 'Invalid invite link.';
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (isLoading || !groupData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        {/* Loading state */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ color: '#ffffff', fontSize: 16 }}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}
          >
            <MaterialIcons name="arrow-back" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Group Image & Basic Info */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <View style={{
            alignItems: 'center',
            marginBottom: 24
          }}>
            {/* Group Image */}
            {getFullImageUrl(groupData.groupPictureUrl) ? (
              <Image
                source={{ uri: getFullImageUrl(groupData.groupPictureUrl)! }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 24,
                  marginBottom: 16
                }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 24,
                backgroundColor: getAvatarColorWithOpacity(groupData.id, 0.2),
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Text style={{
                  fontSize: 48,
                  fontWeight: '700',
                  color: getAvatarColor(groupData.id)
                }}>
                  {getGroupInitials(groupData.groupName)}
                </Text>
              </View>
            )}

            {/* Group Name */}
            <Text style={{
              fontSize: 28,
              fontWeight: '700',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 8
            }}>
              {groupData.groupName}
            </Text>

          </View>

          {/* Description */}
          {groupData.description && (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 24,
                textAlign: 'center'
              }}>
                {groupData.description}
              </Text>
            </View>
          )}

          {/* Group Stats */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 32,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Group Activity
            </Text>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around'
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {groupData.totalMessages || 0}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '500'
                }}>
                  Messages
                </Text>
              </View>

              <View style={{
                width: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                marginHorizontal: 20
              }} />

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {groupData.memberCount}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '500'
                }}>
                  {groupData.memberCount === 1 ? 'Member' : 'Members'}
                </Text>
              </View>

              <View style={{
                width: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                marginHorizontal: 20
              }} />

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 4
                }}>
                  {groupData.privacy === 'PUBLIC' ? 'Open' : 'Private'}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '500'
                }}>
                  Privacy
                </Text>
              </View>
            </View>
          </View>

          {/* Invite Banner - show when user has valid invite */}
          {hasValidInvite && (
            <View style={{
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 170, 0.3)',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <MaterialIcons name="celebration" size={24} color="#00D4AA" style={{ marginRight: 12 }} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#00D4AA',
                flex: 1
              }}>
                You&apos;ve been invited!
              </Text>
            </View>
          )}

          {/* Invalid Token Warning - show when token is invalid */}
          {inviteToken && tokenValidation && !tokenValidation.valid && (
            <View style={{
              backgroundColor: 'rgba(255, 107, 107, 0.15)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 107, 0.3)',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <MaterialIcons name="error-outline" size={24} color="#ff6b6b" style={{ marginRight: 12 }} />
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#ff6b6b',
                flex: 1
              }}>
                {getTokenErrorMessage()}
              </Text>
            </View>
          )}

          {/* Join Button */}
          <TouchableOpacity
            onPress={handleJoinGroup}
            disabled={isJoining || hasPendingRequest || isValidatingToken}
            style={{
              backgroundColor: hasPendingRequest ? 'rgba(0, 212, 170, 0.3)' : '#00D4AA',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              alignItems: 'center',
              opacity: (isJoining || hasPendingRequest || isValidatingToken) ? 0.7 : 1
            }}
          >
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: hasPendingRequest ? 'rgba(10, 10, 15, 0.7)' : '#0a0a0f'
            }}>
              {hasPendingRequest
                ? 'Request Pending'
                : isJoining
                  ? 'Joining...'
                  : isValidatingToken
                    ? 'Validating invite...'
                    : hasValidInvite
                      ? 'Join Group'
                      : (groupData.privacy === 'PRIVATE' ? 'Request to Join' : 'Join Group')}
            </Text>
          </TouchableOpacity>

          {/* Info Note */}
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            marginTop: 16,
            lineHeight: 20
          }}>
            {hasPendingRequest
              ? 'Your join request is pending approval from group admins. You will be notified once your request is reviewed.'
              : hasValidInvite
                ? 'You have a valid invite! Click the button above to join this group.'
                : groupData.privacy === 'PRIVATE'
                  ? 'This is a private group. Your request will be reviewed by group admins.'
                  : 'Join this group to participate in bets, chat with members, and access exclusive content.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}