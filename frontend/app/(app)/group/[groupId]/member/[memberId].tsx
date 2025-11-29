import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { groupService, type GroupMemberResponse, type GroupDetailResponse } from '../../../../../services/group/groupService';
import { userService, type UserProfileResponse, type UserStatistics } from '../../../../../services/user/userService';
import { useAuth } from '../../../../../contexts/AuthContext';

export default function MemberProfile() {
  const { groupId, memberId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [member, setMember] = useState<GroupMemberResponse | null>(null);
  const [groupData, setGroupData] = useState<GroupDetailResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentUserRole = groupData?.userRole;
  const isOwner = user?.username === groupData?.ownerUsername;
  const canManageMembers = currentUserRole === 'ADMIN';

  useEffect(() => {
    fetchData();
  }, [groupId, memberId]);

  const fetchData = async () => {
    if (!groupId || !memberId) return;

    setIsLoading(true);
    try {
      const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
      const numericMemberId = Array.isArray(memberId) ? parseInt(memberId[0]) : parseInt(memberId as string);

      const [groupResponse, membersResponse, userProfileResponse, userStatsResponse] = await Promise.all([
        groupService.getGroupById(numericGroupId),
        groupService.getGroupMembers(numericGroupId),
        userService.getUserById(numericMemberId),
        userService.getUserStatistics(numericMemberId)
      ]);

      const targetMember = membersResponse.find(m => m.id === numericMemberId);

      if (!targetMember) {
        Alert.alert('Error', 'Member not found');
        router.back();
        return;
      }

      setGroupData(groupResponse);
      setMember(targetMember);
      setUserProfile(userProfileResponse);
      setUserStats(userStatsResponse);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load member data');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayName = (member: GroupMemberResponse): string => {
    return member.displayName || member.username;
  };

  const isOnline = (member: GroupMemberResponse): boolean => {
    if (!member.lastActivityAt) return false;
    const lastActivity = new Date(member.lastActivityAt);
    const now = new Date();
    const minutesDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    return minutesDiff <= 5;
  };

  const formatJoinDate = (dateString: string): string => {
    const joinDate = new Date(dateString);
    const now = new Date();

    if (joinDate.toDateString() === now.toDateString()) return 'today';

    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    let days = now.getDate() - joinDate.getDate();

    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;

    const totalDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays === 1) return 'yesterday';
    return `${totalDays} day${totalDays > 1 ? 's' : ''} ago`;
  };

  const formatLastActivity = (member: GroupMemberResponse): string => {
    if (isOnline(member)) return 'Online';
    if (!member.lastActivityAt) return 'Never';

    const lastActivity = new Date(member.lastActivityAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastActivity.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const handlePromoteToAdmin = async () => {
    if (!member) return;

    Alert.alert(
      'Promote to Admin',
      `Are you sure you want to promote ${getDisplayName(member)} to Admin? They will have full group permissions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
              await groupService.updateMemberRole(numericGroupId, member.id, 'ADMIN');
              setMember(prev => prev ? { ...prev, role: 'ADMIN' as const } : null);
              Alert.alert('Success', `${getDisplayName(member)} has been promoted to Admin`);
            } catch (error) {
              console.error('Error promoting member:', error);
              Alert.alert('Error', 'Failed to promote member. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleDemoteToMember = async () => {
    if (!member) return;

    Alert.alert(
      'Demote Admin',
      `Are you sure you want to demote ${getDisplayName(member)} to Member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
              await groupService.updateMemberRole(numericGroupId, member.id, 'MEMBER');
              setMember(prev => prev ? { ...prev, role: 'MEMBER' as const } : null);
              Alert.alert('Success', `${getDisplayName(member)} has been demoted to Member`);
            } catch (error) {
              console.error('Error demoting member:', error);
              Alert.alert('Error', 'Failed to demote member. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = async () => {
    if (!member) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${getDisplayName(member)} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
              await groupService.removeMember(numericGroupId, member.id);
              Alert.alert('Success', `${getDisplayName(member)} has been removed from the group`, [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialIcons name="person-off" size={48} color="rgba(255, 255, 255, 0.3)" />
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 16 }}>Member not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      {/* Fixed Header */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />

      <ScrollView
        style={{ flex: 1, marginTop: insets.top }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)'
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
              marginRight: 12
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>
              Member Profile
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Profile Hero Section */}
          <View style={{
            alignItems: 'center',
            paddingVertical: 24,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(255, 255, 255, 0.08)'
          }}>
            {/* Avatar */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isOnline(member) ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 14,
              position: 'relative',
              borderWidth: 2.5,
              borderColor: isOnline(member) ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.1)'
            }}>
              <Text style={{
                fontSize: 32,
                fontWeight: '700',
                color: isOnline(member) ? '#00D4AA' : '#ffffff'
              }}>
                {getDisplayName(member).charAt(0).toUpperCase()}
              </Text>

              {/* Online Indicator */}
              {isOnline(member) && (
                <View style={{
                  position: 'absolute',
                  bottom: 3,
                  right: 3,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#00D4AA',
                  borderWidth: 3,
                  borderColor: '#0a0a0f'
                }} />
              )}
            </View>

            {/* Name & Username */}
            <Text style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 3
            }}>
              {getDisplayName(member)}
            </Text>

            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 12
            }}>
              @{member.username}
            </Text>

            {/* Role Badge */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              {member.username === groupData?.ownerUsername ? (
                <>
                  <MaterialIcons
                    name="workspace-premium"
                    size={15}
                    color="#FF8C00"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#FF8C00',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase'
                  }}>
                    OWNER
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons
                    name={member.role === 'ADMIN' ? 'star' : 'person'}
                    size={15}
                    color={member.role === 'ADMIN' ? '#FFD700' : 'rgba(255, 255, 255, 0.5)'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: member.role === 'ADMIN' ? '#FFD700' : 'rgba(255, 255, 255, 0.6)',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase'
                  }}>
                    {member.role}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Group Performance */}
          <View style={{
            paddingVertical: 18
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.4)',
              marginBottom: 14,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              Group Performance
            </Text>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10
            }}>
              <View style={{
                flex: 1,
                minWidth: '48%',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 11,
                padding: 11
              }}>
                <Text style={{
                  fontSize: 21,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: 3
                }}>
                  {member.totalBets}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Bets
                </Text>
              </View>

              <View style={{
                flex: 1,
                minWidth: '48%',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 11,
                padding: 11
              }}>
                <Text style={{
                  fontSize: 21,
                  fontWeight: '700',
                  color: '#00D4AA',
                  marginBottom: 3
                }}>
                  {member.totalWins}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Wins
                </Text>
              </View>

              <View style={{
                flex: 1,
                minWidth: '48%',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 11,
                padding: 11
              }}>
                <Text style={{
                  fontSize: 21,
                  fontWeight: '700',
                  color: '#FF3B30',
                  marginBottom: 3
                }}>
                  {member.totalLosses}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Losses
                </Text>
              </View>

              <View style={{
                flex: 1,
                minWidth: '48%',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 11,
                padding: 11
              }}>
                <MaterialIcons name="event" size={14} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: 5 }} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  {formatJoinDate(member.joinedAt)}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Joined
                </Text>
              </View>
            </View>
          </View>

          {/* Management Actions */}
          {canManageMembers && member.id !== user?.id && (
            <View style={{
              paddingTop: 18,
              borderTopWidth: 0.5,
              borderTopColor: 'rgba(255, 255, 255, 0.08)'
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: 13,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Management
              </Text>

              {/* Promote to Admin Button (for MEMBER role) */}
              {member.role === 'MEMBER' && (
                <TouchableOpacity
                  onPress={handlePromoteToAdmin}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderWidth: 0.5,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 11,
                    padding: 13,
                    marginBottom: 9,
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <MaterialIcons name="workspace-premium" size={16} color="#FFD700" style={{ marginRight: 7 }} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#ffffff',
                      flex: 1
                    }}>
                      Promote to Admin
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginLeft: 23
                  }}>
                    Grant full admin permissions
                  </Text>
                </TouchableOpacity>
              )}

              {/* Demote to Member Button (Owner only, for ADMIN role) */}
              {member.role === 'ADMIN' && isOwner && (
                <TouchableOpacity
                  onPress={handleDemoteToMember}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderWidth: 0.5,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 11,
                    padding: 13,
                    marginBottom: 9,
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <MaterialIcons name="trending-down" size={16} color="#FFA500" style={{ marginRight: 7 }} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#ffffff',
                      flex: 1
                    }}>
                      Demote to Member
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginLeft: 23
                  }}>
                    Remove admin permissions
                  </Text>
                </TouchableOpacity>
              )}

              {/* Remove Button - Admins can remove members, only owner can remove admins */}
              {(member.role === 'MEMBER' || (member.role === 'ADMIN' && isOwner)) && (
                <TouchableOpacity
                  onPress={handleRemoveMember}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: 'rgba(255, 59, 48, 0.05)',
                    borderWidth: 0.5,
                    borderColor: 'rgba(255, 59, 48, 0.15)',
                    borderRadius: 11,
                    padding: 13,
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <MaterialIcons name="person-remove" size={16} color="#FF3B30" style={{ marginRight: 7 }} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#FF3B30',
                      flex: 1
                    }}>
                      Remove from Group
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginLeft: 23
                  }}>
                    Permanently remove member
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
