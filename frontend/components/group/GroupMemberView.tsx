import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Text, View, ScrollView, Image, TouchableOpacity, StatusBar, RefreshControl, Alert, ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import GroupChatTab from './GroupChatTab';
import GroupBetsTab from './GroupBetsTab';
import GroupStatsTab from './GroupStatsTab';
import GroupMembersTab from './GroupMembersTab';
import GroupSettingsTab from './GroupSettingsTab';
import { groupService, GroupDetailResponse } from '../../services/group/groupService';
import { getAvatarColor, getAvatarColorWithOpacity, getGroupInitials as getGroupInitialsUtil } from '../../utils/avatarUtils';
import { colors } from '../../constants/theme';

interface GroupMemberViewProps {
  groupData: {
    id: string | string[];
    name: string;
    description: string;
    memberCount: number;
    createdDate: string;
    image?: ImageSourcePropType;
    totalBets: number;
    userPosition: number;
    groupAchievements: number;
    isAdmin: boolean;
    userRole?: string;
    ownerUsername?: string;
  };
}

const GroupMemberView: React.FC<GroupMemberViewProps> = ({ groupData: initialGroupData }) => {
  const insets = useSafeAreaInsets();
  const searchParams = useLocalSearchParams();

  // Determine initial tab from URL parameter
  const getInitialTab = () => {
    const tabParam = searchParams.tab;

    if (tabParam && typeof tabParam === 'string') {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 2) {
        return tabIndex;
      }
    }
    return 0; // Default to Chat tab
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [groupData, setGroupData] = useState(initialGroupData);
  const [refreshing, setRefreshing] = useState(false);
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const tabs = ['Chat', 'Bets', 'People'];

  // Check if user is admin
  const isAdmin = groupData.userRole === 'ADMIN';

  // Get the numeric group ID for color generation
  const numericGroupId = typeof groupData.id === 'string' ? parseInt(groupData.id) : parseInt(groupData.id[0]);

  // Sync local state with incoming props when they change
  useEffect(() => {
    setGroupData(initialGroupData);
  }, [initialGroupData]);

  const handleGroupUpdated = useCallback((updatedGroup: GroupDetailResponse) => {
    // Merge the updated settings back into our group data
    setGroupData(prev => ({
      ...prev,
      name: updatedGroup.groupName || prev.name,
      description: updatedGroup.description || prev.description,
      privacy: updatedGroup.privacy
    }));
  }, []);

  // Fetch pending request count (admin/officer only)
  const fetchPendingRequestCount = useCallback(async () => {
    if (!isAdmin) {
      setPendingRequestCount(0);
      return;
    }

    try {
      const groupId = typeof groupData.id === 'string' ? parseInt(groupData.id) : parseInt(groupData.id[0]);
      const count = await groupService.getPendingRequestCount(groupId);
      setPendingRequestCount(count);
    } catch (error) {
      // Error handled silently
      setPendingRequestCount(0);
    }
  }, [groupData.id, isAdmin]);

  // Fetch pending request count on mount and when refreshing
  useEffect(() => {
    if (isAdmin) {
      fetchPendingRequestCount();
    }
  }, [isAdmin, forceRefreshCounter, fetchPendingRequestCount]);

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
                      router.dismissAll();
                      router.navigate({
                        pathname: '/(tabs)/group',
                        params: { refresh: Date.now().toString() }
                      });
                    }
                  }
                ]
              );
            } catch (error) {
              // Error handled silently
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
    privacy: (groupData as any).privacy || 'PRIVATE' as 'PUBLIC' | 'PRIVATE' | 'SECRET',
    groupPictureUrl: (groupData as any).groupPictureUrl
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
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
              onPress={() => {
                router.dismissAll();
                router.navigate({
                  pathname: '/(tabs)/group',
                  params: { refresh: Date.now().toString() }
                });
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surfaceStrong,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <MaterialIcons name="arrow-back" size={16} color={colors.textPrimary} />
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
                  backgroundColor: getAvatarColorWithOpacity(numericGroupId, 0.2),
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: getAvatarColor(numericGroupId)
                  }}>
                    {getGroupInitialsUtil(groupData.name)}
                  </Text>
                </View>
              )}
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary
              }}>
                {groupData.name}
              </Text>
            </View>

            {/* Settings Button (Admin Only) or Menu (Non-admins) */}
            {groupData.isAdmin ? (
              <TouchableOpacity
                onPress={() => {
                  const currentGroupId = typeof groupData.id === 'string' ? groupData.id : groupData.id[0];
                  router.push(`/(app)/group/${currentGroupId}/config`);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surfaceStrong,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: colors.borderMedium
                }}
              >
                <MaterialIcons name="settings" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleLeaveGroup}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surfaceStrong,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: colors.borderMedium
                }}
              >
                <MaterialIcons name="more-vert" size={16} color={colors.textPrimary} />
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
            const showBadge = isPeopleTab && isAdmin && pendingRequestCount > 0;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: colors.textPrimary,
                  flex: 1,
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? colors.textPrimary : colors.textMuted
                  }} numberOfLines={1}>
                    {tab}
                  </Text>

                  {/* Badge for pending requests */}
                  {showBadge && (
                    <View style={{
                      backgroundColor: colors.primary,
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
                        color: colors.textDark
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
              tintColor={colors.primary}
              colors={[colors.primary]}
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
              tintColor={colors.primary}
              colors={[colors.primary]}
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