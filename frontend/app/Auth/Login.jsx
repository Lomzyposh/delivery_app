import { View, Text, TextInput, Button, Alert } from "react-native";
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        setErrorMsg('')
        if (!email || !password) {
            Alert.alert("Missing Info", "Please fill in all fields");
            return;
        }

        const trimmed = email.trim().toLowerCase();
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

        if (!trimmed) {
            setErrorMsg('Email is required.');
            return;
        }
        if (!isValidEmail) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            await login(email.trim(), password);
            router.replace('/Main/home');
        } catch (e) {
            Alert.alert("Error", e.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = () => {
        router.replace("Auth/ForgotPassword")
    }

    return (
        <View style={{ padding: 20 }}>
            {!!errorMsg && <Text style={{ color: 'red', marginTop: 4 }}>{errorMsg}</Text>}
            <Text>Email</Text>
            <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, marginTop: 8, marginBottom: 12, padding: 10, borderRadius: 8 }}
                placeholder="you@example.com"
            />

            <Text>Password</Text>
            <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <Text
                style={{ textDecorationLine: 'underline' }}
                onPress={handleForgot}
            >Forgoot Password</Text>

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