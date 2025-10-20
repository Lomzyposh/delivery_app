import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, StatusBar, Animated } from "react-native";
import { Colors, fonts } from "../constants/theme";
import InfiniteDotsLoader from "./InfiniteDotsLoader";
import { useTheme } from "../contexts/ThemeContext";
import { usePalette } from "../utils/palette";

const BRAND_BG = "#252525"


export default function FoodHutSplash() {
    const fade = useRef(new Animated.Value(0)).current;
    const bump = useRef(new Animated.Value(0.92)).current;
    // const { theme } = useTheme();
    const { theme, toggleTheme } = useTheme();

    const palette = usePalette(theme);


    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.spring(bump, { toValue: 1, speed: 1.8, bounciness: 12, useNativeDriver: true }),
        ]).start();
    }, [fade, bump]);

    return (
        <View style={[styles.root, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.card}>
                <Animated.View style={{ alignItems: "center", opacity: fade, transform: [{ scale: bump }] }}>
                    <View style={styles.brandRow}>
                        <Image
                            source={require("../assets/images/foodHutLogo.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.brandText, { fontFamily: "Fredoka_700Bold", color: palette.tint }]}>Food Hut</Text>
                    </View>

                    {/* <Text style={styles.tagline}>Food Delivery</Text> */}
                </Animated.View>

                <View style={styles.loaderWrap}>
                    <InfiniteDotsLoader
                        dotCount={6}
                        dotSize={15}
                        dotSpacing={8}
                        color={Colors?.tintColorLight || "#20C063"}
                        duration={700}
                        scaleRange={[0.35, 1]}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
    card: {
        width: "100%",
        maxWidth: 420,
        height: 620,
        backgroundColor: "transparent",
        borderRadius: 28,
        // shadowColor: Colors.splashColor,
        // shadowOpacity: 0.1,
        // shadowRadius: 18,
        // shadowOffset: { width: 0, height: 10 },
        // elevation: 14,
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 24,
        alignItems: "center",
        justifyContent: "space-between",
    },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    logo: { width: 60, height: 80 },
    brandText: {
        fontSize: 50,
        letterSpacing: 0.2,
    },
    tagline: {
        marginTop: 8,
        fontSize: 14,
        color: "#6b7280",
        fontFamily: "DynaPuff_700Bold"
    },
    loaderWrap: {
        width: "100%",
        alignItems: "center",
        paddingBottom: 6,
    },
});
