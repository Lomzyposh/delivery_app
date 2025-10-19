// app/Auth/SignupScreen.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { Colors } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { usePalette } from "../../utils/palette";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const palette = usePalette(theme);
  const styles = currentStyles(); // layout-only; colors come from palette

  // form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", password: "", general: "" });

  // entrance
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  // focus glow
  const nameGlow = useRef(new Animated.Value(0)).current;
  const emailGlow = useRef(new Animated.Value(0)).current;
  const pwdGlow = useRef(new Animated.Value(0)).current;

  // shakes
  const nameShake = useRef(new Animated.Value(0)).current;
  const emailShake = useRef(new Animated.Value(0)).current;
  const pwdShake = useRef(new Animated.Value(0)).current;

  // banner
  const bannerAnim = useRef(new Animated.Value(0)).current;

  // button press
  const btnScale = useRef(new Animated.Value(1)).current;

  // logo bounce
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fadeIn, slideUp]);

  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, [bounce]);

  const startGlow = (v) =>
    Animated.timing(v, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  const endGlow = (v) =>
    Animated.timing(v, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: false }).start();

  const shake = (v) =>
    Animated.sequence([
      Animated.timing(v, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(v, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(v, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(v, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();

  const revealBanner = () =>
    Animated.timing(bannerAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  const hideBanner = () =>
    Animated.timing(bannerAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: false }).start();

  const strength = (() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["Weak", "Okay", "Good", "Strong"][strength] || "Weak";
  const strengthColor = [palette.error, "#f59e0b", "#22c55e", palette.success][strength] || palette.error;

  const validate = () => {
    const next = { name: "", email: "", password: "", general: "" };
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) next.name = "Name is required.";
    if (!trimmedEmail) next.email = "Email is required.";
    else if (!EMAIL_RE.test(trimmedEmail)) next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Minimum 6 characters.";

    setErrors(next);
    if (next.name) shake(nameShake);
    if (next.email) shake(emailShake);
    if (next.password) shake(pwdShake);
    if (next.name || next.email || next.password) hideBanner();

    return !next.name && !next.email && !next.password;
  };

  const handleSignup = async () => {
    setErrors((p) => ({ ...p, general: "" }));
    hideBanner();
    if (!validate()) return;

    setLoading(true);
    try {
      await signup(name.trim(), email.trim().toLowerCase(), password);
      router.replace("/Main/home");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Signup failed. Please try again.";
      setErrors((p) => ({ ...p, general: msg }));
      revealBanner();
    } finally {
      setLoading(false);
    }
  };

  const onPressIn = () =>
    Animated.spring(btnScale, { toValue: 0.98, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  const canSubmit = !!name && !!email && !!password && !loading;

  const nameOutline = nameGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const emailOutline = emailGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const pwdOutline = pwdGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const bannerHeight = bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
  const bannerOpacity = bannerAnim;

  return (
    <ScrollView style={[styles.safe, { backgroundColor: palette.background }]}>
      <StatusBar barStyle={palette.statusBarStyle} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Top: logo + theme toggle */}
        <View style={[styles.logoWrap]}>
          <Pressable onPress={toggleTheme} hitSlop={10}>
            <Animated.Image
              source={require("../../assets/images/foodHutLogo.png")}
              style={{ width: 120, height: 150, resizeMode: "contain", transform: [{ translateY: bounce }] }}
            />
          </Pressable>
          {/* <Text style={{ color: palette.sub, fontSize: 12, marginTop: 4 }}>(tap to toggle theme)</Text> */}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <Text style={[styles.title, { color: palette.text }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: palette.sub }]}>
              Join us — create an account to order delicious meals.
            </Text>

            <Animated.View
              style={[
                styles.bannerWrap,
                { height: bannerHeight, opacity: bannerOpacity, borderColor: palette.error, backgroundColor: palette.bannerBg },
              ]}
            >
              {!!errors.general && (
                <View style={styles.bannerRow}>
                  <FontAwesome name="warning" size={16} color={palette.error} />
                  <Text numberOfLines={2} style={[styles.bannerText, { color: palette.text }]}>{errors.general}</Text>
                  <Pressable onPress={hideBanner} hitSlop={10}>
                    <FontAwesome name="close" size={16} color={palette.sub} />
                  </Pressable>
                </View>
              )}
            </Animated.View>

            <Text style={[styles.label, { color: palette.text }]}>Name</Text>
            <Animated.View style={{ transform: [{ translateX: nameShake }] }}>
              <Animated.View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: palette.field,
                    borderColor: errors.name ? palette.error : palette.border,
                    shadowOpacity: nameGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }),
                    shadowColor: errors.name ? palette.error : palette.tint,
                    shadowRadius: nameGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
                    borderWidth: nameOutline,
                  },
                ]}
              >
                <FontAwesome
                  name="user-o"
                  size={16}
                  color={errors.name ? palette.error : palette.sub}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[styles.input, { color: palette.text }]}
                  placeholder="Your full name"
                  placeholderTextColor="#6b6f76"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                  }}
                  onFocus={() => startGlow(nameGlow)}
                  onBlur={() => endGlow(nameGlow)}
                  returnKeyType="next"
                />
              </Animated.View>
            </Animated.View>
            {!!errors.name && <Text style={[styles.errorText, { color: palette.error }]}>{errors.name}</Text>}

            {/* Email */}
            <Text style={[styles.label, { color: palette.text, marginTop: 14 }]}>Email</Text>
            <Animated.View style={{ transform: [{ translateX: emailShake }] }}>
              <Animated.View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: palette.field,
                    borderColor: errors.email ? palette.error : palette.border,
                    shadowOpacity: emailGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }),
                    shadowColor: errors.email ? palette.error : palette.tint,
                    shadowRadius: emailGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
                    borderWidth: emailOutline,
                  },
                ]}
              >
                <FontAwesome
                  name="envelope-o"
                  size={16}
                  color={errors.email ? palette.error : palette.sub}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[styles.input, { color: palette.text }]}
                  placeholder="you@example.com"
                  placeholderTextColor="#6b6f76"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                  }}
                  onFocus={() => startGlow(emailGlow)}
                  onBlur={() => endGlow(emailGlow)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </Animated.View>
            </Animated.View>
            {!!errors.email && <Text style={[styles.errorText, { color: palette.error }]}>{errors.email}</Text>}

            {/* Password */}
            <Text style={[styles.label, { color: palette.text, marginTop: 14 }]}>Password</Text>
            <Animated.View style={{ transform: [{ translateX: pwdShake }] }}>
              <Animated.View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: palette.field,
                    borderColor: errors.password ? palette.error : palette.border,
                    shadowOpacity: pwdGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }),
                    shadowColor: errors.password ? palette.error : palette.tint,
                    shadowRadius: pwdGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
                    borderWidth: pwdOutline,
                  },
                ]}
              >
                <FontAwesome
                  name="lock"
                  size={18}
                  color={errors.password ? palette.error : palette.sub}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[styles.input, { color: palette.text }]}
                  placeholder="Enter password"
                  placeholderTextColor="#6b6f76"
                  secureTextEntry={!showPwd}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                  }}
                  onFocus={() => startGlow(pwdGlow)}
                  onBlur={() => endGlow(pwdGlow)}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={10}>
                  <FontAwesome name={showPwd ? "eye-slash" : "eye"} size={18} color={palette.sub} />
                </Pressable>
              </Animated.View>
            </Animated.View>
            {!!errors.password && <Text style={[styles.errorText, { color: palette.error }]}>{errors.password}</Text>}

            {/* Strength meter */}
            <View style={styles.strengthRow}>
              <View style={[styles.strengthBar, { backgroundColor: strength >= 1 ? strengthColor : palette.strengthBase }]} />
              <View style={[styles.strengthBar, { backgroundColor: strength >= 2 ? strengthColor : palette.strengthBase }]} />
              <View style={[styles.strengthBar, { backgroundColor: strength >= 3 ? strengthColor : palette.strengthBase }]} />
              <Text style={[styles.strengthLabel, { color: palette.sub }]}>{password ? strengthLabel : ""}</Text>
            </View>

            {/* Links */}
            <Text style={[styles.hint, { color: palette.sub }]} onPress={() => router.push("/Auth/Login")}>
              Already have an account?{" "}
              <Text style={{ color: palette.tint, textDecorationLine: "underline" }}>Sign In</Text>
            </Text>

            {/* Submit */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={handleSignup}
                disabled={!canSubmit}
                style={[
                  styles.button,
                  { backgroundColor: canSubmit ? palette.tint : palette.buttonDisabled, shadowColor: palette.tint },
                ]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
              </TouchableOpacity>
            </Animated.View>

            <Text style={[styles.footer, { color: palette.sub }]}>
              By creating an account you agree to our{" "}
              <Text style={{ color: palette.tint, fontWeight: "700" }}>Terms of Use</Text> and{" "}
              <Text style={{ color: palette.tint, fontWeight: "700" }}>Privacy Policy</Text>.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const currentStyles = () =>
  StyleSheet.create({
    safe: { flex: 1 },
    logoWrap: { alignItems: 'center', marginTop: 12 },
    scroll: { flexGrow: 1, padding: 18, justifyContent: "center" },

    card: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
      gap: 12,
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },

    title: { fontSize: 28, fontWeight: "800" },
    subtitle: { fontSize: 14, lineHeight: 20 },

    label: { fontSize: 13, fontWeight: "600", marginTop: 4 },

    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
    },
    input: { flex: 1, fontSize: 15 },

    errorText: { marginTop: 6, fontSize: 12, textAlign: "right" },

    hint: { marginTop: 10, marginBottom: 8, textAlign: "center", fontSize: 13 },

    button: {
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
    },
    buttonText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },

    footer: { textAlign: "center", marginTop: 10, fontSize: 12 },

    bannerWrap: {
      width: "100%",
      overflow: "hidden",
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 10,
      justifyContent: "center",
    },
    bannerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    bannerText: { flex: 1, fontSize: 13 },

    strengthRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
      marginBottom: 6,
    },
    strengthBar: { height: 6, borderRadius: 6, flex: 1 },
    strengthLabel: { marginLeft: 6, fontSize: 12 },
  });
