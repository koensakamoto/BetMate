import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/auth/LoadingScreen';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
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
            name="followers"
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
          <Stack.Screen name="auth" options={{ href: null }} />
        </>
      ) : (
        // Auth screens for unauthenticated users
        <>
          <Stack.Screen name="index" options={{ href: null }} />
          <Stack.Screen name="(tabs)" options={{ href: null }} />
          <Stack.Screen name="settings" options={{ href: null }} />
          <Stack.Screen name="notifications" options={{ href: null }} />
          <Stack.Screen name="followers" options={{ href: null }} />
          <Stack.Screen name="edit-profile" options={{ href: null }} />
          <Stack.Screen name="create-bet" options={{ href: null }} />
          <Stack.Screen
            name="auth"
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
