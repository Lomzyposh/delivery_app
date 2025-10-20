// app/Auth/ResetPassword.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "../../hooks/api";
import { useTheme } from "../../contexts/ThemeContext";
import { usePalette } from "../../utils/palette";

export default function ResetPassword() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const codeParam = Array.isArray(params.code) ? params.code[0] : params.code;
  const emailParam = Array.isArray(params.email) ? params.email[0] : params.email;
  const email = String(emailParam || "");

  const { theme, toggleTheme } = useTheme();
  const p = usePalette(theme);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [focused, setFocused] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const styles = makeStyles(p, focused, !!msg, loading);

  async function handleReset() {
    if (!email) return setMsg("Missing email.");
    if (!password || password.length < 8) return setMsg("Password must be at least 8 characters.");
    if (password !== confirm) return setMsg("Passwords do not match.");

    setMsg("");
    setLoading(true);
    try {
      const payload = { email, newPassword: password };
      if (codeParam) payload.code = codeParam;

      const res = await axios.post(`${API_URL}/api/reset-password`, payload);
      if (res?.data?.success) {
        Alert.alert("Success", "Password reset successfully.", [
          { text: "OK", onPress: () => router.replace("/Auth/Login") },
        ]);
      } else {
        setMsg(res?.data?.message || "Reset failed. Try again.");
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // bounce logo like other screens
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -10,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  return (
    <View style={[styles.screen, { backgroundColor: p.background }]}>
      <StatusBar barStyle={p.statusBarStyle} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <View style={{ margin: 10, justifyContent: "center", alignItems: "center" }} onTouchEnd={toggleTheme}>
          <Animated.Image
            source={require("../../assets/images/foodHutLogo.png")}
            style={{
              width: 120,
              height: 150,
              resizeMode: "contain",
              transform: [{ translateY: bounce }],
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Reset for:</Text>
          <Text style={styles.email}>{email || "—"}</Text>

          {msg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{msg}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>New password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor={p.sub}
            selectionColor={p.tint}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            style={[styles.input]}
            returnKeyType="next"
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="Re-enter password"
            placeholderTextColor={p.sub}
            selectionColor={p.tint}
            onFocus={() => setFocused("confirm")}
            onBlur={() => setFocused(null)}
            style={[styles.input]}
            returnKeyType="send"
            onSubmitEditing={handleReset}
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? "Resetting…" : "Reset password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/Auth/Login")} activeOpacity={0.8}>
            <Text style={styles.hint}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(p, focused, hasError, loading) {
  const borderFor = (field) =>
    hasError ? p.error : focused === field ? p.tint : p.border;

  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    card: {
      backgroundColor: p.card,
      borderColor: p.border,
      borderWidth: 1,
      marginHorizontal: 20,
      padding: 20,
      borderRadius: 16,
      gap: 10,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    title: {
      color: p.text,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    subtitle: {
      color: p.sub,
      marginBottom: 2,
      lineHeight: 20,
    },
    email: {
      color: p.tint,
      fontWeight: "700",
      marginBottom: 8,
    },
    errorBanner: {
      backgroundColor: p.bannerBg,
      borderColor: p.error,
      borderWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
    },
    errorText: {
      color: p.error,
      fontWeight: "600",
    },
    label: {
      color: p.sub,
      fontWeight: "700",
      marginTop: 6,
    },
    input: {
      backgroundColor: p.field,
      color: p.text,
      borderWidth: 1.5,
      borderRadius: 12,
      padding: 12,
      borderColor: borderFor(focused), 
    },
    primaryBtn: {
      backgroundColor: loading ? p.buttonDisabled : p.tint,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      marginTop: 10,
    },
    primaryBtnText: {
      color: "#fff",
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    hint: {
      color: p.sub,
      textAlign: "center",
      marginTop: 6,
    },
  });
}
