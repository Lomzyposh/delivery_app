import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Alert } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";

export default function SignupScreen() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Info", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      router.replace('/Main/home');
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join us — create an account to order delicious meals</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Your full name"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
        placeholder="you@example.com"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholder="Enter password"
      />

      <TouchableOpacity style={styles.connectButton} onPress={handleSignup} disabled={loading}>
        <Text style={styles.connectText}>{loading ? "Creating account..." : "Sign Up"}</Text>
      </TouchableOpacity>

      

      <Text style={styles.footer}>
        By creating an account you agree to our <Text style={styles.link}>Terms of Use</Text> and <Text style={styles.link}>Privacy Policy</Text>.
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
      marginBottom: 8,
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
      marginTop: 12,
      marginBottom: 10,
      color: "#666",
      textAlign: 'center'
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
    footer: {
      textAlign: "center",
      marginTop: 20,
      color: "#444",
    },
    link: {
      fontWeight: "bold",
    },
  });
