// app/(tabs)/orders/index.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { API_URL } from "../../../hooks/api";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/CartContext";

/* ---------- helpers ---------- */
async function safeJsonFetch(url, options = {}) {
    const res = await fetch(url, {
        headers: { Accept: "application/json", ...(options.headers || {}) },
        ...options,
    });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
        throw new Error(`Expected JSON, got: ${ct}. Sample: ${text.slice(0, 120)}…`);
    }
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
}

function formatNaira(n) {
    return `₦${Number(n || 0).toLocaleString()}`;
}

function shortId(id = "") {
    return id.length > 8 ? id.slice(-8).toUpperCase() : id;
}

function formatDate(d) {
    try {
        const dt = new Date(d);
        return dt.toLocaleString();
    } catch {
        return String(d || "");
    }
}

// Nice label + color for each status
function statusMeta(status) {
    const map = {
        pending: { label: "Pending", bg: "#fef3c7", fg: "#92400e", icon: "time-outline" },
        confirmed: { label: "Confirmed", bg: "#e0f2fe", fg: "#075985", icon: "checkmark-circle-outline" },
        preparing: { label: "Preparing", bg: "#ede9fe", fg: "#5b21b6", icon: "restaurant-outline" },
        "ready-for-pickup": { label: "Ready", bg: "#dcfce7", fg: "#166534", icon: "bag-check-outline" },
        "out-for-delivery": { label: "On its way", bg: "#e0f2fe", fg: "#075985", icon: "bicycle-outline" },
        completed: { label: "Completed", bg: "#d1fae5", fg: "#065f46", icon: "checkmark-done-circle-outline" },
        cancelled: { label: "Cancelled", bg: "#fee2e2", fg: "#991b1b", icon: "close-circle-outline" },
    };
    return map[status] || { label: status || "Unknown", bg: "#e5e7eb", fg: "#374151", icon: "help-circle-outline" };
}

