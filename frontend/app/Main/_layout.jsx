// app/(tabs)/_layout.jsx
import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { fonts } from "../../constants/theme";

const tint = "#ff7f50";              
const barBg = "#fff"; 
const label = "#252525";
const dim = "#9BA1A6";

function TabIcon({ name, focused, size = 24 }) {
    const color = focused ? tint : dim;

  
    return <MaterialIcons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: tint,
                tabBarInactiveTintColor: dim,
                tabBarLabelStyle: {
                    fontSize: 13,
                    marginTop: 2,
                    fontFamily: fonts.poppinsRegular,
                    color: label,
                },
                tabBarStyle: {
                    position: "absolute",
                    height: 70,
                    paddingTop: 8,
                    paddingBottom: 12,
                    paddingHorizontal: 18,
                    borderTopWidth: 0,
                    backgroundColor: barBg,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                    // shadowColor: "#000",
                    // shadowOpacity: 0.2,
                    // shadowRadius: 8,
                    // shadowOffset: { width: 0, height: 4 },
                    // elevation: 8,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="home" focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="saved"
                options={{
                    title: "Saved",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="favorite-border" focused={focused} />
                    ),
                }}
            />
<Tabs.Screen
  name="cart"
  options={{
    title: "Cart",
    tabBarBadge: 2,
    tabBarBadgeStyle: {
      backgroundColor: tint,
      color: "white",
      fontSize: 10,
      minWidth: 18,
      height: 15,
    },
    tabBarIcon: ({ focused }) => (
      <View style={{ transform: [{ translateY: -4 }] }}>
        <TabIcon name="shopping-cart" focused={focused} size={30} />
      </View>
    ),
  }}
/>


            <Tabs.Screen
                name="orders"
                options={{
                    title: "Orders",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="receipt-long" focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="account"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="person-outline" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}
