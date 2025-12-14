import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Modal, Alert, TextInput, Share, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { groupService, type GroupMemberResponse, type PendingRequestResponse } from '../../services/group/groupService';
import { debugLog, errorLog } from '../../config/env';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { colors } from '../../constants/theme';
import { isOnline, getDisplayName, formatJoinDate, formatLastActivity } from '../../utils/memberUtils';

interface GroupMembersTabProps {
  groupData: {
    id: string | string[];
    name?: string;
    memberCount: number;
    userRole?: string;
    ownerUsername?: string;
  };
  forceRefresh?: number; // Increment this to force a refresh
}

const GroupMembersTab: React.FC<GroupMembersTabProps> = ({ groupData, forceRefresh }) => {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<'link' | 'username'>('link');
  const [usernameToInvite, setUsernameToInvite] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [pendingRequests, setPendingRequests] = useState<PendingRequestResponse[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const memberFilters = ['All', 'Admins'];

  // Cache management: 5 minute cache
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const isCacheValid = useCallback(() => {
    return (Date.now() - lastFetchTime.current) < CACHE_DURATION;
  }, []);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return groupData.userRole === 'ADMIN';
  }, [groupData.userRole]);

  // Fetch pending join requests (admin/officer only)
  const fetchPendingRequests = useCallback(async () => {
    if (!isAdmin) return;

    setIsLoadingRequests(true);
    try {
      const groupId = Array.isArray(groupData.id) ? groupData.id[0] : groupData.id;
      debugLog('Fetching pending requests for group ID:', groupId);
      const requests = await groupService.getPendingRequests(Number(groupId));

      if (Array.isArray(requests)) {
        setPendingRequests(requests);
        debugLog('Pending requests fetched successfully:', requests);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      errorLog('Error fetching pending requests:', error);
      setPendingRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [groupData.id, isAdmin]);


  // Fetch group members with caching
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const groupId = Array.isArray(groupData.id) ? groupData.id[0] : groupData.id;
      debugLog('Fetching members for group ID:', groupId);
      const membersData = await groupService.getGroupMembers(Number(groupId));

      // Ensure we always set an array
      if (Array.isArray(membersData)) {
        setMembers(membersData);
        setError(null);
        debugLog('Group members fetched successfully:', membersData);

        // Update cache timestamp
        lastFetchTime.current = Date.now();
      } else {
        errorLog('API returned non-array data:', membersData);
        setMembers([]);
        setError('Invalid data received from server');
      }
    } catch (error: any) {
      errorLog('Error fetching group members:', error);
      setMembers([]);

      // Set more specific error messages
      if (error?.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error?.response?.status === 403) {
        setError('You do not have permission to view members of this group.');
      } else if (error?.response?.status === 404) {
        setError('Group not found.');
      } else {
        setError('Failed to load group members. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [groupData.id]);

  // Smart fetch with caching
  useEffect(() => {
    if (groupData.id) {
      // Only fetch if cache is invalid or no data
      if (!isCacheValid() || members.length === 0) {
        debugLog('Cache invalid or no data, fetching members');
        fetchMembers();
      } else {
        debugLog('Using cached members data');
      }
    }
  }, [groupData.id, isCacheValid, members.length, fetchMembers]);

  // Handle force refresh from parent (pull-to-refresh)
  useEffect(() => {
    if (forceRefresh && forceRefresh > 0) {
      debugLog('Force refresh triggered for members');
      fetchMembers();
      fetchPendingRequests();
    }
  }, [forceRefresh, fetchMembers, fetchPendingRequests]);

  // Fetch pending requests on mount if user is admin/officer
  useEffect(() => {
    if (isAdmin && groupData.id) {
      fetchPendingRequests();
    }
  }, [groupData.id, isAdmin, fetchPendingRequests]);

  // Filter members based on selected filter - memoized to avoid recalculating on every render
  const filteredMembers = useMemo(() => {
    // Ensure members is always an array
    if (!Array.isArray(members)) {
      return [];
    }

    switch (activeFilter) {
      case 'Admins':
        // Include both admins and the owner (owner has admin privileges)
        return members.filter(member =>
          member.role === 'ADMIN' || member.username === groupData.ownerUsername
        );
      default:
        return members;
    }
  }, [members, activeFilter, groupData.ownerUsername]);

  // Helper functions for invite functionality
  const generateInviteLink = () => {
    const currentGroupId = typeof groupData.id === 'string' ? groupData.id : groupData.id[0];
    // Use custom scheme for now - works in dev and production
    // For production with universal links, change to: https://rivalpicks.app/invite/${currentGroupId}
    const link = `rivalpicks://invite/${currentGroupId}`;
    setInviteLink(link);
    return link;
  };

  const handleShareInviteLink = async () => {
    try {
      const link = generateInviteLink();
      const shareMessage = `You're invited to join "${groupData.name}" on RivalPicks!\n\nCompete with friends, make predictions, and see who comes out on top.\n\n${link}`;

      // iOS handles message and url differently - use platform-specific sharing
      if (Platform.OS === 'ios') {
        await Share.share({
          message: shareMessage,
          url: undefined,
        });
      } else {
        await Share.share({
          message: shareMessage,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite link');
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      const link = generateInviteLink();
      await Clipboard.setStringAsync(link);
      Alert.alert('Copied!', 'Invite link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy invite link');
    }
  };

  const handleInviteByUsername = async () => {
    if (!usernameToInvite.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setIsInviting(true);
    try {
      const groupId = Array.isArray(groupData.id) ? groupData.id[0] : groupData.id;
      await groupService.inviteUser(Number(groupId), usernameToInvite.trim());
      Alert.alert('Success', `Invite sent to @${usernameToInvite}`);
      setUsernameToInvite('');
      setShowInviteModal(false);
      // Refresh members list to show newly invited user
      fetchMembers();
    } catch (error: any) {
      errorLog('Error inviting user:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send invite';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <View>
      {/* Action Buttons Row */}
      <View style={{
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20
      }}>
        {/* Pending Requests Button - Always visible for admins/officers */}
        {isAdmin && (
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => {
                const groupId = Array.isArray(groupData.id) ? groupData.id[0] : groupData.id;
                router.push(`/(app)/group/${groupId}/pending-requests`);
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 10,
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                opacity: pendingRequests.length === 0 ? 0.5 : 1
              }}
            >
              <MaterialIcons name="notifications-none" size={18} color="rgba(255, 255, 255, 0.9)" />
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
                marginLeft: 6
              }}>
                Requests
              </Text>
              {/* Badge showing count */}
              <View style={{
                marginLeft: 6,
                backgroundColor: pendingRequests.length > 0 ? '#00D4AA' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                minWidth: 16,
                height: 16,
                paddingHorizontal: 4,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: pendingRequests.length > 0 ? '#000000' : 'rgba(255, 255, 255, 0.6)'
                }}>
                  {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Invite Members Button - Always visible */}
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => setShowInviteModal(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Invite members"
            accessibilityHint="Double tap to invite new members to the group"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              height: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MaterialIcons name="person-add-alt" size={18} color="rgba(255, 255, 255, 0.9)" accessible={false} />
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.9)',
              marginLeft: 6
            }} accessible={false}>
              Invite
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Member Count Header */}
      <Text style={{
        fontSize: 15,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 16,
        letterSpacing: 0.3
      }}>
        {groupData.memberCount} members
      </Text>

      {/* Member Filters */}
      <View style={{ marginBottom: 16 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0 }}
        >
          <View style={{
            flexDirection: 'row',
            gap: 8
          }}>
            {memberFilters.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter: ${filter}`}
                  accessibilityState={{ selected: isActive }}
                  accessibilityHint={isActive ? 'Currently selected' : `Double tap to filter by ${filter}`}
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
                  }} accessible={false}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <Text style={{
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          marginTop: 8
        }}>
          Loading members...
        </Text>
      ) : error ? (
        <View style={{
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 0, 0, 0.3)',
          borderRadius: 8,
          padding: 16,
          marginTop: 8
        }}>
          <Text style={{
            color: '#ff6b6b',
            textAlign: 'center',
            fontSize: 14,
            marginBottom: 8
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const groupId = Array.isArray(groupData.id) ? groupData.id[0] : groupData.id;
              if (groupId) {
                // Trigger a refetch by updating the dependency
                setError(null);
                setIsLoading(true);
                groupService.getGroupMembers(Number(groupId))
                  .then(data => {
                    if (Array.isArray(data)) {
                      setMembers(data);
                      setError(null);
                    } else {
                      setMembers([]);
                      setError('Invalid data received from server');
                    }
                  })
                  .catch(err => {
                    setMembers([]);
                    setError('Failed to load group members. Please try again.');
                  })
                  .finally(() => setIsLoading(false));
              }
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 6,
              alignSelf: 'center'
            }}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 12,
              fontWeight: '600'
            }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Members List */}
          {filteredMembers.map((member, index) => (
        <TouchableOpacity
          key={member.id}
          onPress={() => {
            const groupId = Array.isArray(groupData.id) ? groupData.id[0] : groupData.id;
            router.push(`/(app)/group/${groupId}/member/${member.id}`);
          }}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${getDisplayName(member)}, @${member.username}${member.username === groupData.ownerUsername ? ', Owner' : member.role === 'ADMIN' ? ', Admin' : ''}`}
          accessibilityHint="Double tap to view member details"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          {/* Avatar */}
          <View style={{ marginRight: 12 }}>
            <Avatar
              imageUrl={member.profileImageUrl}
              firstName={member.displayName?.split(' ')[0]}
              lastName={member.displayName?.split(' ').slice(1).join(' ')}
              username={member.username}
              userId={member.id}
              size="md"
              showOnlineIndicator={true}
              isOnline={isOnline(member.lastActivityAt)}
            />
          </View>

          {/* Member Info */}
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginRight: 8
              }}>
                {getDisplayName(member)}
              </Text>

              {member.username === groupData.ownerUsername ? (
                <Badge label="OWNER" variant="owner" size="small" />
              ) : member.role === 'ADMIN' && (
                <Badge label="ADMIN" variant="admin" size="small" />
              )}
            </View>

            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 2
            }}>
              @{member.username}
            </Text>

            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Joined {formatJoinDate(member.joinedAt)}
            </Text>
          </View>
        </TouchableOpacity>
          ))}

          {/* Empty State */}
          {filteredMembers.length === 0 && (
            <Text style={{
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              marginTop: 20
            }}>
              {activeFilter === 'All' ? 'No members found.' : `No ${activeFilter.toLowerCase()} members found.`}
            </Text>
          )}

          {/* Show More Button */}
          {members.length < groupData.memberCount && (
            <TouchableOpacity style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              paddingVertical: 14,
              borderRadius: 8,
              marginTop: 8,
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 14,
                fontWeight: '600'
              }}>
                Show More Members
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Simple Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20
          }}
          activeOpacity={1}
          onPress={() => setShowInviteModal(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            activeOpacity={1}
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 20,
              width: '100%'
            }}
          >
            <View
              style={{
                backgroundColor: '#1a1a1f',
                borderRadius: 16,
                padding: 16,
                alignSelf: 'stretch',
                maxWidth: 360,
                minWidth: 320,
                marginTop: -40,
                maxHeight: `${100 - ((insets.top + insets.bottom + 40) / 8)}%`,
                overflow: 'hidden'
              }}
            >
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#ffffff'
              }}>
                Invite Members
              </Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <MaterialIcons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Method Selection Tabs */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
              padding: 4,
              marginBottom: 12
            }}>
              <TouchableOpacity
                onPress={() => setInviteMethod('link')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: inviteMethod === 'link' ? '#00D4AA' : 'transparent'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: inviteMethod === 'link' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center'
                }}>
                  Share Link
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setInviteMethod('username')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: inviteMethod === 'username' ? '#00D4AA' : 'transparent'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: inviteMethod === 'username' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center'
                }}>
                  By Username
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on selected method */}
            {inviteMethod === 'link' ? (
              <View style={{ width: '100%' }}>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Share an invite link for anyone to join the group
                </Text>

                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleShareInviteLink}
                    style={{
                      backgroundColor: '#00D4AA',
                      borderRadius: 10,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MaterialIcons name="share" size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#000000'
                    }}>
                      Share Invite Link
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCopyInviteLink}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MaterialIcons name="content-copy" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      Copy Link
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                <TextInput
                  style={{
                    width: '100%',
                    flexShrink: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 12,
                    padding: 12,
                    color: '#ffffff',
                    fontSize: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: '#00D4AA'
                  }}
                  placeholder="Enter a username to send a direct invite"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={usernameToInvite}
                  onChangeText={setUsernameToInvite}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  onPress={handleInviteByUsername}
                  disabled={isInviting || !usernameToInvite.trim()}
                  style={{
                    backgroundColor: (!usernameToInvite.trim() || isInviting) ? 'rgba(255, 255, 255, 0.1)' : '#00D4AA',
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MaterialIcons
                    name="person-add"
                    size={20}
                    color={(!usernameToInvite.trim() || isInviting) ? 'rgba(255, 255, 255, 0.5)' : '#000000'}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: (!usernameToInvite.trim() || isInviting) ? 'rgba(255, 255, 255, 0.5)' : '#000000'
                  }}>
                    {isInviting ? 'Sending...' : 'Send Invite'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

export default GroupMembersTab;