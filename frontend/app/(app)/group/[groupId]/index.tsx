import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GroupMemberView from '../../../../components/group/GroupMemberView';
import GroupPreview from '../../../../components/group/GroupPreview';
import { groupService, GroupDetailResponse } from '../../../../services/group/groupService';
import { useAuth } from '../../../../contexts/AuthContext';
import { getFullImageUrl } from '../../../../utils/avatarUtils';
import { SkeletonGroupDetail } from '../../../../components/common/SkeletonCard';

export default function GroupDetails() {
  const searchParams = useLocalSearchParams();
  const { groupId } = searchParams;
  const insets = useSafeAreaInsets();

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // State for real group name and member count - keyed by groupId to prevent cross-contamination
  const [groupDataCache, setGroupDataCache] = useState<{[key: string]: GroupDetailResponse}>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get current group's cached data - use useMemo to ensure this updates when cache changes
  const currentGroupId = useMemo(() => {
    return Array.isArray(groupId) ? groupId[0] : groupId;
  }, [groupId]);

  const currentGroupData = useMemo(() => {
    return groupDataCache[currentGroupId as string];
  }, [groupDataCache, currentGroupId]);

  // Check authentication first - don't load data if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Could redirect to login page or show auth required message
      return;
    }
  }, [isAuthenticated, authLoading, user]);

  // Fetch real group name and member count
  useEffect(() => {
    // Only proceed if user is authenticated
    if (!isAuthenticated || authLoading) {
      return;
    }
    let isCancelled = false; // Cleanup flag to prevent race conditions
    const currentGroupId = Array.isArray(groupId) ? groupId[0] : groupId;

    const fetchGroupInfo = async () => {
      if (!groupId) {
        setIsLoading(false);
        return;
      }

      try {
        const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);

        const apiResponse: GroupDetailResponse = await groupService.getGroupById(numericGroupId);

        // Only update state if this effect hasn't been cancelled (user didn't navigate away)
        if (!isCancelled) {
          // Force a re-render by updating the cache with a new object reference
          setGroupDataCache(prev => ({
            ...prev,
            [numericGroupId.toString()]: apiResponse
          }));
          setIsLoading(false);
        }
      } catch (err) {
        console.error(`Failed to fetch group info for ${currentGroupId}:`, err);
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    // Check if we already have data for this group
    if (!groupDataCache[currentGroupId as string]) {
      setIsLoading(true);
      fetchGroupInfo();
    } else {
      // Data already cached, no need to show loading
      setIsLoading(false);
    }

    // Cleanup function to cancel the effect if component unmounts or groupId changes
    return () => {
      isCancelled = true;
    };
  }, [groupId, isAuthenticated, authLoading, user]);

  // Build group data - use cached data if available, fallback to loading placeholders
  // Use useMemo to ensure this recalculates when groupDataCache changes
  const groupData = useMemo(() => {
    return {
      id: groupId,
      name: currentGroupData?.groupName || 'Loading...',
      description: currentGroupData?.description || '',
      memberCount: currentGroupData?.memberCount || 0,
      createdDate: currentGroupData?.createdAt
        ? new Date(currentGroupData.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          })
        : 'Loading...',
      isAdmin: currentGroupData?.userRole === 'ADMIN' || false,
      isMember: currentGroupData?.isUserMember || true, // Assume member to show UI
      image: getFullImageUrl(currentGroupData?.groupPictureUrl),
      groupPictureUrl: currentGroupData?.groupPictureUrl, // Raw URL for settings tab
      privacy: currentGroupData?.privacy,
      totalBets: currentGroupData?.totalMessages || 0,
      userPosition: null, // Not available in API
      groupAchievements: 8, // Placeholder
      userRole: currentGroupData?.userRole, // Add userRole field for GroupMemberView
      ownerUsername: currentGroupData?.ownerUsername // Add ownerUsername to identify group owner
    };
  }, [groupId, currentGroupData]);

  // Show loading skeleton while fetching data
  if (isLoading || authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', paddingTop: insets.top }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        <SkeletonGroupDetail />
      </View>
    );
  }

  // Render appropriate component based on membership status
  return groupData.isMember
    ? <GroupMemberView key={`group-member-${groupId}`} groupData={groupData} />
    : <GroupPreview key={`group-preview-${groupId}`} groupData={groupData} />;
}
