// Home.jsx
import React from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, fonts } from "../../../constants/theme";
import { useRouter } from "expo-router";

const CATEGORIES = [
    { key: "Snacks", label: "Snacks", img: require("../../../assets/images/icons/fastfood.png") },
    { key: "Beef", label: "Beef", img: require("../../../assets/images/icons/protein.png") },
    { key: "turkey", label: "Turkey", img: require("../../../assets/images/icons/chicken2.png") },
    { key: "chicken", label: "Chicken", img: require("../../../assets/images/icons/chicken1.png") },
    { key: "Dessert", label: "Dessert", img: require("../../../assets/images/icons/gelato.png") },
];

const SPECIALS = [
    { id: "1", name: "Cheese Burger", price: "$8.50", icon: "hamburger" },
    { id: "2", name: "Pepperoni Slice", price: "$4.00", icon: "pizza" },
    { id: "3", name: "Chicken Pack", price: "$12.00", icon: "food-drumstick" },
];

export default function Home() {
    const router = useRouter();

    // home
    const categoryClick = (category) => {
        console.log("Category clicked:", category);
        router.push({ pathname: "/Main/listMeals", params: { category: String(category) } });
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.addressRow}>
                    <View style={styles.profileImgCont}>
                        <Image source={require("../../../assets/images/icons/fastfood.png")} style={styles.profileImg} resizeMode="contain" />
                    </View>
                    <Text style={styles.userName}>lomzyposh</Text>
                </View>
                <View style={styles.addressSubRow}>
                    <Ionicons name="bag" size={20} color="#111827" />
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                    placeholder="What are you craving?"
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                />
                <View style={styles.filterBtn}>
                    <Ionicons name="options" size={18} color="#fff" />
                </View>
            </View>

            <Text style={styles.sectionTitle}>Special Offers</Text>

            {/* Promo Card */}
            <LinearGradient
                colors={[Colors.tintColorDark, Colors.tintColorLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promoCard}
            >
                <View>
                    <Text style={styles.promoBig}>30%</Text>
                    <Text style={styles.promoSmall}>DISCOUNT ONLY</Text>
                    <Text style={styles.promoTiny}>VALID FOR TODAY!</Text>
                    <TouchableOpacity style={styles.promoBtn}>
                        <Text style={styles.promoBtnText}>See All</Text>
                        <Ionicons name="arrow-forward" size={16} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.promoImageBubble}>
                    <MaterialCommunityIcons name="hamburger" size={42} color={Colors.tintColorLight} />
                </View>
            </LinearGradient>

            <FlatList
                horizontal
                data={CATEGORIES}
                keyExtractor={(i) => i.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                style={{ marginTop: 14 }}
                renderItem={({ item }) => (
                    <View style={styles.catItem} onTouchEnd={() => categoryClick(item.key)}>
                        <View style={styles.catCircle}>
                            <Image source={item.img} style={styles.catImg} resizeMode="contain" />
                        </View>
                        <Text style={styles.catLabel} numberOfLines={1}>{item.label}</Text>
                    </View>
                )}
            />


            <View style={styles.discountWrap}>
                <Text style={styles.discountTitle}>Discount Guaranteed!</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                {SPECIALS.map((item) => (
                    <View style={styles.card} key={item.id}>
                        <View style={styles.cardLeft}>
                            <View style={styles.foodThumb}>
                                <MaterialCommunityIcons
                                    name={item.icon}
                                    size={28}
                                    color={Colors.tintColorDark}
                                />
                            </View>
                            <View>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <Text style={styles.cardMeta}>Promo • Fast Delivery</Text>
                            </View>
                        </View>
                        <View style={styles.cardRight}>
                            <Text style={styles.cardPrice}>{item.price}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                        </View>
                    </View>
                ))}
            </View>

            <View style={{ height: 28 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FEFA" },

    profileImgCont: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#E9FFF2",
        alignItems: "center",
        justifyContent: "center",
    },
    profileImg: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },

    header: {
        padding: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    addressTitle: {
        color: Colors.tintColorLight,
        fontSize: 12,
        fontWeight: "600",
    },
    addressSubRow: {
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    userName: {
        fontSize: 18,
        fontFamily: fonts.dpRegular,
        color: "#111827",
    },

    searchWrap: {
        marginTop: 14,
        marginHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    searchInput: {
        flex: 1,
        color: "#111827",
        fontSize: 14,
    },
    filterBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: Colors.tintColorLight,
        alignItems: "center",
        justifyContent: "center",
    },

    sectionTitle: {
        marginTop: 18,
        marginHorizontal: 16,
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },

    promoCard: {
        marginTop: 10,
        marginHorizontal: 16,
        borderRadius: 22,
        padding: 16,
        minHeight: 120,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    promoBig: { fontSize: 40, fontWeight: "800", color: "#fff", lineHeight: 42 },
    promoSmall: { color: "#E7FFF3", fontWeight: "700", marginTop: 2 },
    promoTiny: { color: "#E7FFF3", fontSize: 12, opacity: 0.9, marginTop: 2 },
    promoBtn: {
        marginTop: 10,
        backgroundColor: "#E9FFF2",
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    promoBtnText: { color: Colors.tintColorDark, fontWeight: "700" },
    promoImageBubble: {
        width: 84,
        height: 84,
        borderRadius: 18,
        backgroundColor: "#E9FFF2",
        alignItems: "center",
        justifyContent: "center",
    },
    catItem: { alignItems: "center", marginRight: 14 },
    catCircle: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: "#E9FFF2",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",         // keeps image rounded
    },
    catImg: {
        width: 46,
        height: 46,
    },
    catLabel: {
        marginTop: 6,
        fontSize: 12,
        color: "#374151",
        width: 64,
        textAlign: "center",
    },

    discountWrap: {
        marginTop: 18,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    discountTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
    seeAll: { color: Colors.tintColorDark, fontWeight: "700" },

    card: {
        marginTop: 12,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    foodThumb: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#E9FFF2",
        alignItems: "center",
        justifyContent: "center",
    },
    cardTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
    cardMeta: { color: "#6B7280", fontSize: 12, marginTop: 2 },
    cardRight: { alignItems: "flex-end", gap: 2 },
    cardPrice: { fontWeight: "800", color: Colors.tintColorLight },
});
