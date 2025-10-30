import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API_URL } from "../../hooks/api";
import { useTheme } from "../../contexts/ThemeContext";
import { useCart } from "../../contexts/CartContext";


const fetchJson = async (url) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
};

const norm = (v) => (v == null ? "" : String(v).trim());
const titleCase = (s) =>
    norm(s)
        .replace(/\s+/g, " ")
        .toLowerCase()
        .replace(/\b([a-z])/g, (m) => m.toUpperCase());

/** Extract clean category strings from a food item (very defensive). */
function extractCategories(it) {
    const raw =
        it?.category ??
        it?.categories ??
        it?.tags ??
        (it?.category?.name ? it.category.name : null);

    let arr = [];
    if (Array.isArray(raw)) arr = raw;
    else if (raw == null) arr = [];
    else arr = [raw];

    const out = arr
        .flatMap((x) => {
            if (x == null) return [];
            if (typeof x === "string" || typeof x === "number") return [String(x)];
            if (typeof x === "object" && x?.name != null) return [String(x.name)];
            return [];
        })
        .map((s) => s.replace(/^[•.\-–—]+/, "")) // strip bullets/dots
        .map((s) => titleCase(s))
        .map((s) => s.trim())
        .filter(Boolean);

    return out.length ? out : ["Others"];
}

function buildCategoryCount(foods) {
    const map = new Map();
    for (const f of foods) {
        for (const c of extractCategories(f)) {
            map.set(c, (map.get(c) || 0) + 1);
        }
    }
    if (!map.size) map.set("Others", 0);
    return map;
}

/** Popular: featured first, otherwise by rating/sales. */
function pickPopular(foods, take = 8) {
    const featured = foods.filter((x) => x?.isFeatured);
    if (featured.length) return featured.slice(0, take);
    return foods
        .slice()
        .sort((a, b) => {
            const ar = a?.rating ?? a?.ratingAverage ?? a?.rating?.average ?? 0;
            const br = b?.rating ?? b?.ratingAverage ?? b?.rating?.average ?? 0;
            if (br !== ar) return br - ar;
            const as = a?.sales ?? a?.orders ?? 0;
            const bs = b?.sales ?? b?.orders ?? 0;
            return bs - as;
        })
        .slice(0, take);
}

function toMoney(n) {
    const num = Number.isFinite(n) ? n : 0;
    try {
        return num.toLocaleString();
    } catch {
        return String(num);
    }
}

function estimateTime(r) {
    return r?.deliveryFee?.perKm ? 20 : 12;
}

/* -------------------------------------------------------------
   Small UI bits (themed)
------------------------------------------------------------- */
function StatChip({ icon, text, styles }) {
    return (
        <View style={styles.chip}>
            {!!icon && <Ionicons name={icon} size={13} color={styles.iconColor.color} />}
            <Text style={styles.chipText}>{text}</Text>
        </View>
    );
}

/**
 * Food Card
 * - shows current qty if present in cart
 * - add button increments if already in cart, otherwise adds new
 */
function FoodCard({ item, onAdd, inCartQty, styles, theme, onOpenDetails }) {
    const discount = Number(item?.discount || 0);
    const price = Number(item?.price || 0);
    const hasDiscount = discount > 0;
    const finalPrice = Math.max(0, price * (1 - discount / 100));

    return (
        <Pressable onPress={() => onOpenDetails?.(item)} style={styles.foodCard}>
            <Image
                source={{
                    uri:
                        item?.image ||
                        item?.images?.[0] ||
                        "https://via.placeholder.com/300x200.png?text=Meal",
                }}
                style={styles.foodImg}
                contentFit="cover"
                transition={200}
            />

            {/* qty pill if in cart */}
            {inCartQty > 0 && (
                <View style={styles.qtyPill}>
                    <Text style={styles.qtyPillText}>×{inCartQty}</Text>
                </View>
            )}

            <Text style={styles.foodTitle} numberOfLines={1}>
                {item?.name || "Delicious Meal"}
            </Text>
            <Text style={styles.foodDesc} numberOfLines={2}>
                {item?.description || "Tasty meal prepared fresh."}
            </Text>

            <View style={styles.foodRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.foodPrice}>₦{toMoney(finalPrice)}</Text>
                    {hasDiscount && <Text style={styles.foodPriceStrike}> ₦{toMoney(price)}</Text>}
                </View>
                <Pressable style={styles.addBtn} onPress={() => onAdd?.(item)}>
                    <Ionicons name="add" size={18} color={theme.onTint || "#fff"} />
                </Pressable>
            </View>

            {hasDiscount && (
                <View style={styles.discountTag}>
                    <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
            )}
        </Pressable>
    );
}

