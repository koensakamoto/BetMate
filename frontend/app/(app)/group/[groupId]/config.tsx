import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const { groupId, groupName, groupDescription, groupPictureUrl, memberCount, privacy, ownerUsername } = useLocalSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Initialize with params for instant rendering, then update with fresh data
  const initialData: GroupDetailResponse | null = groupId ? {
    id: Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string),
    groupName: (Array.isArray(groupName) ? groupName[0] : groupName) || '',
    description: (Array.isArray(groupDescription) ? groupDescription[0] : groupDescription) || '',
    groupPictureUrl: (Array.isArray(groupPictureUrl) ? groupPictureUrl[0] : groupPictureUrl) || undefined,
    memberCount: parseInt((Array.isArray(memberCount) ? memberCount[0] : memberCount) || '0'),
    privacy: ((Array.isArray(privacy) ? privacy[0] : privacy) || 'PRIVATE') as 'PUBLIC' | 'PRIVATE' | 'SECRET',
    ownerUsername: (Array.isArray(ownerUsername) ? ownerUsername[0] : ownerUsername) || undefined,
    isUserMember: true,
    userRole: 'ADMIN',
  } as GroupDetailResponse : null;

  const [groupData, setGroupData] = useState<GroupDetailResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);

  // Fetch group data only if we don't have params data
  useEffect(() => {
    // Skip fetch entirely if we have data from params
    if (initialData?.groupName) return;

    const fetchGroupData = async () => {
      if (!isAuthenticated || authLoading || !groupId) return;

      try {
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

  const handleGroupUpdated = useCallback((updatedGroup: any) => {
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
  }, []);

  // Transform data for GroupSettingsTab - memoized to prevent unnecessary re-renders
  const settingsGroupData = useMemo(() => groupData ? {
    id: groupData.id,
    name: groupData.groupName,
    description: groupData.description || '',
    memberCount: groupData.memberCount,
    privacy: groupData.privacy || 'PRIVATE' as 'PUBLIC' | 'PRIVATE' | 'SECRET',
    groupPictureUrl: groupData.groupPictureUrl
  } : null, [groupData?.id, groupData?.groupName, groupData?.description, groupData?.memberCount, groupData?.privacy, groupData?.groupPictureUrl]);

  // Check if current user is the owner
  const isOwner = useMemo(() => user?.username === groupData?.ownerUsername, [user?.username, groupData?.ownerUsername]);

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