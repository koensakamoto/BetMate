import React, { useState, useCallback, useEffect } from 'react';
import { Text, View, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import GroupChatTab from './GroupChatTab';
import GroupBetsTab from './GroupBetsTab';
import GroupStatsTab from './GroupStatsTab';
import GroupMembersTab from './GroupMembersTab';
import GroupSettingsTab from './GroupSettingsTab';

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
  };
}

const GroupMemberView: React.FC<GroupMemberViewProps> = ({ groupData: initialGroupData }) => {
  const insets = useSafeAreaInsets();
  const searchParams = useLocalSearchParams();

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
  const tabs = ['Chat', 'Bets', 'People'];

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
      privacy: updatedGroup.privacy,
      autoApproveMembers: updatedGroup.autoApproveMembers
    }));
  }, []);

  // Transform data for GroupSettingsTab
  const settingsGroupData = {
    id: typeof groupData.id === 'string' ? parseInt(groupData.id) : parseInt(groupData.id[0]),
    name: groupData.name,
    description: groupData.description,
    memberCount: groupData.memberCount,
    privacy: (groupData as any).privacy || 'PRIVATE' as 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY',
    autoApproveMembers: (groupData as any).autoApproveMembers || false
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
              onPress={() => router.push('/(tabs)/group')}
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
              <Image
                source={groupData.image}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  marginRight: 12
                }}
              />
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {groupData.name}
              </Text>
            </View>

            {/* Settings Button (Admin Only) */}
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
              <View style={{ width: 36, height: 36 }} />
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
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: '#ffffff',
                  flex: 1,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
                }} numberOfLines={1}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 0 ? (
        /* Chat Tab Content */
        <GroupChatTab groupData={groupData} />
      ) : (
        /* Other Tabs - ScrollView Layout */
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20 }}>
            {/* Tab Content */}
            {activeTab === 1 && <GroupBetsTab groupData={groupData} />}
            {activeTab === 2 && <GroupMembersTab groupData={groupData} />}

            {/* Additional spacing for scroll */}
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default GroupMemberView;