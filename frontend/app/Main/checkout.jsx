// app/Main/checkout.jsx
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Picker } from "@react-native-picker/picker";

import { useTheme } from "../../contexts/ThemeContext";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../hooks/api";

const TINT = "#ff6600";

/* ---------- robust JSON POST helper ---------- */
async function apiPostJson(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    if (!ct.includes("application/json")) {
        // Server returned HTML (404/500) or something else; surface a readable hint
        throw new Error(`Expected JSON, got: ${ct}. Sample: ${text.slice(0, 140)}...`);
    }

    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
}

export default function CheckoutScreen() {
    const { theme } = useTheme();
    const s = styles(theme);

    const { cart, loading, setCart /*, clearCart*/ } = useCart();
    const items = cart?.items || [];

    const { userId } = useAuth();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [delivery, setDelivery] = useState("delivery"); // "delivery" | "pickup"
    const [pickupStation, setPickupStation] = useState("");
    const [payMethod, setPayMethod] = useState("card"); // "card" | "transfer" | "cod"

    const [submitting, setSubmitting] = useState(false);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const fade = useRef(new Animated.Value(0)).current;

    const showToast = (msg) => {
        setToastMsg(msg);
        setToastVisible(true);
        Animated.sequence([
            Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.delay(1400),
            Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => setToastVisible(false));
    };

    const subtotal = useMemo(() => Number(cart?.subtotal || 0), [cart?.subtotal]);
    const vat = useMemo(() => Math.round(subtotal * 0.075), [subtotal]);
    const deliveryFee = useMemo(() => (delivery === "delivery" ? 1200 : 0), [delivery]);
    const total = useMemo(() => subtotal + vat + deliveryFee, [subtotal, vat, deliveryFee]);

    const placeOrder = async () => {
        // Basic validations to match your Order schema requirements
        if (!userId) {
            showToast("You need to be logged in.");
            return;
        }
        if (!name.trim() || !phone.trim()) {
            showToast("Please provide your name & phone.");
            return;
        }
        if (delivery === "delivery" && !address.trim()) {
            showToast("Delivery address is required.");
            return;
        }
        if (!Array.isArray(items) || items.length === 0) {
            showToast("Your cart is empty.");
            return;
        }

        try {
            setSubmitting(true);

            // Map cart items → Order.items (schema-compatible)
            const payloadItems = items.map((it) => {
                const title = it?.foodId?.name ?? it?.name ?? "Meal";
                const image = it?.foodId?.image ?? it?.image ?? "";
                const qty = Number(it?.quantity || 1);
                const unitPrice = Number(it?.foodId?.price ?? it?.unitPrice ?? 0);

                // Order schema expects `addOns: [{ name, price }]`
                const addOns = Array.isArray(it?.addons)
                    ? it.addons.map((a) => ({
                        name: a?.addOnId?.name ?? a?.name ?? "",
                        price: Number(a?.addOnId?.price ?? a?.price ?? 0),
                    }))
                    : [];

                const addOnsSum = addOns.reduce((acc, a) => acc + Number(a.price || 0), 0);
                const totalPrice = (unitPrice + addOnsSum) * qty;

                return {
                    foodId: it?.foodId?._id || it?.foodId || undefined,
                    name: title,
                    image,
                    quantity: qty,
                    unitPrice,
                    addOns,
                    totalPrice,
                };
            });

            const body = {
                userId, // ObjectId string
                contact: { name: name.trim(), phone: phone.trim() },
                shipping: {
                    deliveryType: delivery, // "delivery" | "pickup"
                    address: address.trim() || undefined,
                    pickupStation: pickupStation || undefined,
                    notes: notes || undefined,
                },
                restaurantId: cart?.restaurantId || undefined,
                items: payloadItems,
                amounts: {
                    subtotal,
                    vat,
                    deliveryFee,
                    total,
                    currency: "NGN",
                },
                payment: {
                    method: payMethod, // enum ["card","transfer","cod"]
                    status: "pending",
                    reference: "",
                },
                status: "pending",
            };

            // Clean base just in case
            const API = (API_URL || "").replace(/\/+$/, "");
            const { order } = await apiPostJson(`${API}/api/orders`, body);

            // Optional: await clearCart();
            showToast("Order placed successfully!");
            // You can navigate to an order details page with order._id if needed
            // router.push(`/(tabs)/orders`);
            setCart((c) => ({ ...c, items: [], subtotal: 0 }));
        } catch (e) {
            showToast(e?.message || "Order failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={s.center}>
                <ActivityIndicator size="large" color={TINT} />
            </View>
        );
    }

    const STATIONS = [
        { id: "1", name: "Lekki Pickup Hub" },
        { id: "2", name: "Ikeja Central Station" },
        { id: "3", name: "Yaba Express Point" },
        { id: "4", name: "Victoria Island Spot" },
    ];

    return (
        <KeyboardAvoidingView
            style={s.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={s.scrollBody} showsVerticalScrollIndicator={false}>
                <Section title="Contact details" theme={theme}>
                    <Field label="Full name" required theme={theme}>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Jane Doe"
                            placeholderTextColor={theme.subtle || "#9aa0ae"}
                            style={s.input}
                        />
                    </Field>
                    <Field label="Phone number" required theme={theme}>
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+234 810 000 0000"
                            placeholderTextColor={theme.subtle || "#9aa0ae"}
                            keyboardType="phone-pad"
                            style={s.input}
                        />
                    </Field>
                </Section>

                <Section title="Delivery options" theme={theme}>
                    <RadioRow
                        label="Deliver to my address"
                        checked={delivery === "delivery"}
                        onPress={() => setDelivery("delivery")}
                        theme={theme}
                        icon="bicycle-outline"
                    />
                    <RadioRow
                        label="I’ll pick up myself"
                        checked={delivery === "pickup"}
                        onPress={() => setDelivery("pickup")}
                        theme={theme}
                        icon="walk-outline"
                    />

                    {delivery === "pickup" && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 6 }}>
                                Select pickup station <Text style={{ color: "#e11d48" }}>*</Text>
                            </Text>
                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: theme.border || "#ccc",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    backgroundColor: theme.background,
                                }}
                            >
                                <Picker
                                    selectedValue={pickupStation}
                                    onValueChange={(value) => setPickupStation(value)}
                                    dropdownIconColor={theme.text}
                                    style={{ color: theme.text }}
                                >
                                    <Picker.Item label="-- Select a station --" value="" />
                                    {STATIONS.map((s) => (
                                        <Picker.Item key={s.id} label={s.name} value={s.name} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    )}

                    {delivery === "delivery" && (
                        <Field label="Delivery address" required theme={theme}>
                            <TextInput
                                value={address}
                                onChangeText={setAddress}
                                placeholder="House/Street, City"
                                placeholderTextColor={theme.subtle || "#9aa0ae"}
                                style={[s.input, { height: 52 }]}
                            />
                        </Field>
                    )}

                    <Field label="Order notes (optional)" theme={theme}>
                        <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Any extra instructions?"
                            placeholderTextColor={theme.subtle || "#9aa0ae"}
                            style={[s.input, { height: 52 }]}
                        />
                    </Field>
                </Section>

                {/* Payment */}
                <Section title="Payment method" theme={theme}>
                    <RadioRow
                        label="Card (Master/Visa/Verve)"
                        checked={payMethod === "card"}
                        onPress={() => setPayMethod("card")}
                        theme={theme}
                        icon="card-outline"
                    />
                    <RadioRow
                        label="Bank transfer"
                        checked={payMethod === "transfer"}
                        onPress={() => setPayMethod("transfer")}
                        theme={theme}
                        icon="cash-outline"
                    />
                    <RadioRow
                        label="Cash on delivery"
                        checked={payMethod === "cod"}
                        onPress={() => setPayMethod("cod")}
                        theme={theme}
                        icon="wallet-outline"
                    />
                </Section>

                {/* Summary */}
                <Section title="Order summary" theme={theme}>
                    {items.length === 0 ? (
                        <Text style={{ color: theme.subtle || "#9aa0ae", fontStyle: "italic" }}>
                            Your cart is empty.
                        </Text>
                    ) : (
                        <FlatList
                            data={items}
                            keyExtractor={(it, idx) => String(it?._id || idx)}
                            renderItem={({ item }) => <SummaryRow item={item} theme={theme} />}
                            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                            scrollEnabled={false}
                        />
                    )}

                    <View style={s.hr} />

                    <Row label="Subtotal" value={`₦${subtotal.toLocaleString()}`} theme={theme} />
                    <Row label="VAT (7.5%)" value={`₦${vat.toLocaleString()}`} theme={theme} />
                    <Row
                        label={`Delivery fee${delivery === "pickup" ? " (pickup)" : ""}`}
                        value={`₦${deliveryFee.toLocaleString()}`}
                        theme={theme}
                    />
                    <View style={{ height: 6 }} />
                    <Row label="Total" value={`₦${total.toLocaleString()}`} theme={theme} strong />
                </Section>
            </ScrollView>

            {/* Place order */}
            <View style={s.bottomBar}>
                <TouchableOpacity
                    style={[s.placeBtn, submitting && { opacity: 0.6 }]}
                    onPress={placeOrder}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                    )}
                    <Text style={s.placeTxt}>{submitting ? "Placing..." : "Place Order"}</Text>
                </TouchableOpacity>
            </View>

            {/* Toast */}
            {toastVisible && (
                <Animated.View style={[s.toast, { opacity: fade }]}>
                    <Ionicons name="information-circle-outline" size={18} color="#fff" />
                    <Text style={s.toastTxt}>{toastMsg}</Text>
                </Animated.View>
            )}
        </KeyboardAvoidingView>
    );
}

