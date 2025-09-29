import React, { useEffect, useState } from "react";

import { View, Text, StyleSheet, Button } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import OnboardingScreen from "../components/Onboarding";

export default function App() {
    const [msg, setMsg] = useState("");
    const router = useRouter();

    useEffect(() => {
        axios.get("http://192.168.177.224:5000/api/hello")
            .then(res => setMsg(res.data.message))
            .catch(err => console.error(err));
    }, []);

    return (
        <OnboardingScreen buttonPosition="top" indicatorStyle="dash" />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    text: { fontSize: 20 }
});
