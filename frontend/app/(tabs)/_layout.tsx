import { Tabs } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';


export default function TabsLayout() {
    return <Tabs screenOptions={{ 
        headerShown: false,
        headerShadowVisible: false,
        swipeEnabled: false,
        tabBarStyle: {
            backgroundColor: '#0a0a0f',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            height: 85,
            paddingBottom: 10,
            paddingTop: 10
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4
        }
    }}>
        <Tabs.Screen
            name="group/index"
            options={{
                title: "Group",
                tabBarIcon: ({ color }) => (
                    <MaterialIcons name="group" size={24} color={color} />
                )
            }}
        />
        <Tabs.Screen
            name="bet"
            options={{
                title: "Bet",
                tabBarIcon: ({ color }) => (
                    <MaterialIcons name="casino" size={24} color={color} />
                )
            }}
        />
        <Tabs.Screen
            name="store"
            options={{
                title: "Store",
                tabBarIcon: ({ color }) => (
                    <MaterialIcons name="store" size={24} color={color} />
                )
            }}
        />
        <Tabs.Screen
            name="profile"
            options={{
                title: "Profile",
                tabBarIcon: ({ color }) => (
                    <MaterialIcons name="person" size={24} color={color} />
                )
            }}
        />
    </Tabs>;
}
