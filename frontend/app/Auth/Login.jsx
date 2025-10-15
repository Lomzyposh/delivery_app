import React, { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Alert } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Missing Info", "Please fill in all fields");
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

    const handleSignUpNavigation = () => {
        router.push('/Auth/Signup');
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log in</Text>
            <Text style={styles.subtitle}>
                By logging in, you agree to our <Text style={styles.link}>Terms of Use</Text>
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="Your email"
                value={email}
                onChangeText={setEmail}
            />

            <Text style={styles.label} >Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Your password"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
            />

            <Text style={styles.hint} onPress={handleSignUpNavigation}>Don't have an Account. <Text style={{textDecorationLine: 'underline'}}>Sign Up</Text></Text>
            <Text style={styles.forgot} onPress={() => router.push('/Auth/ForgotPassword')}>Forgot password?</Text>

            <TouchableOpacity style={styles.connectButton} onPress={handleLogin} disabled={loading}>
                <Text style={styles.connectText}>Login</Text>
            </TouchableOpacity>

            

            <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.or}>Or</Text>
                <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="google" size={18} color="#DB4437" style={styles.socialIcon} />
                <Text style={styles.socialText}>Sign in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="facebook" size={18} color="#1877F2" style={styles.socialIcon} />
                <Text style={styles.socialText}>Sign in with Facebook</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
                For more information, please see our <Text style={styles.link}>Privacy policy</Text>.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
        justifyContent: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 10,
    },
    subtitle: {
        marginBottom: 20,
        color: "#444",
    },
    label: {
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 12,
        marginTop: 5,
        marginBottom: 10,
    },
    hint: {
        marginBottom: 20,
        color: "#666",
    },
    connectButton: {
        backgroundColor: "#FF5A00",
        padding: 15,
        borderRadius: 15,
        alignItems: "center",
        marginBottom: 20,
    },
    connectText: {
        color: "#fff",
        fontWeight: "bold",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#ddd",
    },
    or: {
        marginHorizontal: 10,
        color: "#999",
    },
        socialButton: {
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 12,
                borderRadius: 15,
                alignItems: "center",
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'center'
        },
        socialIcon: {
            marginRight: 10,
        },
        socialText: {
            fontSize: 15,
        },
        forgot: {
            marginBottom: 16,
            color: '#666',
            textDecorationLine: 'underline',
            textAlign: 'center'
        },
    footer: {
        textAlign: "center",
        marginTop: 20,
        color: "#444",
    },
    link: {
        fontWeight: "bold",
    },
});