/* ---------- small components ---------- */
function Section({ title, theme, children }) {
    return (
        <View style={{ marginBottom: 18 }}>
            <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16, marginBottom: 10 }}>
                {title}
            </Text>
            <View
                style={{
                    backgroundColor: theme.card,
                    borderWidth: 1,
                    borderColor: theme.border || "#ddd",
                    borderRadius: 16,
                    padding: 12,
                    gap: 12,
                }}
            >
                {children}
            </View>
        </View>
    );
}

function Field({ label, required, theme, children }) {
    return (
        <View style={{ gap: 6 }}>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: "700" }}>
                {label} {required ? <Text style={{ color: "#e11d48" }}>*</Text> : null}
            </Text>
            {children}
        </View>
    );
}

function RadioRow({ label, checked, onPress, theme, icon }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: checked ? TINT : theme.border || "#ddd",
                    backgroundColor: checked ? theme.activeBg || theme.background : theme.background,
                    opacity: pressed ? 0.95 : 1,
                },
            ]}
            android_ripple={{ color: theme.ripple || "#e5e7eb" }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name={icon} size={18} color={checked ? TINT : theme.subtle || "#9aa0ae"} />
                <Text style={{ color: theme.text, fontWeight: "700" }}>{label}</Text>
            </View>
            <Ionicons
                name={checked ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={checked ? TINT : theme.subtle || "#9aa0ae"}
            />
        </Pressable>
    );
}

