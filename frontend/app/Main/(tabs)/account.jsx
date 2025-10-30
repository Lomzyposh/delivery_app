// app/(tabs)/account/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
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
  const { user, userId, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const isDark =
    theme?.mode === "dark" ||
    theme === "dark" ||
    theme?.background?.toLowerCase?.() === "#0b0c0f";

  const s = useMemo(() => getStyles(theme), [theme]);

  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [secOpen, setSecOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [form, setForm] = useState(profile);

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [helpMsg, setHelpMsg] = useState("");

  useEffect(() => {
    if (!user || !userId) return;
    let alive = true;
    (async () => {
      try {
        setBusy(true);
        const res = await fetch(
          `${API_URL}/api/me?userId=${encodeURIComponent(userId)}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const me = await res.json();
        if (!alive) return;
        const next = { name: me.name || "", email: me.email || "" };
        setProfile(next);
        setForm(next);
        setUser?.((prev) => ({ ...(prev || {}), ...me, id: me.id || prev?.id })); // keep id
      } catch {
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, [user, userId, setUser]); // ✅ include userId


  // small helper to always parse JSON (even on error)
  async function apiPatch(url, body) {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        // If you use JWT header instead of cookies, uncomment:
        // Authorization: `Bearer ${yourAccessToken}`,
      },
      credentials: "include", // keep if you use cookies
      body: JSON.stringify(body),
    });

    let data;
    try { data = await res.json(); } catch { data = { message: `HTTP ${res.status}` }; }

    if (!res.ok) {
      const msg = data?.message || `HTTP ${res.status}`;
      const field = data?.field; // "email" | "currentPassword" | "newPassword" | etc.
      throw new Error(field ? `${msg}` : msg);
    }
    return data;
  }

  const saveProfile = async () => {
    const name = String(form.name || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    if (!name) return Alert.alert("Name is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Alert.alert("Invalid email");

    const id = userId ?? user?.id;
    if (!id) return Alert.alert("Not logged in", "Missing user id.");

    try {
      setBusy(true);
      const updated = await apiPatch(`${API_URL}/api/me`, { name, email, userId: id });
      setProfile({ name: updated.name, email: updated.email });
      setUser?.((prev) => ({ ...(prev || {}), ...updated, id })); // keep id
      setEditOpen(false);
      Alert.alert("Saved", updated.message || "Profile updated successfully");
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to update profile");
    } finally {
      setBusy(false);
    }
  };


  const savePassword = async () => {
    if (!pwd.current) return Alert.alert("Enter your current password");
    if (pwd.next.length < 8) return Alert.alert("New password must be at least 8 characters");
    if (!/[0-9]/.test(pwd.next) || !/[A-Za-z]/.test(pwd.next)) return Alert.alert("Use letters & numbers");
    if (pwd.next !== pwd.confirm) return Alert.alert("Passwords do not match");

    try {
      setBusy(true);
      const resp = await apiPatch(`${API_URL}/api/me/password`, {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
      setSecOpen(false);
      setPwd({ current: "", next: "", confirm: "" });
      Alert.alert("Success", resp.message || "Password updated!");
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  const logoutUser = async () => {
    try {
      setBusy(true);
      await logout?.();
      await AsyncStorage.clear();
      router.replace("/Auth/Login");
    } catch (e) {
      Alert.alert("Error", e.message || "Logout failed");
    } finally {
      setBusy(false);
    }
  };

  // --- Not logged in state ---
  if (!user) {
    return (
      <View style={s.center}>
        <Text style={{ color: theme.text, marginTop: 10 }}>Login to view your account</Text>
        <TouchableOpacity onPress={() => router.push("/Auth/Login")}>
          <Text style={{ color: "#ff5f00", marginTop: 14, fontWeight: "800" }}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      <LinearGradient colors={FOOD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <Text style={s.headerTitle}>My Account</Text>

        <View style={s.userRow}>
          <View style={s.avatarBubble}>
            <Ionicons name="fast-food-outline" size={28} color="#fff" />
          </View>

          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={s.userName}>{profile.name || "Hungry Guest"}</Text>
            <Text style={s.userEmail}>{profile.email || "Update your account info"}</Text>
          </View>

          <Pressable onPress={toggleTheme} style={s.themeBtn} android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={18} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Card theme={theme} isDark={isDark} title="Account">
          <Row
            theme={theme}
            icon="person-outline"
            label="Edit Profile"
            onPress={() => { setForm(profile); setEditOpen(true); }}
          />
          {/* <Row theme={theme} icon="lock-closed-outline" label="Password & Security" onPress={() => setSecOpen(true)} /> */}
        </Card>

        <Card theme={theme} isDark={isDark} title="Support">
          <Row theme={theme} icon="help-circle-outline" label="FAQ" onPress={() => setFaqOpen(true)} />
          <Row theme={theme} icon="chatbubbles-outline" label="Help Center" onPress={() => setHelpOpen(true)} />
        </Card>

        <Card theme={theme} isDark={isDark} title="">
          <Row
            theme={theme}
            icon="log-out-outline"
            label="Logout"
            onPress={() =>
              Alert.alert("Logout", "Do you want to log out completely?", [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: logoutUser },
              ])
            }
          />
        </Card>
      </View>

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

      <FAQModal visible={faqOpen} onClose={() => setFaqOpen(false)} theme={theme} />

      <HelpModal
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        theme={theme}
        helpMsg={helpMsg}
        setHelpMsg={setHelpMsg}
      />

      {/* Loading overlay */}
      {busy && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff5f00" />
        </View>
      )}
    </View>
  );
}

/* ---------------------- Reusable Bits ---------------------- */

function Card({ theme, isDark, title, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <BlurView tint={isDark ? "dark" : "light"} intensity={25} style={{ borderRadius: 18, overflow: "hidden" }}>
        <View style={{ borderWidth: 1, borderColor: theme.border, paddingVertical: 10, backgroundColor: theme.card }}>
          {title ? (
            <Text
              style={{
                color: theme.sub,
                fontWeight: "800",
                marginLeft: 12,
                marginBottom: 4,
                textTransform: "uppercase",
                fontSize: 12,
                letterSpacing: 0.5,
              }}
            >
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
      style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name={icon} size={22} color={theme.text} />
        <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.sub} />
    </Pressable>
  );
}

function Label({ children, theme }) {
  return <Text style={{ color: theme.sub, fontWeight: "700", fontSize: 12, marginTop: 12 }}>{children}</Text>;
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

function PwdInput({ theme, style, value, onChangeText, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ position: "relative" }}>
      <Input
        theme={theme}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!show}
        style={[style, { paddingRight: 44 }]}
      />
      <Pressable onPress={() => setShow((s) => !s)} style={{ position: "absolute", right: 12, top: 12, padding: 6 }}>
        <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={theme.sub} />
      </Pressable>
    </View>
  );
}

/* ---------------------- Modals (Fixed) ---------------------- */

function HeaderRow({ title, onCancel, onSave, theme }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <Pressable onPress={onCancel}><Text style={{ color: theme.sub, fontWeight: "700" }}>Cancel</Text></Pressable>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>{title}</Text>
      <Pressable onPress={onSave}><Text style={{ color: "#ff5f00", fontWeight: "700" }}>Save</Text></Pressable>
    </View>
  );
}

function EditProfileModal({ visible, onClose, theme, form, setForm, saveProfile }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={stylesModal.backdrop}>
        <View style={[stylesModal.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <HeaderRow title="Edit Profile" onCancel={onClose} onSave={saveProfile} theme={theme} />
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Label theme={theme}>Full Name</Label>
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
  );
}

function PasswordModal({ visible, onClose, theme, pwd, setPwd, savePassword }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={stylesModal.backdrop}>
        <View style={[stylesModal.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <HeaderRow title="Password & Security" onCancel={onClose} onSave={savePassword} theme={theme} />
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
  );
}

function FAQItem({ theme, q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, marginBottom: 8, overflow: "hidden", backgroundColor: theme.card }}>
      <Pressable onPress={() => setOpen((s) => !s)} style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: theme.text, fontWeight: "700" }}>{q}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.sub} />
      </Pressable>
      {open ? <Text style={{ color: theme.sub, paddingHorizontal: 12, paddingBottom: 12 }}>{a}</Text> : null}
    </View>
  );
}

function FAQModal({ visible, onClose, theme }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={stylesModal.backdrop}>
        <View style={[stylesModal.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <HeaderRow title="FAQ" onCancel={onClose} onSave={onClose} theme={theme} />
          <ScrollView contentContainerStyle={{ padding: 4, paddingBottom: 20 }}>
            <FAQItem theme={theme} q="How do I change my name or email?" a="Open Edit Profile, update the fields, then press Save." />
            <FAQItem theme={theme} q="How do I change my password?" a="Open Password & Security, enter your current and new password, then Save." />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function HelpModal({ visible, onClose, theme, helpMsg, setHelpMsg }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={stylesModal.backdrop}>
        <View style={[stylesModal.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <HeaderRow
            title="Help Center"
            onCancel={onClose}
            onSave={() => { onClose(); Alert.alert("Thanks!", "We’ll get back to you soon."); }}
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
      marginRight: 8,
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

    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

const stylesModal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { width: "100%", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderWidth: 1 },
});

export { };