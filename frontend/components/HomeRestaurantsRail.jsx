import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { API_URL } from "../hooks/api";


export default function HomeRestaurantsRail({
    title = "Popular Restaurants",
    limit = 12,
    withinKm = 15,
    featured = false,
    onPressRestaurant,
    routeBase = "/restaurant-details",
}) {
    const { theme } = useTheme();
    const s = styles(theme);
    const router = useRouter();

    const [items, setItems] = useState([]);
    const [busy, setBusy] = useState(true);
    const [err, setErr] = useState(null);

    const fade = useRef(new Animated.Value(0)).current;
    const runFadeIn = () =>
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setBusy(true);
                setErr(null);
                const qs = new URLSearchParams({
                    featured: String(featured),
                    sort: "rating",
                    limit: String(limit),
                    withinKm: String(withinKm),
                }).toString();

                const res = await fetch(`${API_URL}/api/restaurants`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const { restaurants } = await res.json();
                if (!mounted) return;
                setItems(Array.isArray(restaurants) ? restaurants : []);
                runFadeIn();
            } catch (e) {
                if (mounted) setErr(e.message || "Failed to load restaurants");
            } finally {
                if (mounted) setBusy(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [featured, limit, withinKm]);

    const handlePress = (r) => {
        if (onPressRestaurant) return onPressRestaurant(r);
        router.push(`${routeBase}/${r._id}`);
    };

    const content = useMemo(() => {
        if (busy) {
            return (
                <View style={s.loaderWrap}>
                    <ActivityIndicator size="small" color={theme.accent || "#FF7A1A"} />
                </View>
            );
        }
        if (err) {
            return (
                <View style={s.errorWrap}>
                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                    <Text style={s.errorTxt}>Couldn’t load restaurants</Text>
                </View>
            );
        }
        if (!items.length) {
            return <Text style={s.emptyTxt}>No restaurants to show.</Text>;
        }
        return (
            <Animated.View style={{ opacity: fade }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                    {items.map((it) => (
                        <TouchableOpacity
                            key={it._id}
                            onPress={() => handlePress(it)}
                            activeOpacity={0.9}
                            style={s.card}
                        >
                            <Image
                                source={{
                                    uri:
                                        it.logo ||
                                        "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800",
                                }}
                                style={s.cardImg}
                                contentFit="cover"
                                transition={150}
                            />

                            {/* open/closed badge */}
                            <View
                                style={[
                                    s.badge,
                                    it.openNow ? s.badgeOpen : s.badgeClosed,
                                ]}
                            >
                                <View style={s.dot(it.openNow)} />
                                <Text style={s.badgeTxt}>{it.openNow ? "Open" : "Closed"}</Text>
                            </View>

                            <View style={s.cardBody}>
                                <Text style={s.name} numberOfLines={1}>
                                    {it.name}
                                </Text>

                                <View style={s.metaRow}>
                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                    <Text style={s.metaTxt}>
                                        {(it.rating?.average ?? 0).toFixed(1)} • {it.rating?.count ?? 0}
                                    </Text>
                                    {it.distanceKm != null && (
                                        <>
                                            <View style={s.dotSep} />
                                            <Ionicons name="navigate" size={12} color={theme.subtle} />
                                            <Text style={s.metaTxt}>{it.distanceKm} km</Text>
                                        </>
                                    )}
                                </View>

                                {!!it.estimatedDeliveryFee && (
                                    <View style={s.feeRow}>
                                        <Ionicons name="bicycle" size={14} color={theme.accent || "#FF7A1A"} />
                                        <Text style={s.feeTxt}>Est. ₦{it.estimatedDeliveryFee}</Text>
                                    </View>
                                )}

                                {!!it.cuisines?.length && (
                                    <Text numberOfLines={1} style={s.cuisines}>
                                        {it.cuisines.join(" • ")}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        );
    }, [busy, err, items, theme]);

    return (
        <View style={s.wrap}>
            <View style={s.header}>
                <Text style={s.title}>{title}</Text>
                {/* Optional "See all" action */}
                {/* <TouchableOpacity><Text style={s.seeAll}>See all</Text></TouchableOpacity> */}
            </View>
            {content}
        </View>
    );
}

const styles = (theme) =>
    StyleSheet.create({
        wrap: { marginTop: 24 },
        header: {
            paddingHorizontal: 16,
            marginBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        title: { fontSize: 18, fontWeight: "700", color: theme.text },
        seeAll: { color: theme.accent || "#FF7A1A", fontWeight: "600" },

        loaderWrap: {
            paddingVertical: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.background,
        },
        errorWrap: {
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
        },
        errorTxt: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
        emptyTxt: { color: theme.subtle || "#8A8F98", paddingHorizontal: 16 },

        card: {
            width: 160,
            backgroundColor: theme.card,
            borderRadius: 16,
            marginRight: 12,
            overflow: "hidden",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border || (theme.isDark ? "#2A2D3A" : "#eee"),
        },
        cardImg: { width: "100%", height: 100 },
        badge: {
            position: "absolute",
            top: 8,
            left: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },
        badgeOpen: { backgroundColor: theme.isDark ? "rgba(34,197,94,0.2)" : "#e8fff1" },
        badgeClosed: { backgroundColor: theme.isDark ? "rgba(239,68,68,0.2)" : "#ffeaea" },
        dot: (on) => ({
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: on ? "#22C55E" : "#EF4444",
        }),
        badgeTxt: {
            fontSize: 11,
            color: theme.isDark ? theme.text : "#111827",
            fontWeight: "600",
        },

        cardBody: { paddingHorizontal: 10, paddingVertical: 10, gap: 6 },
        name: { color: theme.text, fontWeight: "700", fontSize: 14 },

        metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
        metaTxt: { color: theme.subtle || "#80858F", fontSize: 12 },
        dotSep: { width: 4, height: 4, borderRadius: 999, backgroundColor: "#D1D5DB" },

        feeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
        feeTxt: { color: theme.accent || "#FF7A1A", fontWeight: "700", fontSize: 12 },

        cuisines: { color: theme.subtle || "#80858F", fontSize: 11 },
    });