/**
 * Horizontal category bar with counts
 */
function CategoryBar({ tabs, counts, active, onChange, styles }) {
    return (
        <View style={styles.catWrap}>
            <FlatList
                horizontal
                data={tabs}
                keyExtractor={(label) => `tab-${label}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                renderItem={({ item: label }) => {
                    const isActive = active === label;
                    const count =
                        label !== "Popular" && label !== "All" ? counts[label] ?? 0 : null;
                    return (
                        <Pressable
                            onPress={() => onChange(label)}
                            style={[styles.catItem, isActive && styles.catItemActive]}
                        >
                            <Text style={[styles.catText, isActive && styles.catTextActive]} numberOfLines={1}>
                                {label}
                            </Text>
                            {count != null && (
                                <Text style={[styles.count, isActive && styles.countActive]} numberOfLines={1}>
                                    {count}
                                </Text>
                            )}
                            {isActive && <View style={styles.underline} />}
                        </Pressable>
                    );
                }}
            />
        </View>
    );
}

/* -------------------------------------------------------------
   Main Screen
------------------------------------------------------------- */
export default function RestaurantDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const safeId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

    const { theme, isDarkMode } = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    // 🛒 Cart hooks
    const { cart, loading: cartLoading, addToCart, setQuantity, removeItem } = useCart();

    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);
    const [foods, setFoods] = useState([]);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("Popular");
    const [busyMap, setBusyMap] = useState({}); // per-food add/increment busy

    const load = useCallback(async () => {
        try {
            if (!safeId) throw new Error("Invalid restaurant id");
            setLoading(true);
            setError("");
            const [r, f] = await Promise.all([
                fetchJson(`${API_URL}/api/restaurants/${encodeURIComponent(safeId)}`),
                fetchJson(`${API_URL}/api/restaurants/${encodeURIComponent(safeId)}/fooditems`),
            ]);
            setRestaurant(r);
            setFoods(Array.isArray(f?.items) ? f.items : Array.isArray(f) ? f : []);
            setTab((prev) => (prev === "Popular" || prev === "All" ? prev : "Popular"));
        } catch (err) {
            setError(String(err?.message || err));
        } finally {
            setLoading(false);
        }
    }, [safeId]);

    useEffect(() => {
        load();
    }, [load]);

    // Build tabs list + counts (sorted by count desc, then alpha)
    const { tabs, counts } = useMemo(() => {
        const map = buildCategoryCount(foods);
        const cats = Array.from(map.entries())
            .sort((a, b) => (b[1] === a[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
            .map(([label]) => (label && label.trim() ? label : "Others"));

        const uniqCats = Array.from(new Set(cats));
        return {
            tabs: ["Popular", "All", ...uniqCats],
            counts: Object.fromEntries(map),
        };
    }, [foods]);

    // Keep tab valid after data changes
    useEffect(() => {
        if (!tabs.includes(tab)) setTab("Popular");
    }, [tabs, tab]);

    const filteredFoods = useMemo(() => {
        if (tab === "Popular") return pickPopular(foods, 8);
        if (tab === "All") return foods;
        return foods.filter((x) => {
            const cats = extractCategories(x);
            return cats.includes(tab) || (tab === "Others" && (!cats || !cats.length));
        });
    }, [foods, tab]);

    // ---------- Cart helpers ----------
    const cartItems = Array.isArray(cart?.items) ? cart.items : [];

    const getFoodLine = useCallback(
        (foodId) => {
            const fid = String(foodId || "");
            for (const line of cartItems) {
                // line.foodId may be a string or an object
                const lineFoodId =
                    typeof line.foodId === "string"
                        ? line.foodId
                        : line.foodId?._id || line.foodId?.id || line.foodId;
                if (String(lineFoodId) === fid) return line;
            }
            return null;
        },
        [cartItems]
    );

    const handleAdd = useCallback(
        async (food) => {
            const fid = food?._id || food?.id;
            if (!fid) return;

            setBusyMap((m) => ({ ...m, [fid]: true }));
            try {
                const line = getFoodLine(fid);
                if (line) {
                    await setQuantity(line._id, (line.quantity || 1) + 1);
                } else {
                    await addToCart({ foodId: String(fid), quantity: 1 });
                }
            } catch (e) {
                console.warn("Add to cart failed:", e?.message || e);
            } finally {
                setBusyMap((m) => ({ ...m, [fid]: false }));
            }
        },
        [addToCart, setQuantity, getFoodLine]
    );

    const openFoodDetails = useCallback(
        (food) => {
            const fid = food?._id || food?.id;
            if (!fid) return;
            router.push({ pathname: "/meal-details", params: { id: String(fid) } });
        },
        [router]
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color={theme.tint} />
                <Text style={styles.dim}>Loading restaurant…</Text>
            </View>
        );
    }
    if (error) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.err}>Failed: {error}</Text>
                <Pressable onPress={load} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Try again</Text>
                </Pressable>
            </View>
        );
    }
    if (!restaurant) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.err}>Restaurant not found</Text>
            </View>
        );
    }

    const rating = restaurant?.rating?.average || 0;
    const count = restaurant?.rating?.count || 0;

    return (
        <View style={styles.container}>
            {/* Banner */}
            <View style={styles.bannerWrap}>
                <Image
                    source={{ uri: restaurant.bannerImage || restaurant.logo }}
                    style={styles.banner}
                    contentFit="cover"
                />
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color={isDarkMode ? "#fff" : "#111"} />
                </Pressable>
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                        source={{ uri: restaurant.logo || restaurant.bannerImage }}
                        style={styles.logo}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.title}>{restaurant.name}</Text>
                        <View style={styles.rowMid}>
                            <Ionicons name="star" size={14} color={theme.star || "#FFB800"} />
                            <Text style={styles.ratingText}>
                                {rating.toFixed(1)} <Text style={styles.count}>({count})</Text>
                            </Text>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.small}>
                                {restaurant.cuisines?.slice(0, 3).join(" • ") || "Cuisine"}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <StatChip
                        icon="time-outline"
                        text={`Delivery ~ ${estimateTime(restaurant)}–${estimateTime(restaurant) + 10} min`}
                        styles={styles}
                    />
                    <StatChip
                        icon="bicycle-outline"
                        text={`Charge: ₦${toMoney(restaurant?.deliveryFee?.base || 0)}`}
                        styles={styles}
                    />
                    <StatChip
                        icon="cash-outline"
                        text={`Min. Order: ₦${toMoney(restaurant?.minOrderValue || 0)}`}
                        styles={styles}
                    />
                </View>

                {!!restaurant.description && (
                    <Text style={styles.desc}>{restaurant.description}</Text>
                )}
            </View>

            {/* Category bar */}
            <CategoryBar tabs={tabs} counts={counts} active={tab} onChange={setTab} styles={styles} />

            {/* Foods */}
            <FlatList
                data={filteredFoods}
                keyExtractor={(it, i) => String(it?._id || it?.id || i)}
                numColumns={2}
                columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
                contentContainerStyle={{ paddingBottom: 48, paddingTop: 8, gap: 12 }}
                renderItem={({ item }) => {
                    const fid = item?._id || item?.id;
                    const line = fid ? getFoodLine(fid) : null;
                    const qty = Number(line?.quantity || 0);
                    const busy = fid ? !!busyMap[fid] : false;

                    return (
                        <View style={{ position: "relative", flex: 1 }}>
                            <FoodCard
                                item={item}
                                styles={styles}
                                theme={theme}
                                inCartQty={qty}
                                onAdd={busy ? undefined : () => handleAdd(item)}
                                onOpenDetails={openFoodDetails}
                            />
                            {busy && (
                                <View style={styles.busyOverlay}>
                                    <ActivityIndicator size="small" color={theme.onTint || "#fff"} />
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={{ padding: 20 }}>
                        <Text style={styles.dim}>No meals in this category.</Text>
                    </View>
                }
            />
        </View>
    );
}

/* -------------------------------------------------------------
   Themed styles (same pattern as Home.jsx)
------------------------------------------------------------- */
function getStyles(theme) {
    const shadowOpacity = theme.isDark ? 0.15 : 0.06;

    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
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

        bannerWrap: { height: 160, backgroundColor: theme.field },
        banner: { width: "100%", height: "100%" },
        backBtn: {
            position: "absolute",
            top: 14,
            left: 14,
            padding: 8,
            borderRadius: 999,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
        },

        infoCard: {
            marginTop: -24,
            marginHorizontal: 16,
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: "#000",
            shadowOpacity,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
        },
        logo: { width: 56, height: 56, borderRadius: 12, backgroundColor: theme.field },
        title: { fontSize: 20, fontWeight: "800", color: theme.text },

        rowMid: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
        ratingText: { color: theme.text, fontSize: 13 },
        count: { color: theme.sub, fontWeight: "400" },
        dot: { color: theme.sub, marginHorizontal: 4 },
        small: { color: theme.sub, fontSize: 12 },

        statsRow: {
            flexDirection: "row",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 10,
        },
        chip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: theme.field,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.border,
        },
        chipText: { color: theme.text, fontSize: 12 },
        iconColor: { color: theme.text },
        desc: { marginTop: 10, color: theme.text, opacity: 0.9, lineHeight: 20 },

        /* Category bar */
        catWrap: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            backgroundColor: theme.background,
            paddingVertical: 8,
            marginTop: 12,
        },
        catItem: {
            position: "relative",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: theme.field,
            borderRadius: 999,
            minWidth: 104,
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.border,
        },
        catItemActive: { backgroundColor: theme.text },
        catText: {
            color: theme.text,
            fontWeight: "800",
            includeFontPadding: false,
            textAlignVertical: "center",
        },
        catTextActive: { color: theme.background },
        count: {
            marginLeft: 8,
            color: theme.text,
            fontWeight: "800",
            backgroundColor: theme.badgeBg || "rgba(0,0,0,0.08)",
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            overflow: "hidden",
        },
        countActive: {
            color: theme.background,
            backgroundColor: "rgba(255,255,255,0.28)",
        },
        underline: {
            position: "absolute",
            bottom: -7,
            height: 3,
            borderRadius: 3,
            width: 36,
            backgroundColor: theme.text,
        },

        /* Food grid */
        foodCard: {
            flex: 1,
            backgroundColor: theme.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 10,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
        },
        foodImg: { width: "100%", height: 110, borderRadius: 12, backgroundColor: theme.field },
        foodTitle: { marginTop: 8, fontWeight: "700", color: theme.text },
        foodDesc: { marginTop: 2, color: theme.sub, fontSize: 12 },
        foodRow: { marginTop: 8, flexDirection: "row", alignItems: "center" },
        foodPrice: { fontWeight: "800", color: theme.text },
        foodPriceStrike: { textDecorationLine: "line-through", color: theme.sub, fontSize: 12 },
        addBtn: {
            marginLeft: "auto",
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: theme.tint,
            alignItems: "center",
            justifyContent: "center",
        },

        discountTag: {
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: theme.tint,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
        },
        discountText: { color: theme.onTint || "#fff", fontSize: 11, fontWeight: "700" },

        // quantity pill overlay on image
        qtyPill: {
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: theme.text,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            zIndex: 2,
        },
        qtyPillText: { color: theme.background, fontWeight: "800", fontSize: 11 },

        busyOverlay: {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.12)",
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
        },
    });
}
