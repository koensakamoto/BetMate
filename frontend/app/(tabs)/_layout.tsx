import { Header } from "@react-navigation/elements";
import { Tabs } from "expo-router";
import { View } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


export default function TabsLayout() {
    return <Tabs screenOptions={{ 
        headerShown: false,
        headerShadowVisible: false,
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
            name="group/[groupId]"
            options={{
                href: null,
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

                headerRight: () => (
                    <View style={{ paddingRight: 16 }}>
                        <MaterialIcons name="settings" size={30} color="black" />
                    </View>
                ),

                headerLeft: () => (
                    <View style={{ paddingLeft: 16 }}>
                    <MaterialIcons name="account-circle" size={30} color="black" />
                    </View>
                ),

                tabBarIcon: ({ color }) => (
                    <MaterialIcons name="person" size={24} color={color} />
                )
            }}
        />
    </Tabs>;
}
