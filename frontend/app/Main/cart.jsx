import React, { useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import SkeletonList from "../../components/Skeleton";
import { useTheme } from "../../contexts/ThemeContext";
import { usePalette } from "../../utils/palette";
import { useCart } from "../../contexts/CartContext";
import { API_URL } from "../../hooks/api";
import { useRouter } from "expo-router";

export default function Cart() {
    const { theme } = useTheme();
    const p = usePalette(theme);
    const styles = makeStyles(p);
    const router = useRouter()
        ;
    const { cart, loading, setCart, setQuantity, removeItem, clearCart } = useCart();

    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

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
                <Pressable
                    onPress={onRefresh}
                    style={styles.retryBtn}
                    android_ripple={{ color: p.ripple }}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    const items = cart?.items || [];
    const subtotal = Number(cart?.subtotal || 0);

    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <FlatList
                data={items}
                keyExtractor={(it, idx) => String(it?._id || idx)}
                contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                    <CartItemRow
                        item={item}
                        p={p}
                        onInc={() => setQuantity(item._id, item.quantity + 1)}
                        onDec={() => setQuantity(item._id, Math.max(1, item.quantity - 1))}
                        onRemove={() => removeItem(item._id)}
                    />
                )}
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

                            <Pressable
                                onPress={clearCart}
                                style={styles.clearBtn}
                                android_ripple={{ color: p.ripple }}
                            >
                                <Text style={styles.clearText}>Clear cart</Text>
                            </Pressable>

                            <Pressable style={styles.checkoutBtn} onPress={() => router.push("./checkout")}>
                                <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                            </Pressable>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

function CartItemRow({ item, p, onInc, onDec, onRemove }) {
    const title = item?.foodId?.name || "Meal";
    const imageUri = item?.foodId?.image || item?.image || item?.img || null;
    const restaurant = item?.foodId?.restaurantId?.name;


    // Prefer populated addon name/price from addOnId; fall back to snapshot
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
                        : require("../../assets/images/placeholder.jpg")
                }
                style={{ width: 90, height: 90, borderRadius: 12, backgroundColor: "#2a2f39" }}
                contentFit="cover"
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

                {/* Addons */}
                {addons.length > 0 && (
                    <View style={{ marginTop: 6, gap: 4 }}>
                        {addons.map((a) => {
                            const nm = a?.addOnId?.name ?? a?.name;
                            const pr = a?.addOnId?.price ?? a?.price ?? 0;
                            return (
                                <Text key={String(a._id)} numberOfLines={1} style={{ color: p.sub, fontSize: 13 }}>
                                    • {nm} (+₦{Number(pr).toLocaleString()})
                                </Text>
                            );
                        })}
                    </View>
                )}

                {/* Quantity + Price row */}
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
                            style={{ backgroundColor: p.background, padding: 8, borderRadius: 8 }}
                        >
                            <Ionicons name="remove" size={18} color={p.text} />
                        </TouchableOpacity>
                        <Text style={{ color: p.text, fontWeight: "800" }}>{item.quantity}</Text>
                        <TouchableOpacity
                            onPress={onInc}
                            style={{ backgroundColor: p.background, padding: 8, borderRadius: 8 }}
                        >
                            <Ionicons name="add" size={18} color={p.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={{ color: p.price, fontWeight: "900", fontSize: 16 }}>
                        ₦{Number(item.totalPrice || 0).toLocaleString()}
                    </Text>
                </View>
            </View>

            {/* Remove */}
            <TouchableOpacity onPress={onRemove} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color={p.error} />
            </TouchableOpacity>
        </View>
    );
}

function makeStyles(p) {
    return StyleSheet.create({
        center: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
        errorText: { color: p.error, fontSize: 16, textAlign: "center", marginBottom: 12 },
        retryBtn: { backgroundColor: p.tint, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
        retryText: { color: "#fff", fontWeight: "700" },
        emptyText: { color: p.sub, fontSize: 16, marginBottom: 10 },
        totalRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            paddingVertical: 12,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: p.border,
        },
        totalLabel: { color: p.sub, fontSize: 15, fontWeight: "700" },
        totalValue: { color: p.text, fontSize: 18, fontWeight: "900" },
        checkoutBtn: {
            marginTop: 10,
            backgroundColor: p.tint,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
        },
        checkoutText: { color: "#fff", fontWeight: "900", fontSize: 16 },
        clearBtn: {
            marginTop: 4,
            backgroundColor: p.emptyBadge,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
        },
        clearText: { color: p.text, fontWeight: "800" },
    });
}
