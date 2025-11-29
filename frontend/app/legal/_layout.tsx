import { Stack } from "expo-router";

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0f' },
        animation: 'none'
      }}
    >
      <Stack.Screen
        name="terms-of-service"
        options={{
          animation: 'none'
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{
          animation: 'none'
        }}
      />
    </Stack>
  );
}
