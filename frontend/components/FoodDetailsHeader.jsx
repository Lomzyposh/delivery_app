// FoodDetailHeader.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../contexts/FavouriteContext";
import { useAuth } from "../contexts/AuthContext";

export default function FoodDetailHeader({ foodId }) {
    const navigation = useNavigation();
    // const {userId} = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const fav = isFavorite(foodId);

    return (
        <View style={styles.headerContainer}>
            {/* Back Arrow */}
            <TouchableOpacity
                style={styles.iconWrapper}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
            >
                <Ionicons name="arrow-back" size={22} color="#333" />
            </TouchableOpacity>


            {/* Help Icon */}
            <View>
                <TouchableOpacity style={styles.iconWrapper} onPress={() => toggleFavorite(foodId)}>
                    <Ionicons name={fav ? "heart" : "heart-outline"} size={22} color={fav ? "red" : "#333"} />
                </TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        position: 'absolute',
        width: '100%',
        top: 20
    },
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
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
});
