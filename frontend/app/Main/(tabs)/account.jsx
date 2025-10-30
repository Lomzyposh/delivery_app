import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import { API_URL } from "../../../hooks/api";

const ORANGE_GRADIENT = ["#ff6a00", "#ffa94d"];

export default function Account() {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark =
    theme?.mode === "dark" ||
    theme === "dark" ||
    theme?.background?.toLowerCase?.() === "#0b0c0f";

  const styles = useMemo(() => getStyles(theme), [theme]);

  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [form, setForm] = useState(profile);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/me`, { credentials: "include" });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const me = await res.json();
        if (!alive) return;
        const next = { name: me.name || "", email: me.email || "" };
        setProfile(next);
        setForm(next);
        setUser?.((prev) => ({ ...(prev || {}), ...me }));
      } catch {
        // fallback to context
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [setUser]);

  const saveProfile = async () => {
    const name = String(form.name || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    if (!name) return Alert.alert("Name is required");
    const goodEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!goodEmail.test(email)) return Alert.alert("Invalid email");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed (${res.status})`);
      }
      const updated = await res.json();
      setProfile({ name: updated.name, email: updated.email });
      setUser?.((prev) => ({ ...(prev || {}), ...updated }));
      setEditOpen(false);
      Alert.alert("Saved", "Profile updated");
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PASSWORD ================= */
  const [secOpen, setSecOpen] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const savePassword = async () => {
    if (!pwd.current) return Alert.alert("Enter your current password");
    if (pwd.next.length < 8) return Alert.alert("New password must be at least 8 characters");
    if (!/[0-9]/.test(pwd.next) || !/[A-Za-z]/.test(pwd.next)) return Alert.alert("Use letters & numbers");
    if (pwd.next !== pwd.confirm) return Alert.alert("Passwords do not match");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed (${res.status})`);
      }
      setSecOpen(false);
      setPwd({ current: "", next: "", confirm: "" });
      Alert.alert("Updated", "Password changed successfully");
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FAQ / HELP ================= */
  const [faqOpen, setFaqOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMsg, setHelpMsg] = useState("");

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <LinearGradient colors={ORANGE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.userRow}>
          {/* Initials bubble */}
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarText}>{initials(profile.name || profile.email)}</Text>
          </View>

          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>{profile.name || "Complete your profile"}</Text>
            <Text style={styles.userEmail}>{profile.email || "Add name & email to get started"}</Text>
          </View>

          <Pressable onPress={toggleTheme} style={styles.themeBtn} android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={18} color="#fff" />
          </Pressable>

          <Pressable onPress={() => { setForm(profile); setEditOpen(true); }} style={styles.editPill}>
            <Text style={styles.editPillText}>{loading ? "Saving..." : "Edit"}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Sections */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Card theme={theme} isDark={isDark} title="Account Settings">
          <Row theme={theme} icon="person-outline" label="Personal Information" onPress={() => { setForm(profile); setEditOpen(true); }} />
          <Row theme={theme} icon="lock-closed-outline" label="Password & Security" onPress={() => setSecOpen(true)} />
        </Card>

        <Card theme={theme} isDark={isDark} title="Other">
          <Row theme={theme} icon="help-circle-outline" label="FAQ" onPress={() => setFaqOpen(true)} />
          <Row theme={theme} icon="chatbubbles-outline" label="Help Center" onPress={() => setHelpOpen(true)} />
        </Card>
      </View>

      {/* ================= MODALS ================= */}

      {/* Edit Profile */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <HeaderRow title="Edit Profile" onCancel={() => setEditOpen(false)} onSave={saveProfile} theme={theme} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}>
              <Label theme={theme}>Full name</Label>
              <Input theme={theme} value={form.name} onChangeText={(t) => setForm((s) => ({ ...s, name: t }))} placeholder="Your name" />

              <Label theme={theme}>Email</Label>
              <Input
                theme={theme}
                value={form.email}
                onChangeText={(t) => setForm((s) => ({ ...s, email: t }))}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password & Security */}
      <Modal visible={secOpen} transparent animationType="slide" onRequestClose={() => setSecOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <HeaderRow title="Password & Security" onCancel={() => setSecOpen(false)} onSave={savePassword} theme={theme} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}>
              <Label theme={theme}>Current password</Label>
              <PwdInput theme={theme} value={pwd.current} onChangeText={(t) => setPwd((s) => ({ ...s, current: t }))} placeholder="Current password" />
              <Label theme={theme}>New password</Label>
              <PwdInput theme={theme} value={pwd.next} onChangeText={(t) => setPwd((s) => ({ ...s, next: t }))} placeholder="At least 8 chars, letters & numbers" />
              <Label theme={theme}>Confirm new password</Label>
              <PwdInput theme={theme} value={pwd.confirm} onChangeText={(t) => setPwd((s) => ({ ...s, confirm: t }))} placeholder="Repeat new password" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FAQ */}
      <Modal visible={faqOpen} transparent animationType="slide" onRequestClose={() => setFaqOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <HeaderRow title="FAQ" onCancel={() => setFaqOpen(false)} onSave={() => setFaqOpen(false)} theme={theme} />
            <ScrollView contentContainerStyle={{ padding: 4, paddingBottom: 20 }}>
              <FAQItem theme={theme} q="How do I change my name or email?" a="Open Personal Information, edit the fields, and press Save." />
              <FAQItem theme={theme} q="How do I change my password?" a="Open Password & Security, enter your current and new password, then Save." />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Help */}
      <Modal visible={helpOpen} transparent animationType="slide" onRequestClose={() => setHelpOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <HeaderRow
              title="Help Center"
              onCancel={() => setHelpOpen(false)}
              onSave={() => {
                setHelpOpen(false);
                Alert.alert("Thanks!", "We’ll get back to you soon.");
              }}
              theme={theme}
            />
            <ScrollView contentContainerStyle={{ padding: 4, paddingBottom: 20 }}>
              <Text style={{ color: theme.sub, marginBottom: 8 }}>
                Need help? Send us a message and we’ll follow up by email.
              </Text>
              <Input
                theme={theme}
                value={helpMsg}
                onChangeText={setHelpMsg}
                placeholder="Describe your issue..."
                multiline
                style={{ height: 120, textAlignVertical: "top" }}
              />
              <View style={{ height: 12 }} />
              <ContactRow theme={theme} icon="mail-outline" label="support@lomzyposh.app" />
              <ContactRow theme={theme} icon="call-outline" label="+234 800 000 0000" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ================= Helpers & Reusables (no external `styles` used) ================= */
function initials(s = "") {
  const str = String(s).trim();
  if (!str) return "U";
  const parts = str.includes("@") ? [str[0]] : str.split(/\s+/);
  const init = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return init.toUpperCase() || "U";
}

function HeaderRow({ title, onCancel, onSave, theme }) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }}>
      <Pressable onPress={onCancel} style={{ paddingVertical: 6, paddingHorizontal: 4, minWidth: 54, alignItems: "center" }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: theme.sub }}>Cancel</Text>
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text }}>{title}</Text>
      <Pressable onPress={onSave} style={{ paddingVertical: 6, paddingHorizontal: 4, minWidth: 54, alignItems: "center" }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#ff6a00" }}>Save</Text>
      </Pressable>
    </View>
  );
}

function Card({ theme, isDark, title, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        }}
      />
      <BlurView tint={isDark ? "dark" : "light"} intensity={25} style={{ borderRadius: 18, overflow: "hidden" }}>
        <View style={{ borderWidth: 1, borderColor: theme.border, paddingVertical: 10, backgroundColor: theme.card }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 6,
              marginHorizontal: 12,
              color: theme.sub,
            }}
          >
            {title}
          </Text>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

function Row({ theme, icon, label, disabled, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 8 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        disabled={disabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[
          {
            paddingVertical: 12,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
          disabled && { opacity: 0.6 },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name={icon} size={20} color={theme.text} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.sub} />
      </Pressable>
    </Animated.View>
  );
}

function Label({ children, theme }) {
  return <Text style={{ fontSize: 12, color: theme.sub, marginBottom: 6, marginTop: 12, fontWeight: "700" }}>{children}</Text>;
}

function Input({ theme, style, ...props }) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={theme.sub}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 15,
          color: theme.text,
          backgroundColor: theme.field,
        },
        style,
      ]}
    />
  );
}

function PwdInput({ theme, style, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ position: "relative" }}>
      <Input theme={theme} secureTextEntry={!show} style={[style, { paddingRight: 44 }]} {...props} />
      <Pressable onPress={() => setShow((s) => !s)} style={{ position: "absolute", right: 12, top: 12, padding: 6 }}>
        <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={theme.sub} />
      </Pressable>
    </View>
  );
}

function FAQItem({ theme, q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        marginBottom: 8,
        overflow: "hidden",
        backgroundColor: theme.card,
      }}
    >
      <Pressable
        onPress={() => setOpen((s) => !s)}
        style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <Text style={{ color: theme.text, fontWeight: "700" }}>{q}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.sub} />
      </Pressable>
      {open ? <Text style={{ color: theme.sub, paddingHorizontal: 12, paddingBottom: 12 }}>{a}</Text> : null}
    </View>
  );
}

function ContactRow({ theme, icon, label }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 }}>
      <Ionicons name={icon} size={20} color={theme.sub} />
      <Text style={{ color: theme.text, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    header: { paddingTop: Platform.OS === "ios" ? 72 : 48, paddingHorizontal: 16, paddingBottom: 34 },
    headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 14 },
    userRow: { flexDirection: "row", alignItems: "center" },

    avatarBubble: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#ffe8dc", fontSize: 18, fontWeight: "800" },

    userName: { color: "#fff", fontSize: 18, fontWeight: "800" },
    userEmail: { color: "#ffe8dc", fontSize: 13, marginTop: 2 },

    themeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    editPill: { backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
    editPillText: { color: "#fff", fontWeight: "700", fontSize: 12 },

    /* Modals */
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "flex-end" },
    modalCard: { width: "100%", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderWidth: 1 },
  });
}

export { }
