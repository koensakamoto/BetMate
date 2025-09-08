import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0f' },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          animation: 'fade'
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal'
        }}
      />
    </Stack>
  );
}