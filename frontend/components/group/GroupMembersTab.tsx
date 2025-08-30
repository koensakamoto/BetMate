import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';

interface GroupMembersTabProps {
  groupData: {
    memberCount: number;
  };
}

const GroupMembersTab: React.FC<GroupMembersTabProps> = ({ groupData }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const memberFilters = ['All', 'Admins', 'Active', 'Recent'];

  // Mock member data
  const allMembers = [
    {
      id: 1,
      name: 'Alex Chen',
      username: '@alex_chen',
      role: 'Admin',
      joinDate: '2 months ago',
      lastActive: 'Online',
      isOnline: true,
      avatar: 'A'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      username: '@sarah_j',
      role: 'Admin',
      joinDate: '2 months ago',
      lastActive: '5 min ago',
      isOnline: true,
      avatar: 'S'
    },
    {
      id: 3,
      name: 'Mike Wilson',
      username: '@mike_w',
      role: 'Member',
      joinDate: '3 weeks ago',
      lastActive: '2 hours ago',
      isOnline: false,
      avatar: 'M'
    },
    {
      id: 4,
      name: 'Emma Davis',
      username: '@emma_d',
      role: 'Member',
      joinDate: '1 week ago',
      lastActive: 'Yesterday',
      isOnline: false,
      avatar: 'E'
    },
    {
      id: 5,
      name: 'James Brown',
      username: '@james_b',
      role: 'Member',
      joinDate: '5 days ago',
      lastActive: '3 days ago',
      isOnline: false,
      avatar: 'J'
    },
    {
      id: 6,
      name: 'Lisa Garcia',
      username: '@lisa_g',
      role: 'Member',
      joinDate: '3 days ago',
      lastActive: '1 day ago',
      isOnline: false,
      avatar: 'L'
    },
    {
      id: 7,
      name: 'David Kim',
      username: '@david_k',
      role: 'Member',
      joinDate: '2 days ago',
      lastActive: 'Online',
      isOnline: true,
      avatar: 'D'
    },
    {
      id: 8,
      name: 'Anna Martinez',
      username: '@anna_m',
      role: 'Member',
      joinDate: '1 day ago',
      lastActive: '4 hours ago',
      isOnline: false,
      avatar: 'A'
    }
  ];

  const getFilteredMembers = () => {
    switch (activeFilter) {
      case 'Admins':
        return allMembers.filter(member => member.role === 'Admin');
      case 'Active':
        return allMembers.filter(member => member.isOnline);
      case 'Recent':
        return allMembers.filter(member => 
          member.joinDate.includes('day') || member.joinDate.includes('week')
        );
      default:
        return allMembers;
    }
  };

  return (
    <View>
      {/* Member Count Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
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
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8
        }}>
          <Text style={{
            color: '#00D4AA',
            fontSize: 13,
            fontWeight: '600'
          }}>
            Invite
          </Text>
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
            backgroundColor: member.isOnline ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.12)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
            position: 'relative'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: member.isOnline ? '#00D4AA' : '#ffffff'
            }}>
              {member.avatar}
            </Text>
            
            {/* Online Indicator */}
            {member.isOnline && (
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
                {member.name}
              </Text>
              
              {member.role === 'Admin' && (
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
                    ADMIN
                  </Text>
                </View>
              )}
            </View>

            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 2
            }}>
              {member.username}
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
                Joined {member.joinDate}
              </Text>
              
              <Text style={{
                fontSize: 12,
                color: member.isOnline ? '#00D4AA' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: member.isOnline ? '600' : '400'
              }}>
                {member.lastActive}
              </Text>
            </View>
          </View>

          {/* Member Actions */}
          <TouchableOpacity style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            marginLeft: 12
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 12,
              fontWeight: '600'
            }}>
              View
            </Text>
          </TouchableOpacity>
        </View>
      ))}

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
    </View>
  );
};

export default GroupMembersTab;