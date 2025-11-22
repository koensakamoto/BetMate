import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen';
import { PushNotificationInitializer } from '../components/notification/PushNotificationInitializer';

const PENDING_INVITE_KEY = 'pending_invite_group_id';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const previousUser = useRef<typeof user>(null);

  // Check for pending invite after user logs in
  useEffect(() => {
    const checkPendingInvite = async () => {
      // Only run when user just logged in (was null, now has value)
      if (previousUser.current === null && user !== null) {
        const pendingGroupId = await SecureStore.getItemAsync(PENDING_INVITE_KEY);
        if (pendingGroupId) {
          await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
          // Small delay to ensure navigation stack is ready
          setTimeout(() => {
            router.push(`/group/${pendingGroupId}/preview`);
          }, 100);
        }
      }
      previousUser.current = user;
    };

    if (!isLoading) {
      checkPendingInvite();
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <AuthLoadingScreen message="Checking authentication..." />;
  }

  return (
    <>
      {/* Initialize push notifications when user is authenticated */}
      {user && <PushNotificationInitializer />}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' }
        }}
      >
        {user ? (
          // Main app screens for authenticated users
          <>
          <Stack.Screen name="index" options={{ href: null }} />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="settings"
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="friends"
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="create-bet"
            options={{
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="create-group"
            options={{
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="submit-proof"
            options={{
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="group"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="invite"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="auth" options={{ href: null }} />
        </>
      ) : (
        // Auth screens for unauthenticated users
        <>
          <Stack.Screen name="index" options={{ href: null }} />
          <Stack.Screen name="(tabs)" options={{ href: null }} />
          <Stack.Screen name="settings" options={{ href: null }} />
          <Stack.Screen name="notifications" options={{ href: null }} />
          <Stack.Screen name="friends" options={{ href: null }} />
          <Stack.Screen name="edit-profile" options={{ href: null }} />
          <Stack.Screen name="create-bet" options={{ href: null }} />
          <Stack.Screen name="create-group" options={{ href: null }} />
          <Stack.Screen name="submit-proof" options={{ href: null }} />
          <Stack.Screen name="group" options={{ href: null }} />
          <Stack.Screen
            name="invite"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="auth"
            options={{ headerShown: false }}
          />
        </>
      )}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
