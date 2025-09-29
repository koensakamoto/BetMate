import React, { useState, useEffect, useMemo } from "react";
import { View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import GroupMemberView from '../../../components/group/GroupMemberView';
import GroupPreview from '../../../components/group/GroupPreview';
import { groupService, GroupDetailResponse } from '../../../services/group/groupService';
import { useAuth } from '../../../contexts/AuthContext';

const icon = require("../../../assets/images/icon.png");

export default function GroupDetails() {
  console.log(`🚀 [GroupDetails] === COMPONENT START ===`);

  const searchParams = useLocalSearchParams();
  const { groupId } = searchParams;
  console.log(`🚀 [GroupDetails] 1. Got groupId from params:`, { groupId, type: typeof groupId });
  console.log(`🚀 [GroupDetails] All search params:`, { searchParams, tabParam: searchParams.tab });

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  console.log(`🚀 [GroupDetails] 2. Got auth state:`, { isAuthenticated, authLoading, hasUser: !!user });

  // State for real group name and member count - keyed by groupId to prevent cross-contamination
  const [groupDataCache, setGroupDataCache] = useState<{[key: string]: GroupDetailResponse}>({});
  console.log(`🚀 [GroupDetails] 3. Current groupDataCache:`, {
    cache: groupDataCache,
    cacheKeys: Object.keys(groupDataCache),
    cacheSize: Object.keys(groupDataCache).length
  });

  // Get current group's cached data - use useMemo to ensure this updates when cache changes
  const currentGroupId = useMemo(() => {
    const id = Array.isArray(groupId) ? groupId[0] : groupId;
    console.log(`🚀 [GroupDetails] 4. Calculated currentGroupId:`, {
      currentGroupId: id,
      type: typeof id,
      isArray: Array.isArray(groupId),
      originalGroupId: groupId
    });
    return id;
  }, [groupId]);

  const currentGroupData = useMemo(() => {
    const data = groupDataCache[currentGroupId as string];
    console.log(`🚀 [GroupDetails] 5. Looking up cached data:`, {
      lookupKey: currentGroupId as string,
      foundData: !!data,
      dataKeys: data ? Object.keys(data) : 'NO DATA',
      groupName: data?.groupName || 'NOT FOUND',
      memberCount: data?.memberCount || 'NOT FOUND',
      cacheKeys: Object.keys(groupDataCache),
      fullCache: groupDataCache
    });
    return data;
  }, [groupDataCache, currentGroupId]);

  console.log(`🎯 [GroupDetails] Cache lookup for render:`, {
    groupId,
    currentGroupId,
    hasCurrentGroupData: !!currentGroupData,
    cacheKeys: Object.keys(groupDataCache),
    lookupKey: currentGroupId as string,
    cacheContents: groupDataCache
  });

  console.log(`🔍 [GroupDetails] 6. About to enter useEffect checks:`, {
    isAuthenticated,
    authLoading,
    hasUser: !!user,
    effectDependencies: { groupId, isAuthenticated, authLoading, user: user ? 'EXISTS' : 'NULL' }
  });

  // Check authentication first - don't load data if not authenticated
  useEffect(() => {
    console.log(`🔍 [GroupDetails] Auth check effect triggered:`, {
      authLoading,
      isAuthenticated,
      user: user ? { id: user.id, username: user.username } : null
    });

    if (!authLoading && !isAuthenticated) {
      console.log(`🚫 [GroupDetails] User not authenticated, redirecting to auth`);
      // Could redirect to login page or show auth required message
      return;
    }

    if (!authLoading && isAuthenticated && user) {
      console.log(`✅ [GroupDetails] User is authenticated:`, {
        userId: user.id,
        username: user.username,
        email: user.email
      });
    }
  }, [isAuthenticated, authLoading, user]);

  // Fetch real group name and member count
  useEffect(() => {
    console.log(`🔄 [GroupDetails] Data fetch effect triggered:`, {
      isAuthenticated,
      authLoading,
      groupId,
      currentGroupId,
      hasUser: !!user,
      hasCachedData: !!currentGroupData
    });

    // Only proceed if user is authenticated
    if (!isAuthenticated || authLoading) {
      console.log(`⏳ [GroupDetails] Waiting for authentication... authenticated: ${isAuthenticated}, loading: ${authLoading}`);
      return;
    }
    let isCancelled = false; // Cleanup flag to prevent race conditions
    const currentGroupId = Array.isArray(groupId) ? groupId[0] : groupId;

    console.log(`🚀 [GroupDetails] Starting effect for groupId: ${currentGroupId}`, {
      groupIdType: typeof groupId,
      groupIdValue: groupId,
      currentGroupIdType: typeof currentGroupId,
      currentGroupIdValue: currentGroupId
    });

    const fetchGroupInfo = async () => {
      if (!groupId) {
        console.log(`❌ [GroupDetails] No groupId provided`);
        return;
      }

      try {
        const numericGroupId = Array.isArray(groupId) ? parseInt(groupId[0]) : parseInt(groupId as string);
        console.log(`📡 [GroupDetails] Making API call for group ${numericGroupId}`, {
          originalGroupId: groupId,
          numericGroupId,
          isNumber: !isNaN(numericGroupId)
        });

        const apiResponse: GroupDetailResponse = await groupService.getGroupById(numericGroupId);
        console.log(`✅ [GroupDetails] API response received for group ${numericGroupId}:`, {
          fullResponse: apiResponse,
          groupName: apiResponse.groupName,
          memberCount: apiResponse.memberCount,
          description: apiResponse.description,
          userRole: apiResponse.userRole,
          isCancelled
        });

        // Only update state if this effect hasn't been cancelled (user didn't navigate away)
        if (!isCancelled) {
          console.log(`🔄 [GroupDetails] Updating cache for group ${numericGroupId}:`, {
            name: apiResponse.groupName,
            count: apiResponse.memberCount
          });

          // Force a re-render by updating the cache with a new object reference
          setGroupDataCache(prev => {
            const newCache = {
              ...prev,
              [numericGroupId.toString()]: apiResponse
            };
            console.log(`🔄 [GroupDetails] Cache updated with new data:`, newCache);
            return newCache;
          });
        } else {
          console.log(`🚫 [GroupDetails] Ignoring API response for group ${numericGroupId} (cancelled)`);
        }
      } catch (err) {
        console.error(`💥 [GroupDetails] Failed to fetch group info for ${currentGroupId}:`, err);
        console.error(`💥 [GroupDetails] Full error details:`, {
          message: err?.message,
          status: err?.statusCode,
          stack: err?.stack,
          originalError: err?.originalError
        });
      }
    };

    // Check if we already have data for this group
    if (groupDataCache[currentGroupId as string]) {
      console.log(`💾 [GroupDetails] Using cached data for group ${currentGroupId}:`, {
        cachedData: groupDataCache[currentGroupId as string],
        cacheKeys: Object.keys(groupDataCache)
      });
    } else {
      console.log(`🔄 [GroupDetails] No cache found, fetching data for group ${currentGroupId}`, {
        currentGroupDataCache: groupDataCache,
        cacheKeys: Object.keys(groupDataCache),
        lookingForKey: currentGroupId as string
      });
      fetchGroupInfo();
    }

    // Cleanup function to cancel the effect if component unmounts or groupId changes
    return () => {
      console.log(`🧽 [GroupDetails] Cleanup called for group ${currentGroupId}`);
      isCancelled = true;
    };
  }, [groupId, isAuthenticated, authLoading, user]);

  // Build group data - use cached data if available, fallback to loading placeholders
  // Use useMemo to ensure this recalculates when groupDataCache changes
  const groupData = useMemo(() => {
    console.log(`🔄 [GroupDetails] 7. useMemo groupData calculation starting:`, {
      groupId,
      hasCurrentGroupData: !!currentGroupData,
      currentGroupDataGroupName: currentGroupData?.groupName,
      currentGroupDataMemberCount: currentGroupData?.memberCount,
      cacheKeys: Object.keys(groupDataCache)
    });

    const data = {
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
      image: currentGroupData?.groupPictureUrl || icon,
      totalBets: currentGroupData?.totalMessages || 0,
      userPosition: null, // Not available in API
      groupAchievements: 8 // Placeholder
    };

    console.log(`🔄 [GroupDetails] 8. useMemo groupData calculation completed:`, {
      groupId,
      hasCurrentGroupData: !!currentGroupData,
      finalName: data.name,
      finalMemberCount: data.memberCount,
      cacheKeys: Object.keys(groupDataCache),
      fullCalculatedData: data
    });

    return data;
  }, [groupId, currentGroupData]);

  console.log(`🎯 [GroupDetails] 9. Final render preparation:`, {
    groupId,
    currentGroupId,
    displayedName: groupData.name,
    displayedMemberCount: groupData.memberCount,
    cachedData: currentGroupData,
    cacheKeys: Object.keys(groupDataCache),
    authState: {
      isAuthenticated,
      authLoading,
      hasUser: !!user
    },
    fullGroupData: groupData
  });

  // Render appropriate component based on membership status
  const componentToRender = groupData.isMember
    ? <GroupMemberView key={`group-member-${groupId}`} groupData={groupData} />
    : <GroupPreview key={`group-preview-${groupId}`} groupData={groupData} />;

  console.log(`🎯 [GroupDetails] 10. About to render component:`, {
    groupId,
    componentType: groupData.isMember ? 'GroupMemberView' : 'GroupPreview',
    groupDataPassed: {
      name: groupData.name,
      memberCount: groupData.memberCount,
      isMember: groupData.isMember
    }
  });

  return componentToRender;
}