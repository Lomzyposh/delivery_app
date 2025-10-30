// app/(tabs)/listMeals.jsx
import React, { useEffect, useLayoutEffect, useMemo, useState, useCallback } from "react";
import {
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import axios from "axios";
import SkeletonList from "../../components/Skeleton";
import { useTheme } from "../../contexts/ThemeContext";
import { usePalette } from "../../utils/palette";
import { API_URL } from "../../hooks/api";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "../../contexts/FavouriteContext";

const DISCOUNT_OPTIONS = [15, 20, 25, 30];

function toSlug(s) {
    return String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function titleCase(s) {
    return String(s || "")
        .toLowerCase()
        .replace(/\b\w/g, (m) => m.toUpperCase());
}


function getCategoryCandidates(m) {
    // supports: "category": "Dessert", "categories": "Dessert" or ["Dessert", "Cakes"], {category:{name,slug}}
    const out = [];
    if (typeof m?.category === "string") out.push(m.category);
    if (typeof m?.categories === "string") out.push(m.categories);
    if (Array.isArray(m?.categories)) for (const c of m.categories) if (c) out.push(String(c));
    if (m?.category?.name) out.push(m.category.name);
    if (m?.category?.slug) out.push(m.category.slug);
    return out;
}


export default function ListMeals() {
    const { category: categoryParam, discount: discountParam } = useLocalSearchParams();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const p = usePalette(theme);

    const [meals, setMeals] = useState([]);
    const [categories] = useState([
        { label: "Breakfast", value: "breakfast" },
        { label: "Snacks", value: "snacks" },
        { label: "Beef", value: "beef" },
        { label: "Chicken", value: "chicken" },
        { label: "Dessert", value: "dessert" },
    ]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const initialCategory = useMemo(
        () => (categoryParam ? toSlug(categoryParam) : ""),
        [categoryParam]
    );
    const initialDiscount = useMemo(() => {
        const n = Number(discountParam);
        return Number.isFinite(n) && DISCOUNT_OPTIONS.includes(n) ? n : null;
    }, [discountParam]);

    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedDiscount, setSelectedDiscount] = useState(initialDiscount);

    useEffect(() => {
        setSelectedCategory(initialCategory);
    }, [initialCategory]);
    useEffect(() => {
        setSelectedDiscount(initialDiscount);
    }, [initialDiscount]);

    const [openCat, setOpenCat] = useState(false);
    const [openDisc, setOpenDisc] = useState(false);

    const categoryTitle = useMemo(() => {
        const slug = String(selectedCategory || initialCategory || "").trim();
        if (!slug) return "Meals";
        return slug
            .split(/[-_ ]+/)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ");
    }, [selectedCategory, initialCategory]);

    useLayoutEffect(() => {
        const parts = [categoryTitle];
        if (selectedDiscount) parts.push(`${selectedDiscount}% off`);
        navigation.setOptions({ title: parts.filter(Boolean).join(" · ") || "Meals" });
    }, [navigation, categoryTitle, selectedDiscount]);

    const fetchMeals = useCallback(async () => {
        try {
            setError("");
            if (!refreshing) setLoading(true);
            const res = await axios.get(`${API_URL}/api/meals`, { timeout: 12000 });
            const data = res?.data || {};
            console.log("All meals", data.meals[0]);
            const list = Array.isArray(data.meals) ? data.meals : Array.isArray(data) ? data : [];
            setMeals(list);
            const uniq = Array.from(new Set(list.map(m => String(m?.category ?? m?.categories ?? "").trim())));
            console.log("Unique categories from API:", uniq);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load meals. Please try again.");
            setMeals([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        fetchMeals();
    }, [fetchMeals]);

    const filteredMeals = useMemo(() => {
        let out = meals;

        if (selectedCategory) {
            const sel = toSlug(selectedCategory);
            out = out.filter((m) => {
                const cands = getCategoryCandidates(m).map(toSlug);
                return cands.some((c) => c === sel || c.includes(sel));
            });
        }

        if (selectedDiscount) {
            out = out.filter((m) => Number(m?.discount) === Number(selectedDiscount));
        }

        return out;
    }, [meals, selectedCategory, selectedDiscount]);

    const styles = makeStyles(p);

    if (loading) return <SkeletonList items={8} />;

    if (error) {
        return (
            <View style={[styles.center, { backgroundColor: p.background }]}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={fetchMeals} style={styles.retryBtn} android_ripple={{ color: p.ripple }}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <View style={styles.filtersRow}>
                <Dropdown
                    label="Category"
                    placeholder="All"
                    value={selectedCategory}
                    setValue={(v) => setSelectedCategory(v)}
                    open={openCat}
                    setOpen={setOpenCat}
                    options={categories}
                    p={p}
                    allowClear
                />
                <Dropdown
                    label="Discount"
                    placeholder="Any"
                    value={selectedDiscount}
                    setValue={(v) => setSelectedDiscount(v)}
                    open={openDisc}
                    setOpen={setOpenDisc}
                    options={DISCOUNT_OPTIONS.map((d) => ({ label: `${d}%`, value: d }))}
                    p={p}
                    allowClear
                />
            </View>

            {/* List */}
            <FlatList
                data={filteredMeals}
                keyExtractor={(item, idx) => String(item?._id || item?.id || idx)}
                contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => <MealCard meal={item} p={p} />}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        tintColor={p.sub}
                        colors={[p.tint]}
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchMeals();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View style={[styles.center, { paddingVertical: 48 }]}>
                        <Text style={styles.emptyText}>
                            No meals match your filters
                            {selectedCategory ? ` (${selectedCategory})` : ""}
                            {selectedDiscount ? `, ${selectedDiscount}% off` : ""}.
                        </Text>
                        <Pressable
                            onPress={() => {
                                setSelectedCategory("");
                                setSelectedDiscount(null);
                            }}
                            style={styles.retryGhost}
                            android_ripple={{ color: p.ripple }}
                        >
                            <Text style={styles.retryGhostText}>Clear filters</Text>
                        </Pressable>
                    </View>
                }
            />
        </View>
    );
}

/* ----------------- Card ----------------- */
function MealCard({ meal, p }) {
    const img = meal?.image || meal?.img || meal?.photo;
    const title = meal?.name || meal?.title || "Meal";
    const price = meal?.price ?? meal?.amount;
    const restaurantName = meal?.restaurantId?.name || meal?.restaurantName;
    const mealId = meal._id || meal.id;
    const discount = Number(meal?.discount) || 0;
    const { isFavorite, toggleFavorite } = useFavorites();
    const fav = isFavorite(mealId);

    const priceNum = Number(price);
    const finalPrice = Number.isFinite(priceNum)
        ? Math.max(0, priceNum - (priceNum * discount) / 100)
        : null;
    const router = useRouter();

    const itemClick = (mealId) => {
        router.push({ pathname: "/meal-details", params: { id: String(mealId) } });
    };

    return (
        <Pressable
            style={({ pressed }) => [
                {
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
                    marginBottom: 10,
                    gap: 12,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    opacity: pressed ? 0.95 : 1,
                },
            ]}
            android_ripple={{ color: p.ripple }}
            onPress={() => itemClick(mealId)}
        >
            <Image
                source={img ? { uri: img } : require("../../assets/images/placeholder.jpg")}
                style={{
                    width: 110,
                    height: 110,
                    borderRadius: 14,
                    backgroundColor: "#2a2f39",
                }}
                resizeMode="cover"
            />

            {/* Right content */}
            <View style={{ flex: 1, justifyContent: "space-between", height: 110 }}>
                <View>
                    <Text style={{ color: p.text, fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
                        {title}
                    </Text>
                    {!!restaurantName && (
                        <Text style={{ color: p.sub, fontSize: 13, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                            {restaurantName}
                        </Text>
                    )}
                </View>

                {/* Price Section */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    {discount > 0 && finalPrice !== null ? (
                        <>
                            <Text
                                style={{
                                    color: p.sub,
                                    textDecorationLine: "line-through",
                                    fontWeight: "600",
                                    fontSize: 14,
                                }}
                            >
                                ₦{priceNum.toLocaleString()}
                            </Text>
                            <Text
                                style={{
                                    color: p.success,
                                    fontWeight: "900",
                                    fontSize: 16,
                                }}
                            >
                                ₦{finalPrice.toLocaleString()}
                            </Text>
                            <View
                                style={{
                                    backgroundColor: p.tint,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontWeight: "800",
                                        fontSize: 12,
                                    }}
                                >
                                    {discount}% OFF
                                </Text>
                            </View>
                        </>
                    ) : (
                        Number.isFinite(priceNum) && (
                            <Text style={{ color: p.price, fontWeight: "800", fontSize: 16 }}>
                                ₦{priceNum.toLocaleString()}
                            </Text>
                        )
                    )}
                </View>
            </View>

            {/* Favorite Heart */}
            <TouchableOpacity
                style={{
                    backgroundColor: p.background,
                    borderRadius: 50,
                    padding: 10,
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 3,
                    elevation: 3,
                }}
                onPress={() => toggleFavorite(mealId)}
            >
                <Ionicons name={fav ? "heart" : "heart-outline"} size={22} color={fav ? "red" : p.text} />
            </TouchableOpacity>
        </Pressable>

    );
}

/* --------------- Dropdown --------------- */
function Dropdown({ label, placeholder, value, setValue, open, setOpen, options, p, allowClear }) {
    const selectedLabel =
        options.find((o) => eqCi(String(o.value), String(value)))?.label ??
        options.find((o) => eqCi(String(o.label), String(value)))?.label ??
        "";

    return (
        <>
            <Pressable
                onPress={() => setOpen(true)}
                android_ripple={{ color: p.ripple }}
                style={({ pressed }) => [
                    stylesStatic.ddTrigger,
                    { borderColor: p.border, backgroundColor: p.card },
                    pressed && { opacity: 0.9 },
                ]}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                    <Text style={{ color: p.sub, fontWeight: "700" }}>{label}:</Text>
                    <Text
                        numberOfLines={1}
                        style={{ color: selectedLabel ? p.text : p.sub, fontWeight: selectedLabel ? "800" : "600", flexShrink: 1 }}
                    >
                        {selectedLabel || placeholder}
                    </Text>
                </View>
                {allowClear && !!value ? (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation?.();
                            setValue(label === "Discount" ? null : "");
                        }}
                        style={{ padding: 4, marginRight: 4 }}
                    >
                        <Ionicons name="close-circle" size={18} color={p.tint} />
                    </Pressable>
                ) : null}
                <Ionicons name="chevron-down" size={18} color={p.sub} />
            </Pressable>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={stylesStatic.ddBackdrop} onPress={() => setOpen(false)}>
                    <Pressable style={[stylesStatic.ddSheet, { backgroundColor: p.background, borderColor: p.border }]} onPress={() => { }}>
                        <View style={[stylesStatic.ddHeader, { borderColor: p.border }]}>
                            <Text style={{ color: p.text, fontWeight: "800", fontSize: 16 }}>{label}</Text>
                            <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 6 }}>
                                <Ionicons name="close" size={20} color={p.sub} />
                            </TouchableOpacity>
                        </View>

                        {/* “All/Any” option */}
                        <Pressable
                            onPress={() => {
                                setValue(label === "Discount" ? null : "");
                                setOpen(false);
                            }}
                            style={({ pressed }) => [
                                stylesStatic.ddItem,
                                { borderColor: p.border },
                                pressed && { opacity: 0.8 },
                            ]}
                        >
                            <Text style={{ color: p.text, fontWeight: "700" }}>
                                {label === "Discount" ? "Any" : "All"}
                            </Text>
                        </Pressable>

                        <FlatList
                            data={options}
                            keyExtractor={(it, idx) => String(it?.value ?? it?.label ?? idx)}
                            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: p.border }} />}
                            renderItem={({ item }) => {
                                const active =
                                    eqCi(String(item.value), String(value)) || eqCi(String(item.label), String(value));
                                return (
                                    <Pressable
                                        onPress={() => {
                                            setValue(item.value);
                                            setOpen(false);
                                        }}
                                        style={({ pressed }) => [
                                            stylesStatic.ddItem,
                                            { borderColor: p.border, backgroundColor: active ? p.tint : "transparent", color: active ? '#fff' : '#000' },
                                            pressed && { opacity: 0.85 },
                                        ]}
                                    >
                                        <Text style={{ color: p.text, fontWeight: active ? "800" : "600" }}>
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                );
                            }}
                            style={{ maxHeight: 360 }}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

/* ------------- helpers & styles ------------- */
function eqCi(a, b) {
    return String(a).toLowerCase() === String(b).toLowerCase();
}
function escapeReg(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeStyles(p) {
    return StyleSheet.create({
        center: {
            flex: 1,
            padding: 24,
            alignItems: "center",
            justifyContent: "center",
        },
        errorText: { color: p.error, fontSize: 16, textAlign: "center", marginBottom: 12 },
        retryBtn: {
            backgroundColor: p.tint,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 12,
        },
        retryText: { color: "#fff", fontWeight: "700" },
        emptyText: { color: p.sub, fontSize: 16, marginBottom: 10 },
        retryGhost: {
            borderWidth: 1,
            borderColor: p.border,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: p.emptyBadge,
        },
        retryGhostText: { color: p.text, fontWeight: "700" },

        filtersRow: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: p.border,
            backgroundColor: p.background,
            flexDirection: "row",
        },
    });
}

const stylesStatic = StyleSheet.create({
    cardImg: { width: 100, height: 100, borderRadius: 12, backgroundColor: "#2a2f39", marginRight: 8 },
    cardTitle: { fontSize: 16, fontWeight: "800" },
    cardSub: { fontSize: 13, marginTop: 2, fontWeight: "600" },
    cardPrice: { fontSize: 15, fontWeight: "800" },
    iconWrapper: {
        backgroundColor: "#fff",
        borderRadius: 50,
        padding: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },

    // Dropdown styles
    ddTrigger: {
        flex: 1,
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    ddBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    ddSheet: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 12,
        borderWidth: 1,
    },
    ddHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 8,
        marginBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    ddItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 0,
        borderRadius: 20
    },
});

function cardBase(p) {
    return {
        minHeight: 120,
        backgroundColor: p.card,
        borderRadius: 16,
        padding: 12,
        gap: 10,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: p.border,
        shadowColor: p.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    };
}