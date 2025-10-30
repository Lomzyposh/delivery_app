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
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import { API_URL } from "../../../hooks/api";

const FOOD_GRADIENT = ["#ff5f00", "#ff9d2f"];

export default function Account() {
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

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

  /* ✅ Redirect to login if not authenticated */
  useEffect(() => {
    if (!user) {
      router.push("/Auth/Login");
      return;
    }
  }, [user]);

  /* ✅ Fetch user data */
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
        // fallback
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [setUser]);

  /* ================= SAVE PROFILE ================= */
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
      Alert.alert("Saved", "Profile updated successfully");
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
    if (pwd.next.length < 8)
      return Alert.alert("New password must be at least 8 characters");
    if (!/[0-9]/.test(pwd.next) || !/[A-Za-z]/.test(pwd.next))
      return Alert.alert("Use letters & numbers");
    if (pwd.next !== pwd.confirm)
      return Alert.alert("Passwords do not match");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: pwd.current,
          newPassword: pwd.next,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed (${res.status})`);
      }
      setSecOpen(false);
      setPwd({ current: "", next: "", confirm: "" });
      Alert.alert("Success", "Password updated!");
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

  /* ================= LOGOUT ================= */
  const logoutUser = async () => {
    try {
      setLoading(true);
      await logout();
      await AsyncStorage.clear();
      router.replace("/Auth/Login");
    } catch (e) {
      Alert.alert("Error", e.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        {/* <ActivityIndicator size="large" color="#ff5f00" /> */}
        <Text style={{ color: theme.text, marginTop: 10 }}>Login to View</Text>
        <TouchableOpacity>
          <Text
            style={{ color: "#ff5f00", marginTop: 20, fontWeight: "700" }}
            onPress={() => router.push("/Auth/Login")}
          >
            Go to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <LinearGradient
        colors={FOOD_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Account</Text>

        <View style={styles.userRow}>
          <View style={styles.avatarBubble}>
            <Ionicons name="fast-food-outline" size={28} color="#fff" />
          </View>

          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>
              {profile.name || "Hungry Guest"}
            </Text>
            <Text style={styles.userEmail}>
              {profile.email || "Update your account info"}
            </Text>
          </View>

          <Pressable
            onPress={toggleTheme}
            style={styles.themeBtn}
            android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
          >
            <Ionicons name={isDark ? "moon" : "sunny"} size={18} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Body Sections */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Card theme={theme} isDark={isDark} title="Account">
          <Row
            theme={theme}
            icon="person-outline"
            label="Edit Profile"
            onPress={() => {
              setForm(profile);
              setEditOpen(true);
            }}
          />
          <Row
            theme={theme}
            icon="lock-closed-outline"
            label="Password & Security"
            onPress={() => setSecOpen(true)}
          />
        </Card>

        <Card theme={theme} isDark={isDark} title="Support">
          <Row
            theme={theme}
            icon="help-circle-outline"
            label="FAQ"
            onPress={() => setFaqOpen(true)}
          />
          <Row
            theme={theme}
            icon="chatbubbles-outline"
            label="Help Center"
            onPress={() => setHelpOpen(true)}
          />
        </Card>

        <Card theme={theme} isDark={isDark} title="">
          <Row
            theme={theme}
            icon="log-out-outline"
            label="Logout"
            onPress={() =>
              Alert.alert("Logout", "Do you want to log out completely?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Logout",
                  style: "destructive",
                  onPress: logoutUser,
                },
              ])
            }
          />
        </Card>
      </View>

      {/* MODALS */}
      <EditProfileModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        theme={theme}
        form={form}
        setForm={setForm}
        saveProfile={saveProfile}
      />

      <PasswordModal
        visible={secOpen}
        onClose={() => setSecOpen(false)}
        theme={theme}
        pwd={pwd}
        setPwd={setPwd}
        savePassword={savePassword}
      />

      <FAQModal
        visible={faqOpen}
        onClose={() => setFaqOpen(false)}
        theme={theme}
      />

      <HelpModal
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        theme={theme}
        helpMsg={helpMsg}
        setHelpMsg={setHelpMsg}
      />
    </View>
  );
}

/* ==================== MODALS ==================== */
function EditProfileModal({ visible, onClose, theme, form, setForm, saveProfile }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={stylesModal.backdrop}
      >
        <View
          style={[
            stylesModal.card,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <HeaderRow title="Edit Profile" onCancel={onClose} onSave={saveProfile} theme={theme} />
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Label theme={theme}>Full Name</Label>
            <Input
              theme={theme}
              value={form.name}
              onChangeText={(t) => setForm((s) => ({ ...s, name: t }))}
              placeholder="Your name"
            />
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
  );
}

/* =================== REUSABLE COMPONENTS =================== */
function HeaderRow({ title, onCancel, onSave, theme }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <Pressable onPress={onCancel}>
        <Text style={{ color: theme.sub, fontWeight: "700" }}>Cancel</Text>
      </Pressable>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>{title}</Text>
      <Pressable onPress={onSave}>
        <Text style={{ color: "#ff5f00", fontWeight: "700" }}>Save</Text>
      </Pressable>
    </View>
  );
}

function Card({ theme, isDark, title, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <BlurView tint={isDark ? "dark" : "light"} intensity={25} style={{ borderRadius: 18 }}>
        <View style={{ borderWidth: 1, borderColor: theme.border, paddingVertical: 10, borderRadius: 18, backgroundColor: theme.card }}>
          {title ? (
            <Text style={{ color: theme.sub, fontWeight: "800", marginLeft: 12, marginBottom: 4 }}>
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </BlurView>
    </View>
  );
}

function Row({ theme, icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name={icon} size={22} color={theme.text} />
        <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.sub} />
    </Pressable>
  );
}

function Label({ children, theme }) {
  return (
    <Text style={{ color: theme.sub, fontWeight: "700", fontSize: 12, marginTop: 12 }}>
      {children}
    </Text>
  );
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
          padding: 12,
          color: theme.text,
          backgroundColor: theme.field,
          fontSize: 15,
        },
        style,
      ]}
    />
  );
}

/* ========== STYLES ========== */
function getStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingTop: Platform.OS === "ios" ? 70 : 50, paddingHorizontal: 16, paddingBottom: 40 },
    headerTitle: { color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 14 },
    userRow: { flexDirection: "row", alignItems: "center" },
    avatarBubble: {
      width: 55,
      height: 55,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    userName: { color: "#fff", fontSize: 18, fontWeight: "800" },
    userEmail: { color: "#fff", fontSize: 13 },
    themeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
    },
  });
}

const stylesModal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { width: "100%", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderWidth: 1 },
});

export { };
