import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
  Animated,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

/* ------------ Brand Colors (match your tab button) ------------ */
const ORANGE_GRADIENT = ["#ff6a00", "#ff3d00"]; // same vibe as your tab's orange

export default function Account() {
  /* ================= THEME ================= */
  const systemScheme = useColorScheme();
  const [themeOverride, setThemeOverride] = useState("system"); // "system" | "light" | "dark"
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("profile:theme");
      if (saved === "light" || saved === "dark" || saved === "system") setThemeOverride(saved);
    })();
  }, []);
  const dark = themeOverride === "system" ? systemScheme === "dark" : themeOverride === "dark";
  const theme = useMemo(
    () =>
      dark
        ? { bg: "#0b0c0f", text: "#f5f7fb", sub: "#9aa3b2", cardTint: "rgba(20,22,27,0.6)", line: "#23252b" }
        : { bg: "#ffffff", text: "#0f0f14", sub: "#6b7280", cardTint: "rgba(255,255,255,0.75)", line: "#ececec" },
    [dark]
  );
  const toggleLightDark = async () => {
    const next = dark ? "light" : "dark";
    setThemeOverride(next);
    await AsyncStorage.setItem("profile:theme", next);
  };
  const cycleTheme = async () => {
    const order = ["system", "light", "dark"];
    const next = order[(order.indexOf(themeOverride) + 1) % order.length];
    setThemeOverride(next);
    await AsyncStorage.setItem("profile:theme", next);
    Alert.alert("Theme", `Theme set to ${next}`);
  };

  /* ================= PROFILE ================= */
  const [profile, setProfile] = useState({ name: "Eniafe", email: "eniafeolamide15@gmail.com", avatar: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(profile);
  const isComplete = !!profile.name && !!profile.email;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("profile:data");
        if (raw) {
          const p = JSON.parse(raw);
          setProfile(p);
          setForm(p);
        }
        const pp = await AsyncStorage.getItem("profile:prefs");
        if (pp) setPrefs(JSON.parse(pp));
        const ss = await AsyncStorage.getItem("profile:social");
        if (ss) setSocial(JSON.parse(ss));
        const fl = await AsyncStorage.getItem("profile:following");
        if (fl) setFollowing(JSON.parse(fl));
      } catch {}
    })();
  }, []);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to change your avatar.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (!res.canceled) {
      const uri = res.assets?.[0]?.uri;
      if (uri) setForm((s) => ({ ...s, avatar: uri }));
    }
  };

  const saveProfile = async () => {
    if (!form.name.trim()) return Alert.alert("Name required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return Alert.alert("Invalid email");
    await AsyncStorage.setItem("profile:data", JSON.stringify(form));
    setProfile(form);
    setEditOpen(false);
    Alert.alert("Saved", "Profile updated");
  };

  /* ================= SECURITY (local only) ================= */
  const [secOpen, setSecOpen] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [hasPassword, setHasPassword] = useState(false);

  const savePassword = async () => {
    const stored = await AsyncStorage.getItem("profile:password");
    if (stored && pwd.current !== stored) return Alert.alert("Current password is incorrect");
    if (pwd.next.length < 8) return Alert.alert("Password must be at least 8 characters");
    if (!/[0-9]/.test(pwd.next) || !/[A-Za-z]/.test(pwd.next)) return Alert.alert("Use letters & numbers");
    if (pwd.next !== pwd.confirm) return Alert.alert("Passwords do not match");
    await AsyncStorage.setItem("profile:password", pwd.next);
    setHasPassword(true);
    setSecOpen(false);
    Alert.alert("Updated", stored ? "Password changed" : "Password set");
  };

  /* ================= NOTIFICATIONS ================= */
  const [notifOpen, setNotifOpen] = useState(false);
  const [prefs, setPrefs] = useState({
    newsUpdates: true,
    orderStatus: true,
    promos: false,
    recommended: true,
    appUpdates: true,
    quietHours: false,
  });
  const savePrefs = async () => {
    await AsyncStorage.setItem("profile:prefs", JSON.stringify(prefs));
    setNotifOpen(false);
    Alert.alert("Saved", "Notification preferences updated");
  };

  /* ================= COMMUNITY: SOCIAL ================= */
  const [socialOpen, setSocialOpen] = useState(false);
  const [social, setSocial] = useState({
    handle: "",
    allowRequests: true,
    showActivity: true,
    showOnline: true,
  });
  const saveSocial = async () => {
    await AsyncStorage.setItem("profile:social", JSON.stringify(social));
    setSocialOpen(false);
    Alert.alert("Saved", "Friends & Social updated");
  };

  /* ================= COMMUNITY: FOLLOWING LIST ================= */
  const [followOpen, setFollowOpen] = useState(false);
  const [following, setFollowing] = useState([]); // [{id, name, type, avatar?}]
  const [newFollow, setNewFollow] = useState("");
  const addFollow = () => {
    const val = newFollow.trim();
    if (!val) return;
    if (following.some((x) => x.name.toLowerCase() === val.toLowerCase())) {
      Alert.alert("Already added");
      return;
    }
    setFollowing((s) => [...s, { id: String(Date.now()), name: val, type: "restaurant" }]);
    setNewFollow("");
  };
  const removeFollow = (item) => {
    Alert.alert("Remove", `Stop following "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setFollowing((s) => s.filter((x) => x.id !== item.id)) },
    ]);
  };
  const saveFollowing = async () => {
    await AsyncStorage.setItem("profile:following", JSON.stringify(following));
    setFollowOpen(false);
    Alert.alert("Saved", "Following list updated");
  };

  /* ================= FAQ & HELP ================= */
  const [faqOpen, setFaqOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMsg, setHelpMsg] = useState("");

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header (orange like tab) */}
      <LinearGradient
        colors={ORANGE_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.userRow}>
          {/* Avatar */}
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.15)" }]}>
              <Ionicons name="person" size={28} color="#ffe8dc" />
            </View>
          )}

          {/* Name + Email */}
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>{profile.name || "Complete your profile"}</Text>
            <Text style={styles.userEmail}>{profile.email || "Add name & email to get started"}</Text>
          </View>

          {/* Theme toggle (left) + Edit (right) */}
          <Pressable
            onPress={toggleLightDark}
            onLongPress={cycleTheme}
            style={[styles.themeBtn, { backgroundColor: "rgba(0,0,0,0.25)" }]}
          >
            <Ionicons
              name={
                themeOverride === "system"
                  ? (dark ? "moon" : "sunny")
                  : themeOverride === "dark"
                    ? "moon"
                    : "sunny"
              }
              size={18}
              color="#fff"
            />
          </Pressable>

          <Pressable onPress={() => { setForm(profile); setEditOpen(true); }} style={styles.editPill}>
            <Text style={styles.editPillText}>Edit</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Sections */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Card theme={theme} dark={dark} title="Account Settings">
          <Row theme={theme} icon="person-outline" label="Personal Information" onPress={() => { setForm(profile); setEditOpen(true); }} />
          <Row theme={theme} icon="lock-closed-outline" label="Password & Security" onPress={() => setSecOpen(true)} />
          <Row theme={theme} icon="notifications-outline" label="Notifications Preferences" onPress={() => setNotifOpen(true)} />
        </Card>

        <Card theme={theme} dark={dark} title="Community Settings">
          <Row theme={theme} icon="people-outline" label="Friends & Social" onPress={() => setSocialOpen(true)} />
          <Row theme={theme} icon="list-outline" label="Following List" onPress={() => setFollowOpen(true)} />
        </Card>

        <Card theme={theme} dark={dark} title="Other">
          <Row theme={theme} icon="help-circle-outline" label="FAQ" onPress={() => setFaqOpen(true)} />
          <Row theme={theme} icon="chatbubbles-outline" label="Help Center" onPress={() => setHelpOpen(true)} />
        </Card>
      </View>

      {!isComplete ? (
        <Text style={{ color: theme.sub, textAlign: "center", marginTop: 10 }}>
          Tip: We’ll enable more options after you add your details.
        </Text>
      ) : null}

      {/* ================= MODALS ================= */}

      {/* Edit Profile */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.line }]}>
            <HeaderRow title="Edit Profile" onCancel={() => setEditOpen(false)} onSave={saveProfile} theme={theme} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
              <Pressable onPress={pickAvatar} style={styles.modalAvatarWrap}>
                {form.avatar ? (
                  <Image source={{ uri: form.avatar }} style={styles.modalAvatar} />
                ) : (
                  <View style={[styles.modalAvatar, { backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }]}>
                    <Ionicons name="camera" size={24} color="#6b7280" />
                  </View>
                )}
                <View style={styles.camBadge}><Text style={{ color: "#fff", fontWeight: "800" }}>✎</Text></View>
              </Pressable>

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
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.line }]}>
            <HeaderRow title="Password & Security" onCancel={() => setSecOpen(false)} onSave={savePassword} theme={theme} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}>
              {hasPassword ? <Text style={{ color: theme.sub, marginBottom: 6 }}>Enter your current password</Text> : null}
              <Label theme={theme}>{hasPassword ? "Current password" : "Create a password"}</Label>
              <PwdInput theme={theme} value={pwd.current} onChangeText={(t) => setPwd((s) => ({ ...s, current: t }))} placeholder={hasPassword ? "Current password" : "Optional if using social login"} />
              <Label theme={theme}>New password</Label>
              <PwdInput theme={theme} value={pwd.next} onChangeText={(t) => setPwd((s) => ({ ...s, next: t }))} placeholder="At least 8 chars, letters & numbers" />
              <Label theme={theme}>Confirm new password</Label>
              <PwdInput theme={theme} value={pwd.confirm} onChangeText={(t) => setPwd((s) => ({ ...s, confirm: t }))} placeholder="Repeat new password" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notifications Preferences */}
      <Modal visible={notifOpen} transparent animationType="slide" onRequestClose={() => setNotifOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.line }]}>
            <HeaderRow title="Notifications Preferences" onCancel={() => setNotifOpen(false)} onSave={savePrefs} theme={theme} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}>
              <ToggleRow label="News & updates" value={prefs.newsUpdates} onChange={(v)=>setPrefs(s=>({...s,newsUpdates:v}))} />
              <ToggleRow label="Order status" value={prefs.orderStatus} onChange={(v)=>setPrefs(s=>({...s,orderStatus:v}))} />
              <ToggleRow label="Promotions" value={prefs.promos} onChange={(v)=>setPrefs(s=>({...s,promos:v}))} />
              <ToggleRow label="Recommendations" value={prefs.recommended} onChange={(v)=>setPrefs(s=>({...s,recommended:v}))} />
              <ToggleRow label="App updates" value={prefs.appUpdates} onChange={(v)=>setPrefs(s=>({...s,appUpdates:v}))} />
              <ToggleRow label="Quiet hours" value={prefs.quietHours} onChange={(v)=>setPrefs(s=>({...s,quietHours:v}))} help="Mute notifications between 10pm–7am" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Friends & Social */}
      <Modal visible={socialOpen} transparent animationType="slide" onRequestClose={() => setSocialOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.line }]}>
            <HeaderRow title="Friends & Social" onCancel={() => setSocialOpen(false)} onSave={saveSocial} theme={theme} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}>
              <Label theme={theme}>Your handle</Label>
              <Input theme={theme} value={social.handle} onChangeText={(t)=>setSocial(s=>({...s, handle: t.replace(/\s+/g,"")}))} placeholder="@eni_chef" autoCapitalize="none" />
              <View style={{ height: 12 }} />
              <ToggleRow label="Allow friend requests" value={social.allowRequests} onChange={(v)=>setSocial(s=>({...s,allowRequests:v}))} />
              <ToggleRow label="Show activity status" value={social.showActivity} onChange={(v)=>setSocial(s=>({...s,showActivity:v}))} help="Let friends see when you’re active." />
              <ToggleRow label="Show online status" value={social.showOnline} onChange={(v)=>setSocial(s=>({...s,showOnline:v}))} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Following List */}
      <Modal visible={followOpen} transparent animationType="slide" onRequestClose={() => setFollowOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.line }]}>
            <HeaderRow title="Following List" onCancel={()=>setFollowOpen(false)} onSave={saveFollowing} theme={theme} />
            <View style={{ paddingHorizontal: 4 }}>
              <Label theme={theme}>Add restaurant or user</Label>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Input theme={theme} value={newFollow} onChangeText={setNewFollow} placeholder="e.g. FireGrill or @mariam" style={{ flex: 1 }} autoCapitalize="none" returnKeyType="done" onSubmitEditing={addFollow} />
                <Pressable onPress={addFollow} style={styles.addBtn}><Ionicons name="add" size={20} color="#fff" /></Pressable>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 12 }}>
              {following.length === 0 ? (
                <Text style={{ color: theme.sub }}>You’re not following anyone yet.</Text>
              ) : (
                following.map((item) => (
                  <FollowItem key={item.id} item={item} theme={theme} onRemove={()=>removeFollow(item)} />
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FAQ */}
      <Modal visible={faqOpen} transparent animationType="slide" onRequestClose={() => setFaqOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.line }]}>
            <HeaderRow title="FAQ" onCancel={()=>setFaqOpen(false)} onSave={()=>setFaqOpen(false)} theme={theme} />
            <ScrollView contentContainerStyle={{ padding: 4, paddingBottom: 20 }}>
              <FAQItem theme={theme} q="How do I change my profile photo?" a="Open Edit Profile, tap the photo, and pick an image from your gallery." />
              <FAQItem theme={theme} q="Is the app free?" a="Yes, using the app is free. Delivery and service fees may apply at checkout." />
              <FAQItem theme={theme} q="How do I track my order?" a="Go to Orders tab to see real-time status and rider location when available." />
              <FAQItem theme={theme} q="How can I enable notifications?" a="Open Notifications Preferences and toggle the alerts you want." />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Help Center */}
      <Modal visible={helpOpen} transparent animationType="slide" onRequestClose={() => setHelpOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.line }]}>
            <HeaderRow title="Help Center" onCancel={()=>setHelpOpen(false)} onSave={()=>{ setHelpOpen(false); Alert.alert("Thanks!", "We’ll get back to you soon."); }} theme={theme} />
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

/* ================= Reusable bits ================= */
function HeaderRow({ title, onCancel, onSave, theme }) {
  return (
    <View style={styles.modalHeader}>
      <Pressable onPress={onCancel} style={styles.headerBtn}>
        <Text style={[styles.headerBtnText, { color: theme.sub }]}>Cancel</Text>
      </Pressable>
      <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
      <Pressable onPress={onSave} style={styles.headerBtn}>
        <Text style={[styles.headerBtnText, { color: "#ff6a00" }]}>Save</Text>
      </Pressable>
    </View>
  );
}

function Card({ theme, dark, title, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ position: "absolute", inset: 0, borderRadius: 18, backgroundColor: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.06)" }} />
      <BlurView tint={dark ? "dark" : "light"} intensity={25} style={{ borderRadius: 18, overflow: "hidden" }}>
        <View style={{ borderWidth: 1, borderColor: theme.line, paddingVertical: 10, backgroundColor: theme.cardTint }}>
          <Text style={{ fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, marginHorizontal: 12, color: theme.sub }}>
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
          { paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
      placeholderTextColor="#9ca3af"
      style={[
        { borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: theme.text, backgroundColor: theme.bg === "#ffffff" ? "#fff" : "#0f1115" },
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
function ToggleRow({ label, value, onChange, help }) {
  const schemeDark = useColorScheme() === "dark";
  return (
    <View style={{ paddingVertical: 10, gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: schemeDark ? "#f5f7fb" : "#0f0f14" }}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: schemeDark ? "#3f3f46" : "#d1d5db", true: "#ff6a00" }}
          thumbColor={Platform.OS === "android" ? (value ? "#ffffff" : schemeDark ? "#e5e7eb" : "#ffffff") : undefined}
        />
      </View>
      {help ? <Text style={{ color: schemeDark ? "#9aa3b2" : "#6b7280", fontSize: 12 }}>{help}</Text> : null}
      <View style={{ height: 1, backgroundColor: schemeDark ? "#23252b" : "#ececec", marginTop: 8 }} />
    </View>
  );
}
function FollowItem({ item, theme, onRemove }) {
  return (
    <View style={{
      paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.line,
      borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
      backgroundColor: theme.bg === "#ffffff" ? "#fff" : "#0f1115"
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name={item.type === "restaurant" ? "fast-food-outline" : "person-circle-outline"} size={22} color={theme.sub} />
        <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>{item.name}</Text>
      </View>
      <Pressable onPress={onRemove} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(239,68,68,0.12)" }}>
        <Text style={{ color: "#ef4444", fontWeight: "800" }}>Remove</Text>
      </Pressable>
    </View>
  );
}
function FAQItem({ theme, q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderWidth: 1, borderColor: theme.line, borderRadius: 12, marginBottom: 8, overflow: "hidden", backgroundColor: theme.bg === "#ffffff" ? "#fff" : "#0f1115" }}>
      <Pressable onPress={() => setOpen((s) => !s)} style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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

/* ================= Styles ================= */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingTop: Platform.OS === "ios" ? 72 : 48, paddingHorizontal: 16, paddingBottom: 34 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 14 },
  userRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 52, height: 52, borderRadius: 16 },
  userName: { color: "#fff", fontSize: 18, fontWeight: "800" },
  userEmail: { color: "#ffe8dc", fontSize: 13, marginTop: 2 },

  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8, // ensures it's to the left of Edit
  },
  editPill: { backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  editPillText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  /* Modals */
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "flex-end" },
  modalCard: { width: "100%", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderWidth: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  headerBtn: { paddingVertical: 6, paddingHorizontal: 4, minWidth: 54, alignItems: "center" },
  headerBtnText: { fontSize: 14, fontWeight: "800" },
  modalTitle: { fontSize: 18, fontWeight: "800" },

  modalAvatarWrap: { alignSelf: "center", marginBottom: 8 },
  modalAvatar: { width: 96, height: 96, borderRadius: 20 },
  camBadge: { position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: 999, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },

  /* Buttons */
  addBtn: { backgroundColor: "#ff6a00", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },

});