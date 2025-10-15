// app/_layout.jsx
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";

import {
    DynaPuff_400Regular, DynaPuff_600SemiBold, DynaPuff_700Bold, useFonts,
} from "@expo-google-fonts/dynapuff";
import { Orbitron_400Regular, Orbitron_700Bold } from "@expo-google-fonts/orbitron";
import { Fredoka_500Medium, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import {
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ThemeProvider } from "../contexts/ThemeContext";
import { FavoritesProvider } from "../contexts/FavouriteContext";

SplashScreen.preventAutoHideAsync().catch(() => { });

// Inner shell: safe place to use useAuth (we are inside AuthProvider here)
function AppShell() {
    const { booted } = useAuth(); 

    if (!booted) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <FavoritesProvider>
            <CartProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </CartProvider>
        </FavoritesProvider>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        DynaPuff_400Regular, DynaPuff_600SemiBold, DynaPuff_700Bold,
        Orbitron_400Regular, Orbitron_700Bold,
        Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
        Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
        Fredoka_700Bold, Fredoka_500Medium,
    });

    useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync().catch(() => { }); }, [fontsLoaded]);
    if (!fontsLoaded) return null;

    return (

        <ThemeProvider>
            <AuthProvider>

                <AppShell />
            </AuthProvider>
        </ThemeProvider>
    );
}
