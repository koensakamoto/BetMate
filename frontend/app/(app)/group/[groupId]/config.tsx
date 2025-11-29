import React, { useState, useEffect } from 'react';
import { View, StatusBar, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import GroupSettingsTab from '../../../../components/group/GroupSettingsTab';
import { groupService, GroupDetailResponse } from '../../../../services/group/groupService';
import { useAuth } from '../../../../contexts/AuthContext';

export default function GroupConfig() {
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [groupData, setGroupData] = useState<GroupDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!isAuthenticated || authLoading || !groupId) return;

      try {
        setIsLoading(true);
        const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
        const data = await groupService.getGroupById(numericGroupId);
        setGroupData(data);
      } catch (error) {
        // Error handled silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, isAuthenticated, authLoading]);

  const handleGroupUpdated = (updatedGroup: any) => {
    setGroupData(prev => {
      if (!prev) return null;

      return {
        ...prev,
        groupName: updatedGroup.groupName ?? updatedGroup.name ?? prev.groupName,
        description: updatedGroup.description ?? prev.description,
        privacy: updatedGroup.privacy ?? prev.privacy,
        groupPictureUrl: updatedGroup.groupPictureUrl ?? prev.groupPictureUrl,
        ...(updatedGroup.memberCount !== undefined && { memberCount: updatedGroup.memberCount }),
        ...(updatedGroup.updatedAt !== undefined && { updatedAt: updatedGroup.updatedAt }),
      };
    });
  };

  // Transform data for GroupSettingsTab
  const settingsGroupData = groupData ? {
    id: groupData.id,
    name: groupData.groupName,
    description: groupData.description,
    memberCount: groupData.memberCount,
    privacy: groupData.privacy || 'PRIVATE' as 'PUBLIC' | 'PRIVATE' | 'SECRET',
    groupPictureUrl: groupData.groupPictureUrl
  } : null;

  // Check if current user is the owner
  const isOwner = user?.username === groupData?.ownerUsername;

  if (isLoading || !groupData || !settingsGroupData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        {/* Loading state - you can add a spinner here */}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
      >
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center'
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

          {/* Title */}
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#ffffff'
          }}>
            Group Settings
          </Text>
        </View>

        {/* Settings Content */}
        <View style={{ paddingHorizontal: 20 }}>
          <GroupSettingsTab
            groupData={settingsGroupData}
            isOwner={isOwner}
            currentUsername={user?.username}
            onGroupUpdated={handleGroupUpdated}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}