// app/(tabs)/listMeals.jsx
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import axios from "axios";
import SkeletonList from "../../components/Skeleton";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "../../constants/theme";
import { usePalette } from "../../utils/palette";

const API_URL = "http://192.168.82.224:5000";



export default function ListMeals() {
    const { category } = useLocalSearchParams();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const p = usePalette(theme);

    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const categoryTitle = useMemo(() => {
        const slug = String(category || "").trim();
        if (!slug) return "Meals";
        return slug
            .split(/[-_ ]+/)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ");
    }, [category]);

    useLayoutEffect(() => {
        navigation.setOptions({ title: categoryTitle || "Meals" });
    }, [navigation, categoryTitle]);

    const fetchMeals = async () => {
        try {
            setError("");
            if (!refreshing) setLoading(true);
            const url = category
                ? `${API_URL}/api/meals?category=${encodeURIComponent(String(category))}`
                : `${API_URL}/api/meals`;

            console.log("GET URL =>", url);
            const res = await axios.get(url, { timeout: 12000 });
            const data = res?.data || {};
            const list = Array.isArray(data.meals) ? data.meals : Array.isArray(data) ? data : [];
            setMeals(list);
        } catch (err) {
            setError(
                err?.response?.data?.message || err?.message || "Failed to load meals. Please try again."
            );
            setMeals([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMeals();
    }, [category]);

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

    if (!meals.length) {
        return (
            <View style={[styles.center, { backgroundColor: p.background }]}>
                <Text style={styles.emptyText}>
                    No meals found{categoryTitle ? ` for "${categoryTitle}"` : ""}.
                </Text>
                <Pressable
                    onPress={fetchMeals}
                    style={styles.retryGhost}
                    android_ripple={{ color: p.ripple }}
                >
                    <Text style={styles.retryGhostText}>Refresh</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <FlatList
                data={meals}
                keyExtractor={(item, idx) => String(item?._id || item?.id || idx)}
                contentContainerStyle={{ padding: 16 }}
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
            />
        </View>
    );
}

function MealCard({ meal, p }) {
    const img = meal?.image || meal?.img || meal?.photo;
    const title = meal?.name || meal?.title || "Meal";
    const price = meal?.price ?? meal?.amount;
    const restaurantName = meal?.restaurantId?.name || meal?.restaurantName;

    return (
        <Pressable
            style={({ pressed }) => [
                cardBase(p),
                pressed && { transform: [{ scale: 0.996 }], opacity: 0.98 },
            ]}
            android_ripple={{ color: p.ripple }}
            onPress={() => {
                // TODO: navigate to details if you have a screen e.g. router.push(`/meal/${meal._id}`)
            }}
        >
            <Image
                source={img ? { uri: img } : require("../../assets/images/placeholder.jpg")}
                style={stylesStatic.cardImg}
                resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
                <Text style={[stylesStatic.cardTitle, { color: p.text }]} numberOfLines={1}>
                    {title}
                </Text>
                {!!restaurantName && (
                    <Text style={[stylesStatic.cardSub, { color: p.sub }]} numberOfLines={1}>
                        {restaurantName}
                    </Text>
                )}
                {!!(price || price === 0) && (
                    <Text style={[stylesStatic.cardPrice, { color: p.price }]}>
                        ₦{Number(price).toLocaleString()}
                    </Text>
                )}
            </View>
        </Pressable>
    );
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
    });
}

// Static bits that don't need palette in the StyleSheet object (faster render)
const stylesStatic = StyleSheet.create({
    cardImg: { width: 84, height: 84, borderRadius: 12, backgroundColor: "#2a2f39", marginRight: 8 },
    cardTitle: { fontSize: 16, fontWeight: "800" },
    cardSub: { fontSize: 13, marginTop: 2, fontWeight: "600" },
    cardPrice: { marginTop: 6, fontSize: 15, fontWeight: "800" },
});

// Card styles depend on palette (shadow, background, border)
function cardBase(p) {
    return {
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
