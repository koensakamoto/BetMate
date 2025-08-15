import { Header } from "@react-navigation/elements";
import { Tabs } from "expo-router";
import { View } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


export default function TabsLayout() {
    return <Tabs screenOptions={{ 
        headerShown: true,
        headerShadowVisible: false
    }}>
        <Tabs.Screen
            name="index"
            options={{
                title: "Home",
                tabBarIcon: ({ color }) => (
                    <MaterialIcons name="home-filled" size={24} color="black" />
                )
            }
            }
        />
        <Tabs.Screen
            name="servers"
            options={{
                title: "Servers",
                tabBarIcon: ({ color }) => (
                    <MaterialIcons name="group" size={24} color={color} />
                )
            }}
        />

        <Tabs.Screen
            name="post"
            options={{
                title: "Post",
                tabBarIcon: ({ color }) => (
                    <MaterialIcons name="add-circle" size={24} color={color} />
                )
            }} />

        <Tabs.Screen
            name="profile"
            options={{
                title: "username",

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
                    <MaterialIcons name="event" size={24} color={color} />
                )
            }}
        />
    </Tabs>;
}
