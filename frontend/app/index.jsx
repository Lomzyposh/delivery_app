import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import FoodHutSplash from "../components/FoodHutSplash";
import OnboardingScreen from "../components/Onboarding";
import LoadingScreen from "../components/LoadingScreen";

export default function AppIndex() {
    const { user, booted } = useAuth();
    const [readyToRoute, setReadyToRoute] = useState(false);

    useEffect(() => {
        if (!booted) return;
        const t = setTimeout(() => setReadyToRoute(true), 2500);
        return () => clearTimeout(t);
    }, [booted]);

    if (!booted || !readyToRoute) return <FoodHutSplash />;

    // if (user) return <Redirect href="/Main/(tabs)/home" />;FoodHut
    return <OnboardingScreen />;
}
