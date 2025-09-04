import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack >
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
      </Stack>
    </>
  );
}
