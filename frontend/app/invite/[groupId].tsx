import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../contexts/AuthContext';

const PENDING_INVITE_KEY = 'pending_invite_group_id';

export default function InviteRedirect() {
  const { groupId } = useLocalSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const handleRedirect = async () => {
      // Security: Validate and sanitize groupId parameter
      const rawGroupId = Array.isArray(groupId) ? groupId[0] : groupId;

      // Validate that groupId is a positive integer
      const parsedGroupId = parseInt(rawGroupId as string, 10);
      if (!rawGroupId || isNaN(parsedGroupId) || parsedGroupId <= 0) {
        router.replace('/(tabs)' as any);
        return;
      }

      const numericGroupId = String(parsedGroupId);

      if (isAuthenticated) {
        // User is logged in - go to group preview
        router.replace(`/group/${numericGroupId}/preview`);
      } else {
        // User not logged in - store the group ID and go to login
        await SecureStore.setItemAsync(PENDING_INVITE_KEY, numericGroupId);
        router.replace('/auth/login');
      }
    };

    handleRedirect();
  }, [groupId, isAuthenticated, isLoading]);

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
export { PENDING_INVITE_KEY };
