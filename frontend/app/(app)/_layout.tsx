import { Stack } from "expo-router";
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';
import AuthLoadingScreen from '../../components/auth/AuthLoadingScreen';
import { PushNotificationInitializer } from '../../components/notification/PushNotificationInitializer';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen message="Loading..." />;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <>
      <PushNotificationInitializer />
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
        <Stack.Screen name="group" />
        <Stack.Screen name="bet-details" />
        <Stack.Screen name="bet-participants" />
        <Stack.Screen name="bet-resolvers" />
        <Stack.Screen name="bet-resolver-vote" />
        <Stack.Screen name="fulfillment-details" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="inventory" />
      </Stack>
    </>
  );
}
