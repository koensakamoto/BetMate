import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { groupService, type GroupMemberResponse, type GroupDetailResponse } from '../../../services/group/groupService';
import { useAuth } from '../../../contexts/AuthContext';

export default function ManageMembers() {
  const { groupId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [groupData, setGroupData] = useState<GroupDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());

  const filters = ['All', 'Admins', 'Officers', 'Members'];

  // Get current user's role and permissions
  const currentUserRole = groupData?.userRole;
  const canManageMembers = currentUserRole === 'ADMIN' || currentUserRole === 'OFFICER';

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    if (!groupId) return;

    setIsLoading(true);
    try {
      const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);

      // Fetch both group data and members
      const [groupResponse, membersResponse] = await Promise.all([
        groupService.getGroupById(numericGroupId),
        groupService.getGroupMembers(numericGroupId)
      ]);

      setGroupData(groupResponse);
      setMembers(membersResponse);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter members based on search and filter criteria
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.username.toLowerCase().includes(query) ||
        member.displayName?.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    switch (activeFilter) {
      case 'Admins':
        filtered = filtered.filter(member => member.role === 'ADMIN');
        break;
      case 'Officers':
        filtered = filtered.filter(member => member.role === 'OFFICER');
        break;
      case 'Members':
        filtered = filtered.filter(member => member.role === 'MEMBER');
        break;
      default:
        break;
    }

    return filtered;
  }, [members, searchQuery, activeFilter]);

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

  const handleMemberPress = (member: GroupMemberResponse) => {
    if (!canManageMembers) {
      // Navigate to member profile for view-only
      router.push(`/profile/${member.id}`);
      return;
    }

    // Can't manage yourself
    if (member.id === user?.id) {
      router.push(`/profile/${member.id}`);
      return;
    }

    // Build action options based on current user role and target member role
    const actions = [];

    // Always allow viewing profile
    actions.push({ text: 'View Profile', onPress: () => router.push(`/profile/${member.id}`) });

    // Role management based on permissions
    if (currentUserRole === 'ADMIN') {
      // Admins can promote/demote anyone and remove anyone
      if (member.role === 'MEMBER') {
        actions.push({ text: 'Promote to Officer', onPress: () => handlePromoteToOfficer(member) });
      } else if (member.role === 'OFFICER') {
        actions.push({ text: 'Demote to Member', onPress: () => handleDemoteToMember(member) });
      }
      actions.push({ text: 'Remove Member', onPress: () => handleRemoveMember(member), style: 'destructive' });
    } else if (currentUserRole === 'OFFICER') {
      // Officers can only promote regular members to officer and remove regular members
      if (member.role === 'MEMBER') {
        actions.push({ text: 'Promote to Officer', onPress: () => handlePromoteToOfficer(member) });
        actions.push({ text: 'Remove Member', onPress: () => handleRemoveMember(member), style: 'destructive' });
      }
    }

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Manage Member',
      `Options for ${getDisplayName(member)}`,
      actions
    );
  };

  const handlePromoteToOfficer = async (member: GroupMemberResponse) => {
    Alert.alert(
      'Promote Member',
      `Are you sure you want to promote ${getDisplayName(member)} to Officer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
              await groupService.updateMemberRole(numericGroupId, member.id, 'OFFICER');

              // Update local state
              setMembers(prev =>
                prev.map(m => m.id === member.id ? { ...m, role: 'OFFICER' } : m)
              );

              Alert.alert('Success', `${getDisplayName(member)} has been promoted to Officer`);
            } catch (error) {
              console.error('Error promoting member:', error);
              Alert.alert('Error', 'Failed to promote member. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDemoteToMember = async (member: GroupMemberResponse) => {
    Alert.alert(
      'Demote Officer',
      `Are you sure you want to demote ${getDisplayName(member)} to Member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
              await groupService.updateMemberRole(numericGroupId, member.id, 'MEMBER');

              // Update local state
              setMembers(prev =>
                prev.map(m => m.id === member.id ? { ...m, role: 'MEMBER' } : m)
              );

              Alert.alert('Success', `${getDisplayName(member)} has been demoted to Member`);
            } catch (error) {
              console.error('Error demoting member:', error);
              Alert.alert('Error', 'Failed to demote member. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = async (member: GroupMemberResponse) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${getDisplayName(member)} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
              await groupService.removeMember(numericGroupId, member.id);

              // Update local state
              setMembers(prev => prev.filter(m => m.id !== member.id));

              // Clear from selected members if selected
              setSelectedMembers(prev => {
                const newSet = new Set(prev);
                newSet.delete(member.id);
                return newSet;
              });

              Alert.alert('Success', `${getDisplayName(member)} has been removed from the group`);
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            }
          }
        }
      ]
    );
  };

  const toggleMemberSelection = (memberId: number) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
  };

  const handleBulkActions = () => {
    const selectedMembersList = members.filter(m => selectedMembers.has(m.id));

    // Filter out current user and members you can't manage
    const manageableMembers = selectedMembersList.filter(m => {
      if (m.id === user?.id) return false; // Can't manage yourself

      if (currentUserRole === 'ADMIN') {
        return true; // Admins can manage everyone
      } else if (currentUserRole === 'OFFICER') {
        return m.role === 'MEMBER'; // Officers can only manage regular members
      }

      return false;
    });

    if (manageableMembers.length === 0) {
      Alert.alert('No Action Available', 'You cannot manage any of the selected members.');
      return;
    }

    const actions = [];

    // Determine available bulk actions based on role and selected members
    if (currentUserRole === 'ADMIN') {
      // Check if any selected members can be promoted
      const promotableMembers = manageableMembers.filter(m => m.role === 'MEMBER');
      if (promotableMembers.length > 0) {
        actions.push({
          text: `Promote ${promotableMembers.length} to Officer`,
          onPress: () => handleBulkPromote(promotableMembers)
        });
      }

      // Check if any selected members can be demoted
      const demotableMembers = manageableMembers.filter(m => m.role === 'OFFICER');
      if (demotableMembers.length > 0) {
        actions.push({
          text: `Demote ${demotableMembers.length} to Member`,
          onPress: () => handleBulkDemote(demotableMembers)
        });
      }
    } else if (currentUserRole === 'OFFICER') {
      // Officers can only promote regular members
      const promotableMembers = manageableMembers.filter(m => m.role === 'MEMBER');
      if (promotableMembers.length > 0) {
        actions.push({
          text: `Promote ${promotableMembers.length} to Officer`,
          onPress: () => handleBulkPromote(promotableMembers)
        });
      }
    }

    // Always allow bulk removal for manageable members
    actions.push({
      text: `Remove ${manageableMembers.length} Members`,
      onPress: () => handleBulkRemove(manageableMembers),
      style: 'destructive'
    });

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Bulk Actions', `Actions for ${manageableMembers.length} selected members`, actions);
  };

  const handleBulkPromote = async (membersToPromote: GroupMemberResponse[]) => {
    Alert.alert(
      'Bulk Promote',
      `Are you sure you want to promote ${membersToPromote.length} members to Officer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote All',
          onPress: async () => {
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);

              // Execute all promotions
              await Promise.all(
                membersToPromote.map(member =>
                  groupService.updateMemberRole(numericGroupId, member.id, 'OFFICER')
                )
              );

              // Update local state
              setMembers(prev =>
                prev.map(m =>
                  membersToPromote.some(promoted => promoted.id === m.id)
                    ? { ...m, role: 'OFFICER' }
                    : m
                )
              );

              setSelectedMembers(new Set());
              Alert.alert('Success', `${membersToPromote.length} members have been promoted to Officer`);
            } catch (error) {
              console.error('Error bulk promoting members:', error);
              Alert.alert('Error', 'Failed to promote some members. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBulkDemote = async (membersToDemote: GroupMemberResponse[]) => {
    Alert.alert(
      'Bulk Demote',
      `Are you sure you want to demote ${membersToDemote.length} officers to Member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote All',
          style: 'destructive',
          onPress: async () => {
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);

              // Execute all demotions
              await Promise.all(
                membersToDemote.map(member =>
                  groupService.updateMemberRole(numericGroupId, member.id, 'MEMBER')
                )
              );

              // Update local state
              setMembers(prev =>
                prev.map(m =>
                  membersToDemote.some(demoted => demoted.id === m.id)
                    ? { ...m, role: 'MEMBER' }
                    : m
                )
              );

              setSelectedMembers(new Set());
              Alert.alert('Success', `${membersToDemote.length} officers have been demoted to Member`);
            } catch (error) {
              console.error('Error bulk demoting members:', error);
              Alert.alert('Error', 'Failed to demote some members. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBulkRemove = async (membersToRemove: GroupMemberResponse[]) => {
    Alert.alert(
      'Bulk Remove',
      `Are you sure you want to remove ${membersToRemove.length} members from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All',
          style: 'destructive',
          onPress: async () => {
            try {
              const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);

              // Execute all removals
              await Promise.all(
                membersToRemove.map(member =>
                  groupService.removeMember(numericGroupId, member.id)
                )
              );

              // Update local state
              const removedIds = new Set(membersToRemove.map(m => m.id));
              setMembers(prev => prev.filter(m => !removedIds.has(m.id)));
              setSelectedMembers(new Set());

              Alert.alert('Success', `${membersToRemove.length} members have been removed from the group`);
            } catch (error) {
              console.error('Error bulk removing members:', error);
              Alert.alert('Error', 'Failed to remove some members. Please try again.');
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
        {/* Top row with back button and title */}
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
              Manage Members
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 2
            }}>
              {filteredMembers.length} of {members.length} members
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 16
        }}>
          <MaterialIcons name="search" size={20} color="rgba(255, 255, 255, 0.6)" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search members..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            style={{
              flex: 1,
              fontSize: 16,
              color: '#ffffff',
              marginLeft: 12
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0 }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {filters.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={{
                    backgroundColor: isActive ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: isActive ? 0 : 0.5,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    minWidth: 60,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: isActive ? '#000000' : '#ffffff',
                    fontSize: 13,
                    fontWeight: '600'
                  }}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Members List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {filteredMembers.map((member) => {
          const handleCardPress = () => {
            const numericGroupId = Array.isArray(groupId) ? groupId[0] : groupId;
            const path = `/group/${numericGroupId}/member/${member.id}`;
            router.push(path);
          };

          return (
            <TouchableOpacity
              key={member.id}
              onPress={handleCardPress}
              activeOpacity={0.7}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderWidth: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: 16,
                marginVertical: 6,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              {/* Selection checkbox (only for admins/officers managing others) */}
              {canManageMembers && member.id !== user?.id && (
                <TouchableOpacity
                  onPress={() => toggleMemberSelection(member.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: selectedMembers.has(member.id) ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: selectedMembers.has(member.id) ? '#00D4AA' : 'transparent',
                    marginRight: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {selectedMembers.has(member.id) && (
                    <MaterialIcons name="check" size={16} color="#000000" />
                  )}
                </TouchableOpacity>
              )}

              {/* Member Info Area */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 8 }}>
                {/* Avatar */}
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isOnline(member) ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.12)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                  position: 'relative',
                  flexShrink: 0
                }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: isOnline(member) ? '#00D4AA' : '#ffffff'
                  }}>
                    {getDisplayName(member).charAt(0).toUpperCase()}
                  </Text>

                  {/* Online Indicator */}
                  {isOnline(member) && (
                    <View style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#00D4AA',
                      borderWidth: 2,
                      borderColor: '#0a0a0f'
                    }} />
                  )}
                </View>

                {/* Member Info */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4
                  }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#ffffff',
                        marginRight: 8
                      }}
                      numberOfLines={1}
                    >
                      {getDisplayName(member)}
                    </Text>

                    {(member.role === 'ADMIN' || member.role === 'OFFICER') && (
                      <View style={{
                        backgroundColor: member.role === 'ADMIN' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 212, 170, 0.2)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        flexShrink: 0
                      }}>
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: member.role === 'ADMIN' ? '#FFD700' : '#00D4AA'
                        }}>
                          {member.role}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: 2
                    }}
                    numberOfLines={1}
                  >
                    @{member.username}
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}
                    numberOfLines={1}
                  >
                    {member.totalBets} bets • {member.totalWins}W {member.totalLosses}L
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60
          }}>
            <MaterialIcons name="people" size={48} color="rgba(255, 255, 255, 0.3)" />
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 16,
              textAlign: 'center'
            }}>
              {searchQuery.trim() ? 'No members found matching your search' : `No ${activeFilter.toLowerCase()} found`}
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bulk Actions Bar (only for admins/officers with selected members) */}
      {canManageMembers && selectedMembers.size > 0 && (
        <View style={{
          backgroundColor: '#1a1a1f',
          paddingHorizontal: 20,
          paddingVertical: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Text style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: '600'
          }}>
            {selectedMembers.size} selected
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setSelectedMembers(new Set())}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                Clear
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBulkActions}
              style={{
                backgroundColor: '#00D4AA',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8
              }}
            >
              <Text style={{ color: '#000000', fontSize: 14, fontWeight: '600' }}>
                Actions
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}