/* ---------- Screen ---------- */
export default function OrdersScreen() {
    const { theme } = useTheme();
    const s = styles(theme);
    const router = useRouter();
    const { userId } = useAuth();


    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const canQuery = useMemo(() => !!userId, [userId]);

    const fetchOrders = useCallback(async () => {
        if (!canQuery) return;
        try {
            setError("");
            const data = await safeJsonFetch(
                `${API_URL}/api/orders?userId=${encodeURIComponent(String(userId))}`
            );
            setOrders(Array.isArray(data?.orders) ? data.orders : []);
        } catch (e) {
            setError(e?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [canQuery, userId]);

    useEffect(() => {
        setLoading(true);
        fetchOrders();
    }, [fetchOrders]);

    // Light auto-poll (optional): refresh every 20s so status updates reflect
    useEffect(() => {
        if (!canQuery) return;
        const t = setInterval(fetchOrders, 20000);
        return () => clearInterval(t);
    }, [canQuery, fetchOrders]);

    const onRefresh = useCallback(async () => {
        if (!canQuery) return;
        try {
            setRefreshing(true);
            await fetchOrders();
        } finally {
            setRefreshing(false);
        }
    }, [canQuery, fetchOrders]);

    if (!userId) {
        return (
            <View style={s.center}>
                <Ionicons name="person-circle-outline" size={48} color={theme.subtle || "#9aa0ae"} />
                <Text style={s.subtle}>Please sign in to view your orders.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={s.center}>
                <ActivityIndicator size="large" color={theme.tint || "#ff6600"} />
                <Text style={s.subtle}>Loading your orders…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={s.center}>
                <Ionicons name="warning-outline" size={28} color={theme.error || "#ef4444"} />
                <Text style={[s.subtle, { color: theme.error || "#ef4444", marginTop: 6 }]}>{error}</Text>
                <TouchableOpacity style={s.retryBtn} onPress={fetchOrders} activeOpacity={0.9}>
                    <Text style={s.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={s.wrap}>
            <View style={s.header}>
                <Text style={s.title}>My Orders</Text>
                <Text style={s.caption}>
                    {orders.length} {orders.length === 1 ? "order" : "orders"}
                </Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(o) => String(o._id)}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.subtle || "#9aa0ae"}
                        colors={[theme.tint || "#ff6600"]}
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                ListEmptyComponent={
                    <View style={[s.center, { paddingVertical: 64 }]}>
                        <Ionicons name="receipt-outline" size={48} color={theme.subtle || "#9aa0ae"} />
                        <Text style={s.subtle}>You don’t have any orders yet.</Text>
                    </View>
                }
                renderItem={({ item }) => <OrderCard order={item} theme={theme} onPress={() => {
                    // if you have a detail page, navigate to it:
                    // router.push(`/orders/${item._id}`)
                }} />}
            />
        </View>
    );
}

/* ---------- Card ---------- */
function OrderCard({ order, theme, onPress }) {
    const s = styles(theme);
    const meta = statusMeta(order?.status);
    const firstItem = order?.items?.[0];
    const previewImg = firstItem?.image || firstItem?.foodId?.image || null;

    return (
        <TouchableOpacity
            style={s.card}
            activeOpacity={0.9}
            onPress={onPress}
        >
            <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={s.orderId}>Order #{shortId(order?._id)}</Text>
                    <Text style={s.timeText}>{formatDate(order?.createdAt)}</Text>
                </View>

                <View style={[s.badge, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={14} color={meta.fg} />
                    <Text style={[s.badgeText, { color: meta.fg }]}>{meta.label}</Text>
                </View>
            </View>

            <View style={s.row}>
                {/* items preview */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <View style={s.thumbWrap}>
                        {previewImg ? (
                            <Image source={{ uri: previewImg }} style={s.thumb} contentFit="cover" />
                        ) : (
                            <View style={[s.thumb, { backgroundColor: "#1f2937" }]} />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={s.itemTitle}>
                            {firstItem?.name || firstItem?.foodId?.name || "Meal"}
                        </Text>
                        <Text numberOfLines={1} style={s.itemSub}>
                            {order?.items?.length || 0} item{(order?.items?.length || 0) === 1 ? "" : "s"} ·{" "}
                            {formatNaira(order?.amounts?.subtotal)}
                        </Text>
                    </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.totalVal}>{formatNaira(order?.amounts?.total)}</Text>
                    <Text style={s.currencyText}>{order?.amounts?.currency || "NGN"}</Text>
                </View>
            </View>

            {/* shipping hint */}
            <View style={s.shipRow}>
                {order?.shipping?.deliveryType === "delivery" ? (
                    <>
                        <Ionicons name="bicycle-outline" size={14} color={theme.subtle || "#9aa0ae"} />
                        <Text numberOfLines={1} style={s.shipText}>
                            Deliver to: {order?.shipping?.address || "—"}
                        </Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="walk-outline" size={14} color={theme.subtle || "#9aa0ae"} />
                        <Text numberOfLines={1} style={s.shipText}>
                            Pickup: {order?.shipping?.pickupStation || "—"}
                        </Text>
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
}

/* ---------- styles ---------- */
const styles = (theme) =>
    StyleSheet.create({
        wrap: { flex: 1, backgroundColor: theme.background },
        header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
        title: { color: theme.text, fontWeight: "900", fontSize: 20 },
        caption: { color: theme.subtle || "#9aa0ae", marginTop: 2 },

        center: { flex: 1, alignItems: "center", justifyContent: "center" },
        subtle: { color: theme.subtle || "#9aa0ae", marginTop: 6 },

        retryBtn: {
            marginTop: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border || "#e5e7eb",
        },
        retryText: { color: theme.text, fontWeight: "700" },

        card: {
            backgroundColor: theme.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border || "#e5e7eb",
            padding: 12,
            gap: 10,
        },
        cardTop: { flexDirection: "row", alignItems: "center" },
        orderId: { color: theme.text, fontWeight: "900" },
        timeText: { color: theme.subtle || "#9aa0ae", marginTop: 2, fontSize: 12 },

        badge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 9999,
        },
        badgeText: { fontWeight: "800", fontSize: 12 },

        row: { flexDirection: "row", alignItems: "center", gap: 12 },
        thumbWrap: {
            width: 52,
            height: 52,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.border || "#e5e7eb",
            backgroundColor: theme.background,
        },
        thumb: { width: "100%", height: "100%" },

        itemTitle: { color: theme.text, fontWeight: "800" },
        itemSub: { color: theme.subtle || "#9aa0ae", marginTop: 2, fontSize: 12 },

        totalVal: { color: theme.text, fontWeight: "900" },
        currencyText: { color: theme.subtle || "#9aa0ae", fontSize: 12 },

        shipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
        shipText: { color: theme.subtle || "#9aa0ae", fontSize: 12, flex: 1 },
    });