function SummaryRow({ item, theme }) {
    const title = item?.foodId?.name || "Meal";
    const imageUri = item?.foodId?.image || item?.image || null;
    const qty = item?.quantity || 1;
    const price = Number(item?.totalPrice || 0);
    const addons = Array.isArray(item?.addons) ? item.addons : [];

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
                padding: 10,
                borderRadius: 12,
                backgroundColor: theme.background,
                borderWidth: 1,
                borderColor: theme.border || "#ddd",
            }}
        >
            <Image
                source={imageUri ? { uri: imageUri } : require("../../assets/images/placeholder.jpg")}
                style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: "#2a2f39" }}
                contentFit="cover"
            />

            <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "800" }} numberOfLines={1}>
                    {title}
                </Text>
                <Text style={{ color: theme.subtle || "#9aa0ae", fontSize: 12 }}>Qty: {qty}</Text>

                {addons.length > 0 && (
                    <View style={{ marginTop: 4, gap: 2 }}>
                        {addons.map((a, idx) => {
                            const name = a?.addOnId?.name ?? a?.name;
                            const price = a?.addOnId?.price ?? a?.price ?? 0;
                            if (!name) return null;
                            return (
                                <Text
                                    key={String(a._id || idx)}
                                    style={{ color: theme.subtle || "#9aa0ae", fontSize: 12 }}
                                    numberOfLines={1}
                                >
                                    • {name} (+₦{Number(price).toLocaleString()})
                                </Text>
                            );
                        })}
                    </View>
                )}
            </View>

            <Text style={{ color: "#ff6600", fontWeight: "900" }}>₦{price.toLocaleString()}</Text>
        </View>
    );
}

function Row({ label, value, theme, strong }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
            <Text style={{ color: strong ? theme.text : theme.subtle || "#9aa0ae", fontWeight: strong ? "900" : "700" }}>
                {label}
            </Text>
            <Text style={{ color: strong ? theme.text : theme.subtle || "#9aa0ae", fontWeight: strong ? "900" : "700" }}>
                {value}
            </Text>
        </View>
    );
}

/* ---------- styles(theme) ---------- */
const styles = (theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background },
        scrollBody: { padding: 16, paddingBottom: 120 },

        input: {
            backgroundColor: theme.background,
            color: theme.text,
            borderWidth: 1,
            borderColor: theme.border || "#ddd",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: Platform.OS === "ios" ? 12 : 10,
            fontWeight: "600",
        },
        hr: {
            height: 1,
            backgroundColor: theme.border || "#ddd",
            marginVertical: 8,
            opacity: 0.6,
        },

        bottomBar: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: 12,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border || "#eee",
            backgroundColor: theme.background,
        },
        placeBtn: {
            backgroundColor: TINT,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 14,
            flexDirection: "row",
            gap: 8,
        },
        placeTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },

        // toast
        toast: {
            position: "absolute",
            bottom: 90,
            alignSelf: "center",
            backgroundColor: "#111827",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            elevation: 4,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 3,
        },
        toastTxt: { color: "#fff", fontWeight: "700" },
    });

function labelForPay(method) {
    switch (method) {
        case "card":
            return "Card";
        case "transfer":
            return "Bank Transfer";
        case "cod":
            return "Cash on Delivery";
        default:
            return "Unknown";
    }
}
