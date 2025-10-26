import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { groupService, type GroupMemberResponse, type GroupDetailResponse } from '../../../../services/group/groupService';
import { useAuth } from '../../../../contexts/AuthContext';

export default function ManageMember() {
  const { groupId, memberId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [member, setMember] = useState<GroupMemberResponse | null>(null);
  const [groupData, setGroupData] = useState<GroupDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get current user's role from proper backend response
  const currentUserRole = groupData?.userRole;
  const canManageMembers = currentUserRole === 'ADMIN' || currentUserRole === 'OFFICER';
  const isUserMember = groupData?.isUserMember || false;

  // Debug logging
  console.log('🔍 [ManageMember] Permission Debug:', {
    currentUserRole,
    canManageMembers,
    isUserMember,
    userId: user?.id,
    memberId: member?.id,
    groupDataUserRole: groupData?.userRole,
    groupDataIsUserMember: groupData?.isUserMember
  });

  useEffect(() => {
    fetchData();
  }, [groupId, memberId]);

  const fetchData = async () => {
    if (!groupId || !memberId) return;

    setIsLoading(true);
    try {
      const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
      const numericMemberId = Array.isArray(memberId) ? parseInt(memberId[0]) : parseInt(memberId as string);

      // Fetch group data and members to find the specific member
      const [groupResponse, membersResponse] = await Promise.all([
        groupService.getGroupById(numericGroupId),
        groupService.getGroupMembers(numericGroupId)
      ]);

      const targetMember = membersResponse.find(m => m.id === numericMemberId);

      if (!targetMember) {
        Alert.alert('Error', 'Member not found');
        router.back();
        return;
      }

      setGroupData(groupResponse);
      setMember(targetMember);
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

    // Check if same day
    if (joinDate.toDateString() === now.toDateString()) return 'today';

    // Calculate year, month, and day differences
    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    let days = now.getDate() - joinDate.getDate();

    // Adjust for negative months or days
    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    // Return formatted string based on time difference
    if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;

    // For days, calculate total days difference
    const totalDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays === 1) return 'yesterday';
    return `${totalDays} day${totalDays > 1 ? 's' : ''} ago`;
  };

  const formatLastActivity = (member: GroupMemberResponse): string => {
    if (isOnline(member)) return 'Online';
    if (!member.lastActivityAt) return 'Never';

    const lastActivity = new Date(member.lastActivityAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const canPromote = (member: GroupMemberResponse): boolean => {
    // Can't promote yourself
    if (member.id === user?.id) return false;

    if (currentUserRole === 'ADMIN') {
      // Admin can promote MEMBER to OFFICER
      return member.role === 'MEMBER';
    } else if (currentUserRole === 'OFFICER') {
      // Officer can promote MEMBER to OFFICER
      return member.role === 'MEMBER';
    }
    return false;
  };

  const canDemote = (member: GroupMemberResponse): boolean => {
    // Can't demote yourself
    if (member.id === user?.id) return false;

    if (currentUserRole === 'ADMIN') {
      // Admin can demote OFFICER to MEMBER
      return member.role === 'OFFICER';
    }
    // Officers cannot demote other officers
    return false;
  };

  const canRemove = (member: GroupMemberResponse): boolean => {
    // Can't remove yourself
    if (member.id === user?.id) return false;

    if (currentUserRole === 'ADMIN') {
      // Admin can remove anyone except themselves
      return true;
    } else if (currentUserRole === 'OFFICER') {
      // Officer can only remove regular members
      return member.role === 'MEMBER';
    }
    return false;
  };

  const handlePromoteToOfficer = async () => {
    if (!member) return;

    Alert.alert(
      'Promote Member',
      `Are you sure you want to promote ${getDisplayName(member)} to Officer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
              await groupService.updateMemberRole(numericGroupId, member.id, 'OFFICER');

              // Update local state
              setMember(prev => prev ? { ...prev, role: 'OFFICER' } : null);

              Alert.alert('Success', `${getDisplayName(member)} has been promoted to Officer`);
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
      'Demote Officer',
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

              // Update local state
              setMember(prev => prev ? { ...prev, role: 'MEMBER' } : null);

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
      <View style={{
        flex: 1,
        backgroundColor: '#0a0a0f',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading...</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#0a0a0f',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Member not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20
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
            <MaterialIcons name="arrow-back" size={18} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#ffffff'
            }}>
              Manage Member
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 2
            }}>
              {getDisplayName(member)}
            </Text>
          </View>
        </View>
      </View>

      {/* Member Profile Card */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24
        }}>
          {/* Avatar and Basic Info */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isOnline(member) ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.12)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
              position: 'relative'
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: isOnline(member) ? '#00D4AA' : '#ffffff'
              }}>
                {getDisplayName(member).charAt(0).toUpperCase()}
              </Text>

              {/* Online Indicator */}
              {isOnline(member) && (
                <View style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#00D4AA',
                  borderWidth: 3,
                  borderColor: '#0a0a0f'
                }} />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4
              }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginRight: 12
                }}>
                  {getDisplayName(member)}
                </Text>

                {(member.role === 'ADMIN' || member.role === 'OFFICER') && (
                  <View style={{
                    backgroundColor: member.role === 'ADMIN' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 212, 170, 0.2)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: member.role === 'ADMIN' ? '#FFD700' : '#00D4AA'
                    }}>
                      {member.role}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: 2
              }}>
                @{member.username}
              </Text>

              <Text style={{
                fontSize: 12,
                color: isOnline(member) ? '#00D4AA' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: isOnline(member) ? '600' : '400'
              }}>
                {formatLastActivity(member)}
              </Text>
            </View>
          </View>

          {/* Member Stats */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingTop: 16,
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: 2
              }}>
                {member.totalBets}
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Total Bets
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#00D4AA',
                marginBottom: 2
              }}>
                {member.totalWins}
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Wins
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FF3B30',
                marginBottom: 2
              }}>
                {member.totalLosses}
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Losses
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: 2
              }}>
                {formatJoinDate(member.joinedAt)}
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Joined
              </Text>
            </View>
          </View>
        </View>

        {/* Management Actions */}
        {canManageMembers && member.id !== user?.id && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 16
            }}>
              Management Actions
            </Text>

            <View style={{ gap: 12 }}>
              {/* Promote/Demote Button */}
              {member.role === 'MEMBER' ? (
                <TouchableOpacity
                  onPress={handlePromoteToOfficer}
                  disabled={isUpdating}
                  style={{
                    backgroundColor: 'rgba(0, 212, 170, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(0, 212, 170, 0.3)',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <MaterialIcons name="trending-up" size={20} color="#00D4AA" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#00D4AA',
                      marginBottom: 2
                    }}>
                      Promote to Officer
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(0, 212, 170, 0.8)'
                    }}>
                      Grant officer permissions
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#00D4AA" />
                </TouchableOpacity>
              ) : member.role === 'OFFICER' && currentUserRole === 'ADMIN' ? (
                <TouchableOpacity
                  onPress={handleDemoteToMember}
                  disabled={isUpdating}
                  style={{
                    backgroundColor: 'rgba(255, 165, 0, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 165, 0, 0.3)',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <MaterialIcons name="trending-down" size={20} color="#FFA500" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#FFA500',
                      marginBottom: 2
                    }}>
                      Demote to Member
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 165, 0, 0.8)'
                    }}>
                      Remove officer permissions
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#FFA500" />
                </TouchableOpacity>
              ) : null}

              {/* Remove Button */}
              {((currentUserRole === 'ADMIN') || (currentUserRole === 'OFFICER' && member.role === 'MEMBER')) && (
                <TouchableOpacity
                  onPress={handleRemoveMember}
                  disabled={isUpdating}
                  style={{
                    backgroundColor: 'rgba(255, 59, 48, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 59, 48, 0.3)',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: isUpdating ? 0.5 : 1
                  }}
                >
                  <MaterialIcons name="person-remove" size={20} color="#FF3B30" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: '#FF3B30',
                      marginBottom: 2
                    }}>
                      Remove from Group
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 59, 48, 0.8)'
                    }}>
                      Permanently remove member
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

      </View>
    </View>
  );
}