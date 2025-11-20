import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Text, View, ScrollView, Image, TouchableOpacity, StatusBar, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import GroupChatTab from './GroupChatTab';
import GroupBetsTab from './GroupBetsTab';
import GroupStatsTab from './GroupStatsTab';
import GroupMembersTab from './GroupMembersTab';
import GroupSettingsTab from './GroupSettingsTab';
import { groupService } from '../../services/group/groupService';

interface GroupMemberViewProps {
  groupData: {
    id: string | string[];
    name: string;
    description: string;
    memberCount: number;
    createdDate: string;
    image: any;
    totalBets: number;
    userPosition: number;
    groupAchievements: number;
    isAdmin: boolean;
    userRole?: string;
  };
}

const GroupMemberView: React.FC<GroupMemberViewProps> = ({ groupData: initialGroupData }) => {
  const insets = useSafeAreaInsets();
  const searchParams = useLocalSearchParams();

  // Get group initials from name
  const getGroupInitials = useCallback((name: string) => {
    if (!name) return 'G';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }, []);

  // Determine initial tab from URL parameter
  const getInitialTab = () => {
    const tabParam = searchParams.tab;
    console.log('🎯 [GroupMemberView] DEBUG: Tab parameter check:', {
      searchParams,
      tabParam,
      tabParamType: typeof tabParam,
      allParams: JSON.stringify(searchParams)
    });

    if (tabParam && typeof tabParam === 'string') {
      const tabIndex = parseInt(tabParam, 10);
      console.log('🎯 [GroupMemberView] DEBUG: Parsed tab index:', { tabIndex, isValid: !isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3 });
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 2) {
        return tabIndex;
      }
    }
    console.log('🎯 [GroupMemberView] DEBUG: Using default tab 0');
    return 0; // Default to Chat tab
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [groupData, setGroupData] = useState(initialGroupData);
  const [refreshing, setRefreshing] = useState(false);
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const tabs = ['Chat', 'Bets', 'People'];

  // Check if user is admin or officer
  const isAdminOrOfficer = groupData.userRole === 'ADMIN' || groupData.userRole === 'OFFICER';

  // Sync local state with incoming props when they change
  useEffect(() => {
    console.log(`🔄 [GroupMemberView] Props updated:`, {
      newName: initialGroupData.name,
      newMemberCount: initialGroupData.memberCount,
      currentName: groupData.name,
      currentMemberCount: groupData.memberCount
    });
    setGroupData(initialGroupData);
  }, [initialGroupData]);

  const handleGroupUpdated = useCallback((updatedGroup: any) => {
    // Merge the updated settings back into our group data
    setGroupData(prev => ({
      ...prev,
      name: updatedGroup.groupName || updatedGroup.name || prev.name,
      description: updatedGroup.description || prev.description,
      privacy: updatedGroup.privacy
    }));
  }, []);

  // Fetch pending request count (admin/officer only)
  const fetchPendingRequestCount = useCallback(async () => {
    if (!isAdminOrOfficer) {
      setPendingRequestCount(0);
      return;
    }

    try {
      const groupId = typeof groupData.id === 'string' ? parseInt(groupData.id) : parseInt(groupData.id[0]);
      const count = await groupService.getPendingRequestCount(groupId);
      setPendingRequestCount(count);
    } catch (error) {
      console.error('Error fetching pending request count:', error);
      setPendingRequestCount(0);
    }
  }, [groupData.id, isAdminOrOfficer]);

  // Fetch pending request count on mount and when refreshing
  useEffect(() => {
    if (isAdminOrOfficer) {
      fetchPendingRequestCount();
    }
  }, [isAdminOrOfficer, forceRefreshCounter, fetchPendingRequestCount]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Increment counter to trigger force refresh in child tabs
    setForceRefreshCounter(prev => prev + 1);

    // Simulate a brief delay for better UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Handle leave group for non-admins
  const handleLeaveGroup = useCallback(() => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave ${groupData.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupId = typeof groupData.id === 'string' ? parseInt(groupData.id) : parseInt(groupData.id[0]);
              await groupService.leaveGroup(groupId);
              Alert.alert(
                'Success',
                'You have left the group',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace({
                        pathname: '/(tabs)/group',
                        params: { refresh: Date.now().toString() }
                      });
                    }
                  }
                ]
              );
            } catch (error: any) {
              console.error('Failed to leave group:', error);
              const errorMessage = error?.response?.data?.error || 'Failed to leave group. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  }, [groupData]);

  // Transform data for GroupSettingsTab
  const settingsGroupData = {
    id: typeof groupData.id === 'string' ? parseInt(groupData.id) : parseInt(groupData.id[0]),
    name: groupData.name,
    description: groupData.description,
    memberCount: groupData.memberCount,
    privacy: (groupData as any).privacy || 'PRIVATE' as 'PUBLIC' | 'PRIVATE' | 'SECRET'
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />

      {/* Shared Compact Header - Used by All Tabs */}
      <View style={{ paddingTop: insets.top + 8 }}>
        {/* Header with Group Image */}
        <View style={{
          paddingHorizontal: 20,
          marginBottom: 12
        }}>
          {/* Combined Header Row: Back Button + Group Info + Settings */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <MaterialIcons name="arrow-back" size={16} color="#ffffff" />
            </TouchableOpacity>

            {/* Centered Group Info */}
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {typeof groupData.image === 'string' || (groupData.image && groupData.image.uri) ? (
                <Image
                  source={typeof groupData.image === 'string' ? { uri: groupData.image } : groupData.image}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    marginRight: 12
                  }}
                />
              ) : (
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  marginRight: 12,
                  backgroundColor: 'rgba(0, 212, 170, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#00D4AA'
                  }}>
                    {getGroupInitials(groupData.name)}
                  </Text>
                </View>
              )}
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {groupData.name}
              </Text>
            </View>

            {/* Settings Button (Admin Only) or Menu (Non-admins) */}
            {groupData.isAdmin ? (
              <TouchableOpacity
                onPress={() => {
                  const currentGroupId = typeof groupData.id === 'string' ? groupData.id : groupData.id[0];
                  router.push(`/group/${currentGroupId}/config`);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <MaterialIcons name="settings" size={16} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleLeaveGroup}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <MaterialIcons name="more-vert" size={16} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Clean Tab Navigation */}
        <View style={{
          flexDirection: 'row',
          marginBottom: 8,
          paddingLeft: 4,
          paddingRight: 12
        }}>
          {tabs.map((tab, index) => {
            const isActive = index === activeTab;
            const isPeopleTab = tab === 'People';
            const showBadge = isPeopleTab && isAdminOrOfficer && pendingRequestCount > 0;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: '#ffffff',
                  flex: 1,
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
                  }} numberOfLines={1}>
                    {tab}
                  </Text>

                  {/* Badge for pending requests */}
                  {showBadge && (
                    <View style={{
                      backgroundColor: '#00D4AA',
                      borderRadius: 10,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 5,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: 6
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#000000'
                      }}>
                        {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tab Content - All tabs stay mounted, only visibility changes */}

      {/* Chat Tab */}
      <View style={{ flex: 1, display: activeTab === 0 ? 'flex' : 'none' }}>
        <GroupChatTab groupData={groupData} />
      </View>

      {/* Bets Tab */}
      <View style={{ flex: 1, display: activeTab === 1 ? 'flex' : 'none' }}>
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00D4AA"
              colors={['#00D4AA']}
            />
          }
        >
          <View style={{ paddingHorizontal: 20 }}>
            <GroupBetsTab groupData={groupData} forceRefresh={forceRefreshCounter} />
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </View>

      {/* People Tab */}
      <View style={{ flex: 1, display: activeTab === 2 ? 'flex' : 'none' }}>
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00D4AA"
              colors={['#00D4AA']}
            />
          }
        >
          <View style={{ paddingHorizontal: 20 }}>
            <GroupMembersTab groupData={groupData} forceRefresh={forceRefreshCounter} />
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default GroupMemberView;