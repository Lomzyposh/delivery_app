// Home.jsx
import React, { useEffect, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
    StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, fonts } from "../../../constants/theme";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";

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
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const styles = useMemo(() => getStyles(theme), [theme]);

    useEffect(() => {
        console.log("User data:", user);
    }, [user]);

    const categoryClick = (category) => {
        const slug = String(category).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        router.push({ pathname: "/Main/listMeals", params: { category: slug } });
    };


    const openCart = () => {
        router.push("/Main/cart");
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar
                barStyle={theme === "dark" ? "light-content" : "dark-content"}
                backgroundColor={theme.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.addressRow}>
                    <View style={styles.profileImgCont}>
                        <Image
                            source={require("../../../assets/images/burger.png")}
                            style={styles.profileImg}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.userName}>{user?.name ? user.name : "Guest"}</Text>
                </View>

                <TouchableOpacity style={{ marginRight: 12 }} onPress={toggleTheme}>
                    <Ionicons name="color-palette-outline" size={25} color={theme.tint} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.addressSubRow} onPress={openCart}>
                    <Ionicons name="bag-outline" size={25} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <Ionicons name="search" size={20} color={theme.sub} />
                <TextInput
                    placeholder="What are you craving?"
                    placeholderTextColor={theme.sub}
                    style={styles.searchInput}
                />
                <View style={styles.filterBtn}>
                    <Ionicons name="options" size={18} color="#fff" />
                </View>
            </View>

            <Text style={styles.sectionTitle}>Special Offers</Text>

            <LinearGradient
                colors={[Colors.tintColorDark, Colors.tintColorLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promoCard}
                onTouchEnd={() => router.push('/Main/specialOffers')}
            >
                <View>
                    <Text style={styles.promoBig}>30%</Text>
                    <Text style={styles.promoSmall}>DISCOUNT ONLY</Text>
                    <Text style={styles.promoTiny}>VALID FOR TODAY!</Text>
                    <TouchableOpacity style={styles.promoBtn}>
                        <Text style={styles.promoBtnText}>See All</Text>
                        <Ionicons name="arrow-forward" size={16} color={theme.tint} />
                    </TouchableOpacity>
                </View>

                <View style={styles.promoImageBubble}>
                    <Image
                        source={require("../../../assets/images/allJunks.png")}
                        style={{ width: 70, height: 70 }}
                        resizeMode="cover"
                    />
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
                    <TouchableOpacity style={styles.catItem} onPress={() => categoryClick(item.key)}>
                        <View style={styles.catCircle}>
                            <Image source={item.img} style={styles.catImg} resizeMode="contain" />
                        </View>
                        <Text style={styles.catLabel} numberOfLines={1}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
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
                                <MaterialCommunityIcons name={item.icon} size={28} color={theme.tint} />
                            </View>
                            <View>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <Text style={styles.cardMeta}>Promo • Fast Delivery</Text>
                            </View>
                        </View>
                        <View style={styles.cardRight}>
                            <Text style={styles.cardPrice}>{item.price}</Text>
                            <Ionicons name="chevron-forward" size={18} color={theme.sub} />
                        </View>
                    </View>
                ))}
            </View>

            <View style={{ height: 28 }} />
        </ScrollView>
    );
}

function getStyles(theme) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },

        profileImgCont: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.field,
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
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        addressRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
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
            color: theme.text,
        },

        searchWrap: {
            marginTop: 14,
            marginHorizontal: 16,
            backgroundColor: theme.field,
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            elevation: 2,
            shadowColor: "#000",
            shadowOpacity: themeShadowOpacity(theme),
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            borderWidth: 1,
            borderColor: theme.border,
        },
        searchInput: {
            flex: 1,
            color: theme.text,
            fontSize: 14,
        },
        filterBtn: {
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: theme.tint,
            alignItems: "center",
            justifyContent: "center",
        },

        sectionTitle: {
            marginTop: 18,
            marginHorizontal: 16,
            fontSize: 16,
            fontWeight: "700",
            color: theme.text,
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
            backgroundColor: theme.field,
            borderRadius: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        promoBtnText: { color: theme.tint, fontWeight: "700" },
        promoImageBubble: {
            width: 90,
            height: 90,
            borderRadius: 18,
            backgroundColor: theme.field,
            alignItems: "center",
            justifyContent: "center",
        },

        catItem: { alignItems: "center", marginRight: 14 },
        catCircle: {
            width: 58,
            height: 58,
            borderRadius: 18,
            backgroundColor: theme.field,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
        },
        catImg: {
            width: 46,
            height: 46,
        },
        catLabel: {
            marginTop: 6,
            fontSize: 12,
            color: theme.text,
            opacity: 0.85,
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
        discountTitle: { fontSize: 16, fontWeight: "700", color: theme.text },
        seeAll: { color: theme.tint, fontWeight: "700" },

        card: {
            marginTop: 12,
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            elevation: 1,
            shadowColor: "#000",
            shadowOpacity: themeShadowOpacity(theme),
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
            borderWidth: 1,
            borderColor: theme.border,
        },
        cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
        foodThumb: {
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: theme.field,
            alignItems: "center",
            justifyContent: "center",
        },
        cardTitle: { fontSize: 14, fontWeight: "700", color: theme.text },
        cardMeta: { color: theme.sub, fontSize: 12, marginTop: 2 },
        cardRight: { alignItems: "flex-end", gap: 2 },
        cardPrice: { fontWeight: "800", color: theme.tint },
    });
}

function themeShadowOpacity(theme) {
    return theme === Colors.dark ? 0.15 : 0.05;
}
