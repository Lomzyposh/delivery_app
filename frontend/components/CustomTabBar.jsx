import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ORANGE = "#FF5A3C";
const ORANGE_DARK = "#E64E33";
const ICON_INACTIVE = "#A3A3A3";
const TEXT_ACTIVE = "#FF5A3C";
const TEXT_INACTIVE = "#8A8A8A";
const BAR_BG = "#FFFFFF";

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

    const handlePress = (routeName, index) => {
        const event = navigation.emit({
            type: "tabPress",
            target: state.routes[index].key,
            canPreventDefault: true,
        });
        if (!event.defaultPrevented) navigation.navigate(routeName);
    };

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <View style={styles.bar}>
                {state.routes.map((route, index) => {
                    const focused = state.index === index;
                    const options = descriptors[route.key].options;
                    const label = LABELS[route.name] || options.title || route.name;
                    // const isCenter = index === 2;

                    const iconEl =
                        typeof options.tabBarIcon === "function"
                            ? options.tabBarIcon({
                                color: focused ? TEXT_ACTIVE : ICON_INACTIVE,
                                focused,
                                size: 24,
                            })
                            : null;

                    // if (isCenter) {
                    //     return (
                    //         <TouchableOpacity
                    //             key={route.key}
                    //             activeOpacity={0.92}
                    //             onPress={() => handlePress(route.name, index)}
                    //             style={styles.centerButtonWrap}
                    //         >
                    //             <Animated.View
                    //                 style={[
                    //                     styles.centerButton,
                    //                     { backgroundColor: ORANGE, transform: [{ translateY: lift }] },
                    //                 ]}
                    //             >
                    //                 {iconEl}
                    //             </Animated.View>
                    //             <Text style={[styles.centerLabel, { color: focused ? TEXT_ACTIVE : TEXT_INACTIVE }]}>
                    //                 {label}
                    //             </Text>
                    //         </TouchableOpacity>
                    //     );
                    // }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            activeOpacity={0.8}
                            onPress={() => handlePress(route.name, index)}
                            style={styles.item}
                        >
                            <View style={styles.iconOnly}>{iconEl}</View>
                            <Text style={[styles.label, { color: focused ? TEXT_ACTIVE : TEXT_INACTIVE }]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        // backgroundColor: "",
    },
    bar: {
        // marginHorizontal: 16,
        height: 74,
        backgroundColor: BAR_BG,
        borderRadius: 22,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
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
    iconOnly: {
        marginBottom: 4,
    },
    label: {
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "500",
    },
    centerButtonWrap: {
        width: 72,
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: -22,
    },
    centerButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: ORANGE_DARK,
                shadowOpacity: 0.35,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
            },
            android: { elevation: 10 },
        }),
    },
    centerLabel: {
        marginTop: 6,
        fontSize: 11,
        lineHeight: 13,
        fontWeight: "500",
    },
});
