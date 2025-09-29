import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Info", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      navigation.replace("Home"); // same flow as login → go to Home
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

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
        title={loading ? "Creating account..." : "Sign Up"}
        onPress={handleSignup}
        disabled={loading}
      />

      <View style={{ marginTop: 10 }}>
        <Button
          title="Already have an account? Login"
          onPress={() => navigation.replace("Login")}
        />
      </View>
    </View>
  );
}
