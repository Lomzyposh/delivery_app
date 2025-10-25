import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomTabBar from "../../../components/CustomTabBar";
import { useTheme } from "../../../contexts/ThemeContext";

export default function RootLayout() {
    const { theme } = useTheme();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: "#FF6B00",
                tabBarInactiveTintColor: "#222",
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopColor: theme.border,
                },
            }}
            tabBar={(props) => <CustomTabBar {...props} theme={theme} />}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="saved"
                options={{
                    title: "Saved",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} />
                    ),
                }}
            />
         
            <Tabs.Screen
                name="restaurants"
                options={{
                    title: "Restaurants",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
