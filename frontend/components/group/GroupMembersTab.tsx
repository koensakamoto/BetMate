import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { groupService, type GroupMemberResponse } from '../../services/group/groupService';
import { debugLog, errorLog } from '../../config/env';

interface GroupMembersTabProps {
  groupData: {
    id: string | string[];
    memberCount: number;
  };
}

const GroupMembersTab: React.FC<GroupMembersTabProps> = ({ groupData }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const memberFilters = ['All', 'Admins', 'Active', 'Recent'];

  // Fetch group members
  useEffect(() => {
    const fetchMembers = async () => {
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
    };

    if (groupData.id) {
      fetchMembers();
    }
  }, [groupData.id]);

  const getFilteredMembers = () => {
    // Ensure members is always an array
    if (!Array.isArray(members)) {
      return [];
    }

    switch (activeFilter) {
      case 'Admins':
        return members.filter(member => member.role === 'ADMIN' || member.role === 'OFFICER');
      case 'Active':
        return members.filter(member => isOnline(member));
      case 'Recent':
        return members.filter(member => {
          const joinDate = new Date(member.joinedAt);
          const now = new Date();
          const daysDiff = (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7; // Joined within last 7 days
        });
      default:
        return members;
    }
  };

  // Helper function to check if member is online
  const isOnline = (member: GroupMemberResponse): boolean => {
    if (!member.lastActivityAt) return false;
    const lastActivity = new Date(member.lastActivityAt);
    const now = new Date();
    const minutesDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    return minutesDiff <= 5; // Active within last 5 minutes
  };

  // Helper function to get display name
  const getDisplayName = (member: GroupMemberResponse): string => {
    return member.displayName || member.username;
  };

  // Helper function to format join date
  const formatJoinDate = (dateString: string): string => {
    const joinDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  // Helper function to format last activity
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

  return (
    <View>
      {/* Member Count Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 16
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#ffffff'
        }}>
          Members ({groupData.memberCount})
        </Text>
        
        <TouchableOpacity style={{
          backgroundColor: 'rgba(0, 212, 170, 0.15)',
          width: 36,
          height: 36,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <MaterialIcons name="person-add" size={18} color="#00D4AA" />
        </TouchableOpacity>
      </View>

      {/* Member Filters */}
      <View style={{ marginBottom: 20 }}>
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

      {/* Loading State */}
      {isLoading ? (
        <Text style={{
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          marginTop: 20
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
          marginTop: 20
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
          {getFilteredMembers().map((member, index) => (
        <View key={member.id} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          {/* Avatar */}
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isOnline(member) ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.12)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
            position: 'relative'
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
              
              {(member.role === 'ADMIN' || member.role === 'OFFICER') && (
                <View style={{
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: '#FFD700'
                  }}>
                    {member.role}
                  </Text>
                </View>
              )}
            </View>

            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 2
            }}>
              @{member.username}
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Joined {formatJoinDate(member.joinedAt)}
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

          {/* Member Actions */}
          <TouchableOpacity
            onPress={() => {
              const groupId = Array.isArray(groupData.id) ? groupData.id[0] : groupData.id;
              router.push(`/group/${groupId}/member/${member.id}`);
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              marginLeft: 12
            }}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 12,
              fontWeight: '600'
            }}>
              Manage
            </Text>
          </TouchableOpacity>
        </View>
          ))}
          
          {/* Empty State */}
          {getFilteredMembers().length === 0 && (
            <Text style={{
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              marginTop: 20
            }}>
              {activeFilter === 'All' ? 'No members found.' : `No ${activeFilter.toLowerCase()} members found.`}
            </Text>
          )}

          {/* Show More Button */}
          {getFilteredMembers().length < groupData.memberCount && (
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
    </View>
  );
};

export default GroupMembersTab;