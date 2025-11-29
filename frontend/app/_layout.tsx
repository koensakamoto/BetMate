import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { toastConfig } from '../components/ui/ToastConfig';

// Keep splash screen visible while we fetch auth state
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading } = useAuth();

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      // Hide splash screen with a smooth fade
      await SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0f' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="invite" />
      <Stack.Screen
        name="legal"
        options={{
          animation: 'none'
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <BottomSheetModalProvider>
              <StatusBar style="light" />
              <RootLayoutNav />
              <Toast config={toastConfig} position="top" topOffset={0} />
            </BottomSheetModalProvider>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
