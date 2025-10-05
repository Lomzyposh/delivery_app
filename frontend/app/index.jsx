import React, { useEffect, useState } from "react";

import { View, Text, StyleSheet, Button } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import OnboardingScreen from "../components/Onboarding";
import LoadingScreen from "../components/LoadingScreen";
import Onboarding2 from "../components/Onboarding2";

export default function App() {
    const [msg, setMsg] = useState("");
    const router = useRouter();

    useEffect(() => {
        axios.get("http://192.168.177.224:5000/api/hello")
            .then(res => setMsg(res.data.message))
            .catch(err => console.error(err));
    }, []);

    return (
        // <OnboardingScreen buttonPosition="top" indicatorStyle="dash" />
        // <LoadingScreen />
        <Onboarding2 />
    );
}

const styles = StyleSheet.create({});
