import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../contexts/AuthContext';
import { groupService } from '../../services/group/groupService';

const PENDING_INVITE_KEY = 'pending_invite_group_id';
const PENDING_INVITE_TOKEN_KEY = 'pending_invite_token';

export default function InviteRedirect() {
  const { groupId, token } = useLocalSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const handleRedirect = async () => {
      // Security: Validate and sanitize groupId parameter
      const rawGroupId = Array.isArray(groupId) ? groupId[0] : groupId;
      const rawToken = Array.isArray(token) ? token[0] : token;

      // Validate that groupId is a positive integer
      const parsedGroupId = parseInt(rawGroupId as string, 10);
      if (!rawGroupId || isNaN(parsedGroupId) || parsedGroupId <= 0) {
        router.replace('/(tabs)' as any);
        return;
      }

      const numericGroupId = String(parsedGroupId);

      if (isAuthenticated) {
        // User is logged in - check membership status
        try {
          const groupData = await groupService.getGroupById(parsedGroupId);

          if (groupData.userMembershipStatus === 'APPROVED') {
            // Already a member - go directly to the group
            router.replace(`/group/${numericGroupId}`);
          } else {
            // Not a member or pending - go to preview with token if available
            if (rawToken) {
              router.replace(`/group/${numericGroupId}/preview?token=${rawToken}`);
            } else {
              router.replace(`/group/${numericGroupId}/preview`);
            }
          }
        } catch (error) {
          // Group doesn't exist or error fetching - go to preview which will handle the error
          if (rawToken) {
            router.replace(`/group/${numericGroupId}/preview?token=${rawToken}`);
          } else {
            router.replace(`/group/${numericGroupId}/preview`);
          }
        }
      } else {
        // User not logged in - store the group ID and token, then go to login
        await SecureStore.setItemAsync(PENDING_INVITE_KEY, numericGroupId);
        if (rawToken) {
          await SecureStore.setItemAsync(PENDING_INVITE_TOKEN_KEY, rawToken as string);
        }
        router.replace('/auth/login');
      }
    };

    handleRedirect();
  }, [groupId, token, isAuthenticated, isLoading]);

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0a0a0f',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <ActivityIndicator size="large" color="#00D4AA" />
      <Text style={{
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 16,
        fontSize: 16
      }}>
        Loading invite...
      </Text>
    </View>
  );
}

// Export for use in auth flow
export { PENDING_INVITE_KEY, PENDING_INVITE_TOKEN_KEY };
