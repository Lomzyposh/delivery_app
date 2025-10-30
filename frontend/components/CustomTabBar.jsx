import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Fallbacks only; we’ll prefer theme.*
const DEFAULT_TINT = "#FF5A3C";

const LABELS = {
    home: "Home",
    saved: "Saved",
    cart: "Cart",
    orders: "Orders",
    profile: "Profile",
};

export default function CustomTabBar({ state, descriptors, navigation, theme }) {
    const insets = useSafeAreaInsets();
    const lift = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const cartFocused = state.index === 2;
        Animated.spring(lift, {
            toValue: cartFocused ? -22 : 0,
            useNativeDriver: true,
            damping: 14,
            stiffness: 180,
            mass: 0.8,
        }).start();
    }, [state.index]);

    const onPress = (routeName, index) => {
        const event = navigation.emit({
            type: "tabPress",
            target: state.routes[index].key,
            canPreventDefault: true,
        });
        if (!event.defaultPrevented) navigation.navigate(routeName);
    };

    const tint = theme.tint || DEFAULT_TINT;
    const bg = theme.card || "#111";            // bar tile bg
    const wrapperBg = theme.background || "#000";
    const border = theme.border || "rgba(255,255,255,0.08)";
    const text = theme.text || "#fff";
    const sub = theme.sub || "#9aa0ae";

    return (
        <View
            style={[
                styles.wrapper,
                {
                    backgroundColor: wrapperBg,
                    paddingBottom: Math.max(insets.bottom - 4, 0),
                    borderTopColor: border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                },
            ]}
        >
            <View
                style={[
                    styles.bar,
                    {
                        backgroundColor: bg,
                        borderColor: border,
                    },
                ]}
            >
                {state.routes.map((route, index) => {
                    const focused = state.index === index;
                    const options = descriptors[route.key].options;
                    const label = LABELS[route.name] || options.title || route.name;

                    const iconColor = focused ? tint : sub;
                    const labelColor = focused ? tint : sub;

                    const iconEl =
                        typeof options.tabBarIcon === "function"
                            ? options.tabBarIcon({ color: iconColor, focused, size: 24 })
                            : null;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            activeOpacity={0.85}
                            onPress={() => onPress(route.name, index)}
                            style={styles.item}
                        >
                            <View style={styles.iconOnly}>{iconEl}</View>
                            <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        // outer container matches screen background
    },
    bar: {
        height: 74,
        borderRadius: 22,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
            },
            android: { elevation: 12 },
        }),
    },
    item: {
        width: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    iconOnly: { marginBottom: 4 },
    label: { fontSize: 10, lineHeight: 13, fontWeight: "600" },
});