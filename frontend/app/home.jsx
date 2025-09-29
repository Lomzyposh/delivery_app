import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Feather, Ionicons } from "@expo/vector-icons";

// --- palette from your food app vibe
const tint = "#ff7f50";              // accent (orange/coral)
const barBg = "rgba(20,20,22,0.85)"; // translucent dark
const iconDefault = "#9BA1A6";
const textLight = "#ECEDEE";

function HomeScreen() {
    return (
        <View style={styles.screen}><Text style={styles.text}>Home</Text></View>
    );
}
function OrdersScreen() {
    return (
        <View style={styles.screen}><Text style={styles.text}>Orders</Text></View>
    );
}
function ProfileScreen() {
    return (
        <View style={styles.screen}><Text style={styles.text}>Profile</Text></View>
    );
}

const Tab = createBottomTabNavigator();

function CenterTabButton({ children, onPress }) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.centerBtnWrap}
        >
            <View style={styles.centerBtn}>
                {children}
            </View>
        </TouchableOpacity>
    );
}


// add near your palette
const activePillBg = "rgba(255,127,80,0.18)"; // soft orange glow behind active icon

function TabIcon({ focused, children }) {
    return (
        <View
            style={[
                {
                    padding: 10,
                    borderRadius: 14,
                    justifyContent: "center",
                    alignItems: "center",
                },
                focused && {
                    backgroundColor: activePillBg,
                    // subtle lift like the design
                    ...Platform.select({
                        android: { elevation: 4 },
                        ios: {
                            shadowColor: "#000",
                            shadowOpacity: 0.18,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 4 },
                        },
                    }),
                },
            ]}
        >
            {children}
        </View>
    );
}


export default function App() {
    return (
        // <NavigationContainer>
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 16,
                    height: 74,
                    borderRadius: 28,
                    backgroundColor: barBg,     // fallback if BlurView not supported
                    borderTopWidth: 0,
                    paddingHorizontal: 20,
                    ...Platform.select({
                        android: { elevation: 12 },
                        ios: {
                            shadowColor: "#000",
                            shadowOpacity: 0.2,
                            shadowRadius: 16,
                            shadowOffset: { width: 0, height: 10 },
                        },
                    }),
                },
                tabBarBackground: () => (
                    <BlurView
                        intensity={40}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                ),
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Feather
                            name="home"
                            size={24}
                            color={focused ? tint : iconDefault}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Homp"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Feather
                            name="home"
                            size={24}
                            color={focused ? tint : iconDefault}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Order"
                component={OrdersScreen}
                options={{
                    // Big center circular button
                    tabBarButton: (props) => <CenterTabButton {...props} />,
                    tabBarIcon: ({ focused }) => (
                        <Ionicons
                            name="bag-handle"
                            size={26}
                            color="#fff"
                            style={{ transform: [{ translateY: 1 }] }}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Feather
                            name="user"
                            size={24}
                            color={focused ? tint : iconDefault}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Setting"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Feather
                            name="settings"
                            size={24}
                            color={focused ? tint : iconDefault}
                        />
                    ),
                }}
            />

        </Tab.Navigator>
        // </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#0f1113", alignItems: "center", justifyContent: "center" },
    text: { color: textLight, fontSize: 18 },
    centerBtnWrap: {
        top: -24,                        // lift above the bar
        justifyContent: "center",
        alignItems: "center",
    },
    centerBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: tint,           // primary orange
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            android: { elevation: 8 },
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
            },
        }),
    },
});
