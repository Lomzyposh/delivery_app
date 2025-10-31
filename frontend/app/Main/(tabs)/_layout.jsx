import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomTabBar from "../../../components/CustomTabBar";
import { useTheme } from "../../../contexts/ThemeContext";

export default function RootLayout() {
    const { theme } = useTheme();

    return (
        <Tabs
            // Important: give the screens the right bg too
            sceneContainerStyle={{ backgroundColor: theme.background }}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                // These are backups if you ever fall back to the default bar:
                tabBarActiveTintColor: theme.tint || "#FF6B00",
                tabBarInactiveTintColor: theme.sub || "#888",
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                },
            }}
            // use your custom bar and pass theme down
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
                name="restaurants"
                options={{
                    title: "Restaurants",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={26} color={color} />
                    ),
                }}
            />
            {/* receipt-outline */}
              <Tabs.Screen
                name="orders"
                options={{
                    title: "Orders",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "receipt" : "receipt-outline"} size={26} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="cart"
                options={{
                    title: "Cart",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "bag" : "bag-outline"} size={24} color={color} />
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
