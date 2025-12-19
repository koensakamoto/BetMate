import { Stack } from "expo-router";
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';
import AuthLoadingScreen from '../../components/auth/AuthLoadingScreen';
import { PushNotificationInitializer } from '../../components/notification/PushNotificationInitializer';
import PendingInviteHandler from '../../components/group/PendingInviteHandler';
import { PresenceProvider } from '../../contexts/PresenceContext';

export default function AppLayout() {
  const { user, isInitializing } = useAuth();

  // Only show loading screen during initial auth check, not during other operations
  if (isInitializing) {
    return <AuthLoadingScreen message="Loading..." />;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <PresenceProvider>
      <PushNotificationInitializer />
      <PendingInviteHandler />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' },
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="friends-list" />
        <Stack.Screen name="find-friends" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="create-bet" />
        <Stack.Screen name="create-group" />
        <Stack.Screen name="view-proof" />
        <Stack.Screen name="group/[groupId]/index" />
        <Stack.Screen name="bet-details/[id]" />
        <Stack.Screen name="bet-participants/[id]" />
        <Stack.Screen name="bet-resolvers/[id]" />
        <Stack.Screen name="bet-resolver-vote/[betId]/[resolverId]" />
        <Stack.Screen name="fulfillment-details/[id]" />
        <Stack.Screen name="profile/[userId]" />
        <Stack.Screen name="inventory/[inventoryItemId]/apply-to-bet" />
      </Stack>
    </PresenceProvider>
  );
}
