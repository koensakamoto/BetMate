import React, { useMemo } from "react";
import { View, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GroupMemberView from '../../../../components/group/GroupMemberView';
import GroupPreview from '../../../../components/group/GroupPreview';
import { useAuth } from '../../../../contexts/AuthContext';
import { getFullImageUrl } from '../../../../utils/avatarUtils';
import { SkeletonGroupDetail } from '../../../../components/common/SkeletonCard';
import { useGroup } from '../../../../hooks/useGroupQueries';

export default function GroupDetails() {
  const searchParams = useLocalSearchParams();
  const { groupId } = searchParams;
  const insets = useSafeAreaInsets();

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Parse groupId
  const numericGroupId = useMemo(() => {
    const id = Array.isArray(groupId) ? groupId[0] : groupId;
    return id ? parseInt(id) : undefined;
  }, [groupId]);

  // Use React Query hook - gets instant data from cache if available
  const { data: currentGroupData, isLoading } = useGroup(
    isAuthenticated ? numericGroupId : undefined
  );

  // Build group data from cached/fetched data
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
      isMember: currentGroupData?.isUserMember ?? true, // Assume member to show UI
      image: getFullImageUrl(currentGroupData?.groupPictureUrl) ?? null,
      groupPictureUrl: currentGroupData?.groupPictureUrl,
      privacy: currentGroupData?.privacy,
      totalBets: currentGroupData?.totalMessages || 0,
      userPosition: null,
      groupAchievements: 8,
      userRole: currentGroupData?.userRole,
      ownerUsername: currentGroupData?.ownerUsername
    };
  }, [groupId, currentGroupData]);

  // Show loading skeleton only if we have no data at all
  // If we have cached data from the list, we skip the skeleton entirely
  if ((isLoading && !currentGroupData) || authLoading) {
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
