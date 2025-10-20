// app/Auth/LoginScreen.jsx
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePalette } from "../../utils/palette";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "", general: "" });

    const { theme, toggleTheme } = useTheme();
    const palette = usePalette(theme);
    const styles = currentStyles();


    // const palette = useMemo(
    //     () => ({
    //         bg: "#0b0c10",
    //         card: "#121319",
    //         text: "#ECEEF1",
    //         sub: "#9aa0a9",
    //         border: "#242934",
    //         fieldBg: "#0f1117",
    //         primary: Colors?.light?.primary || "#FF5A00",
    //         error: Colors?.light?.error || "#E11D48",
    //     }),
    //     []
    // );

    const fadeIn = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(24)).current;

    const emailGlow = useRef(new Animated.Value(0)).current;
    const pwdGlow = useRef(new Animated.Value(0)).current;

    const emailShake = useRef(new Animated.Value(0)).current;
    const pwdShake = useRef(new Animated.Value(0)).current;

    const bannerAnim = useRef(new Animated.Value(0)).current;

    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, [fadeIn, slideUp]);

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

    const validate = () => {
        const next = { email: "", password: "", general: "" };
        const trimmed = email.trim().toLowerCase();

        if (!trimmed) next.email = "Email is required.";
        else if (!EMAIL_RE.test(trimmed)) next.email = "Enter a valid email address.";

        if (!password) next.password = "Password is required.";
        else if (password.length < 6) next.password = "Minimum 6 characters.";

        setErrors(next);

        if (next.email) shake(emailShake);
        if (next.password) shake(pwdShake);

        if (next.email || next.password) hideBanner();

        return !next.email && !next.password;
    };

    const handleLogin = async () => {
        setErrors((p) => ({ ...p, general: "" }));
        hideBanner();
        if (!validate()) return;

        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), password);
            router.replace("/Main/home");
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.message ||
                "Login failed. Please try again.";
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

    const canSubmit = !!email && !!password && !loading;

    const emailOutline = emailGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
    const pwdOutline = pwdGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
    const bannerHeight = bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
    const bannerOpacity = bannerAnim;

    const bounce = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounce, {
                    toValue: -10, // upward lift
                    duration: 500,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(bounce, {
                    toValue: 0, // back to rest
                    duration: 500,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [bounce]);

    const insets = useSafeAreaInsets();
    // style={[styles.safe, { backgroundColor: palette.background }]}
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={
                Platform.OS === "ios" ? insets.top + 48 : 0
            }>
            <View style={{ margin: 10, justifyContent: "center", alignItems: "center" }} onTouchEnd={toggleTheme}>
                <Animated.Image
                    source={require("../../assets/images/foodHutLogo.png")}
                    style={{
                        width: 120, height: 150,
                        resizeMode: "contain",
                        transform: [{ translateY: bounce }],
                    }}
                />
            </View>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
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
                        <Text style={[styles.title, { color: palette.text }]}>Log in</Text>
                        <Text style={[styles.subtitle, { color: palette.sub }]}>
                            By logging in, you agree to our{" "}
                            <Text style={{ color: palette.tint, fontWeight: "700" }}>Terms of Use</Text>.
                        </Text>

                        <Animated.View
                            style={[
                                styles.bannerWrap,
                                { height: bannerHeight, opacity: bannerOpacity, borderColor: styles.error, backgroundColor: "#2a1015" },
                            ]}
                        >
                            {!!errors.general && (
                                <View style={styles.bannerRow}>
                                    <FontAwesome name="warning" size={16} color={palette.error} />
                                    <Text numberOfLines={2} style={[styles.bannerText, { color: palette.text }]}>
                                        {errors.general}
                                    </Text>
                                    <Pressable onPress={hideBanner} hitSlop={10}>
                                        <FontAwesome name="close" size={16} color={palette.sub} />
                                    </Pressable>
                                </View>
                            )}
                        </Animated.View>

                        <Text style={[styles.label, { color: palette.text }]}>Email</Text>
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
                        {!!errors.email && <Text style={[palette.errorText, { color: palette.error }]}>{errors.email}</Text>}

                        <Text style={[styles.label, { color: palette.text, marginTop: 14 }]}>Password</Text>
                        <Animated.View style={{ transform: [{ translateX: pwdShake }] }}>
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
                                    name="lock"
                                    size={18}
                                    color={errors.password ? palette.error : palette.sub}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    style={[styles.input, { color: palette.text }]}
                                    placeholder="Your password"
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
                                    onSubmitEditing={handleLogin}
                                />
                                <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={10}>
                                    <FontAwesome name={showPwd ? "eye-slash" : "eye"} size={18} color={palette.sub} />
                                </Pressable>
                            </Animated.View>
                        </Animated.View>
                        {!!errors.password && <Text style={[styles.errorText, { color: palette.error }]}>{errors.password}</Text>}

                        <View style={styles.inlineLinks}>
                            <Text
                                style={[styles.small, { color: palette.sub }]}
                                onPress={() => router.push("/Auth/Signup")}
                            >
                                Don’t have an account?{" "}
                                <Text style={{ color: palette.tint, textDecorationLine: "underline" }}>Sign up</Text>
                            </Text>
                            <Text
                                style={[styles.small, { color: palette.sub, textDecorationLine: "underline" }]}
                                onPress={() => router.push("/Auth/ForgotPassword")}
                            >
                                Forgot password?
                            </Text>
                        </View>

                        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPressIn={onPressIn}
                                onPressOut={onPressOut}
                                onPress={handleLogin}
                                disabled={!canSubmit}
                                style={[
                                    styles.button,
                                    { backgroundColor: canSubmit ? palette.tint : "#3b3d44", shadowColor: palette.tint },
                                ]}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
                            </TouchableOpacity>
                        </Animated.View>

                        <Text style={[styles.footer, { color: palette.sub }]}>
                            For more information, see our{" "}
                            <Text style={{ color: palette.tint, fontWeight: "700" }}>Privacy Policy</Text>.
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </KeyboardAvoidingView>
    );
}

const currentStyles = (theme) => StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flexGrow: 1, padding: 18, justifyContent: "center" },

    card: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 18,
        gap: 12,

        // soft inner spacing
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
    input: {
        flex: 1,
        fontSize: 15,
    },

    errorText: { marginTop: 6, fontSize: 12, textAlign: "right" },

    inlineLinks: {
        marginTop: 8,
        marginBottom: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    small: { fontSize: 13 },

    button: {
        marginTop: 10,
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
    bannerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    bannerText: { flex: 1, fontSize: 13 },
});
