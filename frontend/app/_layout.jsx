// app/_layout.jsx
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { FavoritesProvider } from "../contexts/FavouriteContext";
import LoadingScreen from "../components/LoadingScreen";

// TIP: You can import useFonts from expo-font to avoid confusion
import { useFonts } from "expo-font";

// FONT FACES
import {
    DynaPuff_400Regular, DynaPuff_600SemiBold, DynaPuff_700Bold,
} from "@expo-google-fonts/dynapuff";
import {
    Orbitron_400Regular, Orbitron_700Bold,
} from "@expo-google-fonts/orbitron";
import {
    Fredoka_500Medium, Fredoka_700Bold,
} from "@expo-google-fonts/fredoka";
import {
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync().catch(() => { });

function AppShell() {
    const { booted } = useAuth();
    if (!booted) return null;

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
        Fredoka_500Medium, Fredoka_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync().catch(() => { });
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <ThemeProvider>
            <AuthProvider>
                <AppShell />
            </AuthProvider>
        </ThemeProvider>
    );
}
