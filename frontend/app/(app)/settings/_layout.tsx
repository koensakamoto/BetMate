import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0f' },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="change-username" />
      <Stack.Screen name="change-email" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notification-preferences" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="terms-of-service" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
