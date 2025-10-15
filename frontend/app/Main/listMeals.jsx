// app/(tabs)/listMeals.jsx  (if this is your actual path, push to "/listMeals")
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import axios from "axios";
import SkeletonList from "../../components/Skeleton";


const API_URL = "http://192.168.121.224:5000";

export default function ListMeals() {
    const { category } = useLocalSearchParams();
    const navigation = useNavigation();

    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const categoryTitle = useMemo(() => {
        const slug = String(category || "").trim();
        if (!slug) return "Meals";
        return slug.split(/[-_ ]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    }, [category]);

    useLayoutEffect(() => {
        navigation.setOptions({ title: categoryTitle || "Meals" });
    }, [navigation, categoryTitle]);

    const fetchMeals = async () => {
        try {
            setLoading(true);
            setError("");
            const url = category
                ? `${API_URL}/api/meals?category=${encodeURIComponent(String(category))}`
                : `${API_URL}/api/meals`;

            console.log("GET URL =>", url);
            const res = await axios.get(url, { timeout: 12000 });
            const data = res?.data || {};
            const list = Array.isArray(data.meals) ? data.meals : Array.isArray(data) ? data : [];
            setMeals(list);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load meals. Please try again.");
            setMeals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeals();
    }, [category]);

    if (loading) return <SkeletonList items={8} />;

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={fetchMeals} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    if (!meals.length) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>No meals found{categoryTitle ? ` for "${categoryTitle}"` : ""}.</Text>
                <Pressable onPress={fetchMeals} style={styles.retryGhost}>
                    <Text style={styles.retryGhostText}>Refresh</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <FlatList
                data={meals}
                keyExtractor={(item, idx) => String(item?._id || item?.id || idx)}
                contentContainerStyle={{ padding: 16 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => <MealCard meal={item} />}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

function MealCard({ meal }) {
    const img = meal?.image || meal?.img || meal?.photo;
    const title = meal?.name || meal?.title || "Meal";
    const price = meal?.price ?? meal?.amount;

    const restaurantName = meal?.restaurantId?.name || meal?.restaurantName;

    return (
        <Pressable style={styles.card} android_ripple={{ color: "rgba(0,0,0,0.06)" }}>
            <Image
                source={img ? { uri: img } : require("../../assets/images/placeholder.jpg")}
                style={styles.cardImg}
                resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
                {!!restaurantName && (
                    <Text style={styles.cardSub} numberOfLines={1}>{restaurantName}</Text>
                )}
                {!!(price || price === 0) && (
                    <Text style={styles.cardPrice}>₦{Number(price).toLocaleString()}</Text>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    errorText: { color: "#b91c1c", fontSize: 16, textAlign: "center", marginBottom: 12 },
    retryBtn: { backgroundColor: "#111827", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: "#fff", fontWeight: "600" },
    emptyText: { color: "#6b7280", fontSize: 16, marginBottom: 10 },
    retryGhost: { borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    retryGhostText: { color: "#111827", fontWeight: "600" },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 12,
        gap: 10,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardImg: { width: 84, height: 84, borderRadius: 12, backgroundColor: "#f3f4f6", marginRight: 8 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
    cardSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
    cardPrice: { marginTop: 6, fontSize: 15, fontWeight: "700", color: "#0f766e" },
});
