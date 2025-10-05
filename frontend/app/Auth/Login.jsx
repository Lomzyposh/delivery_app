import { View, Text, TextInput, Button, Alert } from "react-native";
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert("Missing Info", "Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            await login(email.trim(), password);
            router.replace('/Main/Home');
        } catch (e) {
            Alert.alert("Error", e.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text>Email</Text>
            <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />

            <Text>Password</Text>
            <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />

            <Button
                title={loading ? "Creating account..." : "Login"}
                onPress={handleSignup}
                disabled={loading}
            />

            <View style={{ marginTop: 10 }}>
                <Button
                    title="Don't have an account? Sign Up"
                    onPress={() => router.replace("Auth/Signup")}
                />
            </View>
        </View>
    );
}