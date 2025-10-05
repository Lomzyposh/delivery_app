import { Slot, SplashScreen, Stack, Tabs, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

import {
    DynaPuff_400Regular,
    DynaPuff_600SemiBold,
    DynaPuff_700Bold,
    useFonts,
} from "@expo-google-fonts/dynapuff";
import {
    Orbitron_400Regular,
    Orbitron_700Bold,
} from "@expo-google-fonts/orbitron";

import { Fredoka_500Medium, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from "@expo-google-fonts/inter";

import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const { user} = useAuth();
//   const router = useRouter();

//   if (!booted) {
//     return <OnboardingScreen/>;
//   }

//   if (!user) {
//     router.replace("/Auth/Login");
//   } else {
//     router.replace("/Main/home");
//   }

//   return <Slot />;
// }
export default function RootLayout() {

    const [fontsLoaded] = useFonts({
        DynaPuff_400Regular,
        DynaPuff_600SemiBold,
        DynaPuff_700Bold,
        Orbitron_400Regular,
        Orbitron_700Bold,
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Fredoka_700Bold,
        Fredoka_500Medium
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <AuthProvider>
            <Stack screenOptions={{
                headerShown: false,
            }}>
            </Stack>
        </AuthProvider>
    )
}
