// app/(tabs)/cart/index.jsx
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_URL } from "../../../hooks/api";
import { useTheme } from "../../../contexts/ThemeContext";
import { usePalette } from "../../../utils/palette";
import { useCart } from "../../../contexts/CartContext";
import SkeletonList from "../../../components/Skeleton";

export default function Cart() {
    const { theme } = useTheme();
    const p = usePalette(theme);
    const styles = makeStyles(p);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { cart, loading, setCart, setQuantity, removeItem, clearCart } = useCart();

    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    // track which line(s) are being deleted
    const [deletingIds, setDeletingIds] = useState(new Set());

    const onRefresh = useCallback(async () => {
        if (!cart?.userId) return;
        try {
            setRefreshing(true);
            setError("");
            const res = await fetch(
                `${API_URL}/cart?userId=${encodeURIComponent(String(cart.userId))}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
            setCart(data);
        } catch (e) {
            setError(e?.message || "Failed to refresh cart");
        } finally {
            setRefreshing(false);
        }
    }, [cart?.userId, setCart]);

    if (loading) return <SkeletonList items={4} />;

    if (error) {
        return (
            <View style={[styles.center, { backgroundColor: p.background }]}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={onRefresh} style={styles.retryBtn} android_ripple={{ color: p.ripple }}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    const items = cart?.items || [];
    const subtotal = Number(cart?.subtotal || 0);

    // height of the custom top bar (content area), plus safe area
    const TOPBAR_H = 56 + insets.top;

    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            {/* --- Custom Top Bar with Back Button --- */}
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    paddingTop: insets.top,
                    height: TOPBAR_H,
                    backgroundColor: p.background,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderColor: p.border,
                    zIndex: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: p.card,
                        borderWidth: 1,
                        borderColor: p.border,
                    }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="chevron-back" size={20} color={p.text} />
                </TouchableOpacity>

                <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ color: p.text, fontWeight: "900", fontSize: 18 }} numberOfLines={1}>
                        Your Cart
                    </Text>
                    <Text style={{ color: p.sub, fontSize: 12 }}>
                        {items.length} item{items.length === 1 ? "" : "s"} · ₦{subtotal.toLocaleString()}
                    </Text>
                </View>
            </View>

            <FlatList
                data={items}
                keyExtractor={(it, idx) => String(it?._id || idx)}
                // Pad top so content starts below the custom top bar
                contentContainerStyle={{ padding: 16, paddingTop: TOPBAR_H + 8 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => {
                    const deleting = deletingIds.has(String(item._id));

                    const removeLine = async () => {
                        const id = String(item._id);
                        if (deletingIds.has(id)) return;
                        setDeletingIds((prev) => {
                            const next = new Set(prev);
                            next.add(id);
                            return next;
                        });
                        try {
                            await removeItem(id);
                        } finally {
                            setDeletingIds((prev) => {
                                const next = new Set(prev);
                                next.delete(id);
                                return next;
                            });
                        }
                    };

                    return (
                        <CartItemRow
                            item={item}
                            p={p}
                            onInc={() => setQuantity(item._id, item.quantity + 1)}
                            onDec={() => setQuantity(item._id, Math.max(0, item.quantity - 1))} // 0 will remove on backend
                            onRemove={removeLine}
                            deleting={deleting}
                        />
                    );
                }}
                refreshControl={
                    <RefreshControl
                        tintColor={p.sub}
                        colors={[p.tint]}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                ListEmptyComponent={
                    <View style={[styles.center, { paddingVertical: 48 }]}>
                        <Text style={styles.emptyText}>Your cart is empty.</Text>
                    </View>
                }
                ListFooterComponent={
                    items.length > 0 ? (
                        <View style={{ paddingTop: 12 }}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalValue}>₦{subtotal.toLocaleString()}</Text>
                            </View>

                            <Pressable onPress={clearCart} style={styles.clearBtn} android_ripple={{ color: p.ripple }}>
                                <Text style={styles.clearText}>Clear cart</Text>
                            </Pressable>

                            <Pressable style={styles.checkoutBtn} onPress={() => router.push("/Main/checkout")}>
                                <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                            </Pressable>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

function CartItemRow({ item, p, onInc, onDec, onRemove, deleting }) {
    const title = item?.foodId?.name || "Meal";
    const imageUri = item?.foodId?.image || item?.image || item?.img || null;
    const restaurant = item?.foodId?.restaurantId?.name;

    const addons = Array.isArray(item.addons) ? item.addons : [];

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                borderRadius: 18,
                backgroundColor: p.card,
                borderWidth: 1,
                borderColor: p.border,
                shadowColor: p.shadow,
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 10,
                elevation: 6,
                gap: 12,
            }}
        >
            <Image
                source={
                    imageUri
                        ? { uri: imageUri }
                        : require("../../../assets/images/placeholder.jpg")
                }
                style={{ width: 90, height: 90, borderRadius: 12, backgroundColor: "#2a2f39" }}
            />

            <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: p.text, fontWeight: "800", fontSize: 16 }}>
                    {title}
                </Text>
                {!!restaurant && (
                    <Text numberOfLines={1} style={{ color: p.sub, fontSize: 13, marginTop: 2 }}>
                        {restaurant}
                    </Text>
                )}

                {addons.length > 0 && (
                    <View style={{ marginTop: 6, gap: 4 }}>
                        {addons.map((a) => {
                            const nm = a?.addOnId?.name ?? a?.name;
                            const pr = a?.addOnId?.price ?? a?.price ?? 0;
                            return (
                                <Text key={String(a._id || nm)} numberOfLines={1} style={{ color: p.sub, fontSize: 13 }}>
                                    • {nm} (+₦{Number(pr).toLocaleString()})
                                </Text>
                            );
                        })}
                    </View>
                )}

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 10,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                            onPress={onDec}
                            disabled={deleting}
                            style={{ backgroundColor: p.background, padding: 8, borderRadius: 8, opacity: deleting ? 0.5 : 1 }}
                        >
                            <Ionicons name="remove" size={18} color={p.text} />
                        </TouchableOpacity>
                        <Text style={{ color: p.text, fontWeight: "800" }}>{item.quantity}</Text>
                        <TouchableOpacity
                            onPress={onInc}
                            disabled={deleting}
                            style={{ backgroundColor: p.background, padding: 8, borderRadius: 8, opacity: deleting ? 0.5 : 1 }}
                        >
                            <Ionicons name="add" size={18} color={p.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={{ color: p.price, fontWeight: "900", fontSize: 16 }}>
                        ₦{Number(item.totalPrice || 0).toLocaleString()}
                    </Text>
                </View>
            </View>

            {deleting ? (
                <ActivityIndicator color={p.tint} />
            ) : (
                <TouchableOpacity onPress={onRemove} style={{ padding: 8 }}>
                    <Ionicons name="trash-outline" size={20} color={p.error} />
                </TouchableOpacity>
            )}
        </View>
    );
}

/* ---------- styles ---------- */
function makeStyles(p) {
    return StyleSheet.create({
        center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
        errorText: { color: p.error, textAlign: "center", paddingHorizontal: 16 },
        retryBtn: {
            marginTop: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: p.card,
            borderWidth: 1,
            borderColor: p.border,
        },
        retryText: { color: p.text, fontWeight: "700" },

        emptyText: { color: p.sub },

        totalRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
        },
        totalLabel: { color: p.sub, fontSize: 14 },
        totalValue: { color: p.text, fontWeight: "900", fontSize: 16 },

        clearBtn: {
            backgroundColor: p.card,
            borderWidth: 1,
            borderColor: p.border,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            marginBottom: 10,
        },
        clearText: { color: p.error, fontWeight: "800" },

        checkoutBtn: {
            backgroundColor: p.tint,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
        },
        checkoutText: { color: p.onTint || "#fff", fontWeight: "800" },
    });
}
