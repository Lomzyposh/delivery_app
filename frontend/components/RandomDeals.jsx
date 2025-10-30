// components/RandomDeals.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { API_URL } from "../hooks/api";

const NGN = (n) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
        Number.isFinite(n) ? n : 0
    );

const pickRandom = (arr, n) => {
    const copy = Array.isArray(arr) ? [...arr] : [];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
};

export default function RandomDeals({ onPressItem }) {
    const { theme, isDarkMode } = useTheme();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    const styles = useMemo(
        () => ({
            wrap: { marginTop: 18 },
            headerRow: {
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
            },
            title: { fontSize: 18, fontWeight: "800", color: theme.text },
            seeAll: { color: theme.tint, fontWeight: "700" },
            list: { paddingHorizontal: 12, paddingTop: 10 },
            card: {
                width: 280,
                marginHorizontal: 4,
                padding: 10,
                borderRadius: 16,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: isDarkMode ? 0.25 : 0.12,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
            },
            imgBox: {
                width: 84,
                height: 84,
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: theme.field,
            },
            img: { width: "100%", height: "100%" },
            body: { flex: 1 },
            name: { color: theme.text, fontSize: 14, fontWeight: "800" },
            meta: { color: theme.sub, fontSize: 12, marginTop: 2 },
            priceRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 },
            newPrice: { color: theme.tint, fontWeight: "900", fontSize: 15 },
            oldPrice: { color: theme.sub, textDecorationLine: "line-through", fontSize: 12 },
            footRow: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
            ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
            ratingText: { color: theme.sub, fontSize: 12 },
            chevron: { padding: 6 },
            badge: {
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "#FF5A5F",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                zIndex: 2,
            },
            badgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
            btn: {
                marginTop: 8,
                paddingVertical: 8,
                paddingHorizontal: 10,
                backgroundColor: theme.field,
                borderRadius: 10,
                alignSelf: "flex-start",
            },
            btnText: { color: theme.text, fontWeight: "700", fontSize: 12 },
            loaderRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 },
            error: { paddingHorizontal: 16, color: "#ff6b6b", marginTop: 8 },
        }),
        [theme, isDarkMode]
    );

    const fetchDeals = useCallback(async () => {
        try {
            setLoading(true);
            setErr(null);
            const res = await axios.get(`${API_URL}/api/meals`, { timeout: 12000 });
            const all = Array.isArray(res.data) ? res.data : res.data?.meals || [];
            const three = pickRandom(all.filter((m) => m?.isAvailable !== false), 10);
            setDeals(three);
        } catch (e) {
            setErr(e?.message || "Failed to load deals");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    const renderItem = ({ item }) => {
        const oldPrice = item?.price || 0;
        const newPrice = Math.round(oldPrice * (1 - (item?.discount || 0) / 100));

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.card}
                onPress={() => onPressItem && onPressItem(item)}
            >
                <View style={styles.imgBox}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>-{item?.discount ?? 0}%</Text>
                    </View>
                    <Image source={{ uri: item?.image }} style={styles.img} />
                </View>

                <View style={styles.body}>
                    <Text numberOfLines={1} style={styles.name}>
                        {item?.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.meta}>
                        {(item?.restaurantId && item.restaurantId.name) || "Featured"} • {item?.category}
                    </Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.newPrice}>{NGN(newPrice)}</Text>
                        <Text style={styles.oldPrice}>{NGN(oldPrice)}</Text>
                    </View>

                    <View style={styles.footRow}>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={14} color={"goldenrod"} />
                            <Text style={styles.ratingText}>
                                {((item?.rating && item.rating.average) || 0).toFixed(1)} ({(item?.rating && item.rating.count) || 0})
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.chevron}>
                    <Ionicons name="chevron-forward" size={18} color={theme.sub} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.wrap}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Deals for you</Text>
                <TouchableOpacity onPress={fetchDeals}>
                    <Text style={styles.seeAll}>Shuffle</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderRow}>
                    <ActivityIndicator />
                    <Text style={{ color: theme.sub }}>Loading fresh deals…</Text>
                </View>
            ) : err ? (
                <Text style={styles.error}>{err}</Text>
            ) : (
                <FlatList
                    data={deals}
                    keyExtractor={(m) => m._id}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={288}
                />
            )}
        </View>
    );
}
