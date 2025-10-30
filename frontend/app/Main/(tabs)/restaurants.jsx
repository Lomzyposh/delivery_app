import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRestaurants } from "../../../contexts/RestaurantContext";
import { useTheme } from "../../../contexts/ThemeContext";

const estimateTime = (r) => (r?.deliveryFee?.perKm ? 15 : 10);

/* ----------------------------- Card ----------------------------- */
function RestaurantCard({ item, onPress, styles, theme }) {
    const rating = Number(item?.rating?.average || 0);
    const count = Number(item?.rating?.count || 0);
    const cuisines =
        Array.isArray(item?.cuisines) && item.cuisines.length
            ? item.cuisines.slice(0, 3).join(" • ")
            : "";

    const isOpen = !!item?.isOpen;

    return (
        <Pressable onPress={onPress} style={styles.card}>
            <View style={styles.cardRow}>
                <Image
                    source={{
                        uri:
                            item.logo ||
                            item.bannerImage ||
                            "https://via.placeholder.com/128x128.png?text=Restaurant",
                    }}
                    style={styles.logo}
                    contentFit="cover"
                    transition={200}
                />
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item?.name || "Restaurant"}
                    </Text>

                    <View style={styles.rowMid}>
                        <Ionicons name="star" size={14} color={theme.star || "#FFB800"} />
                        <Text style={styles.ratingText}>
                            {rating.toFixed(1)} <Text style={styles.count}>({count})</Text>
                        </Text>
                        {!!cuisines && (
                            <>
                                <Text style={styles.dot}>•</Text>
                                <Text style={styles.cuisines} numberOfLines={1}>
                                    {cuisines}
                                </Text>
                            </>
                        )}
                    </View>

                    <View style={styles.rowBottom}>
                        <Ionicons name="bicycle-outline" size={14} color={theme.sub} />
                        <Text style={styles.meta}>
                            Fee: ₦{Number(item?.deliveryFee?.base || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.dot}>•</Text>
                        <Ionicons name="time-outline" size={14} color={theme.sub} />
                        <Text style={styles.meta}>~ {estimateTime(item)} min</Text>

                        <Text
                            style={[
                                styles.badge,
                                isOpen ? styles.open : styles.closed,
                            ]}
                        >
                            {isOpen ? "Open" : "Closed"}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

/* --------------------------- Screen --------------------------- */
export default function RestaurantsTab() {
    const router = useRouter();
    const { restaurants: ctxRestaurants, refetch } = useRestaurants();
    const { theme } = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            if (typeof refetch === "function") {
                await refetch(); // updates context
            }
        } catch (e) {
            setError(e?.message || "Failed to load restaurants");
        } finally {
            setLoading(false);
        }
    }, [refetch]);

    useEffect(() => {
        load();
    }, [load]);

    const restaurants = Array.isArray(ctxRestaurants) ? ctxRestaurants : [];

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return restaurants;
        return restaurants.filter((r) => {
            const name = String(r?.name || "").toLowerCase();
            const cuisines = Array.isArray(r?.cuisines)
                ? r.cuisines.join(" ").toLowerCase()
                : "";
            return name.includes(needle) || cuisines.includes(needle);
        });
    }, [q, restaurants]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={18} color={theme.sub} />
                <TextInput
                    placeholder="Search restaurants or cuisines..."
                    placeholderTextColor={theme.sub}
                    value={q}
                    onChangeText={setQ}
                    style={styles.input}
                    returnKeyType="search"
                />
                <Pressable onPress={load} style={styles.refresh}>
                    <Ionicons name="refresh" size={18} color={theme.text} />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={theme.tint} />
                    <Text style={styles.dim}>Loading restaurants…</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.err}>Failed: {error}</Text>
                    <Pressable onPress={load} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Try again</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(it, i) => String(it?._id || it?.id || i)}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    renderItem={({ item }) => {
                        const id = item?._id || item?.id;
                        return (
                            <RestaurantCard
                                item={item}
                                theme={theme}
                                styles={styles}
                                onPress={() =>
                                    router.push({
                                        pathname: "/Main/restaurant",
                                        params: { id: String(id) },
                                    })
                                }
                            />
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.dim}>No restaurants match your search.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

/* -------------------------- Themed Styles -------------------------- */
function getStyles(theme) {
    const shadowOpacity = theme.isDark ? 0.15 : 0.06;

    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },

        searchRow: {
            margin: 16,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.field,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            shadowColor: "#000",
            shadowOpacity,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
        },
        input: { flex: 1, fontSize: 15, color: theme.text },
        refresh: {
            padding: 6,
            borderRadius: 8,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
        },

        center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
        dim: { color: theme.sub },
        err: { color: theme.error || "#e11d48", paddingHorizontal: 16, textAlign: "center" },
        retryBtn: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: theme.field,
            borderWidth: 1,
            borderColor: theme.border,
        },
        retryText: { color: theme.text, fontWeight: "700" },

        card: {
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 12,
            shadowColor: "#000",
            shadowOpacity,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
        },
        cardRow: { flexDirection: "row", gap: 12 },
        logo: {
            width: 66,
            height: 66,
            borderRadius: 12,
            backgroundColor: theme.field,
        },
        title: { fontSize: 16, fontWeight: "700", color: theme.text },

        rowMid: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 2,
            flexWrap: "nowrap",
        },
        ratingText: { color: theme.text, fontSize: 13 },
        count: { color: theme.sub, fontWeight: "400" },
        dot: { color: theme.sub, marginHorizontal: 4 },
        cuisines: { color: theme.sub, fontSize: 12, flexShrink: 1 },

        rowBottom: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
            flexWrap: "wrap",
        },
        meta: { color: theme.sub, fontSize: 12 },

        badge: {
            marginLeft: "auto",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            fontSize: 11,
            overflow: "hidden",
            borderWidth: 1,
        },
        open: {
            backgroundColor: theme.successBg || "#e8f7ed",
            color: theme.successText || "#1f9254",
            borderColor: theme.successBorder || "rgba(16,185,129,0.25)",
        },
        closed: {
            backgroundColor: theme.errorBg || "#fde8e8",
            color: theme.errorText || "#b42318",
            borderColor: theme.errorBorder || "rgba(244,63,94,0.25)",
        },
    });
}
