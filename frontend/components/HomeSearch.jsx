import { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HomeSearch({ theme, styles }) {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSearch = () => {
        if (!query.trim()) return;
        router.push({
            pathname: "/Main/listMeals",
            params: { q: query.trim() },
        });
    };

    return (
        <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={theme.sub} />
            <TextInput
                placeholder="What are you craving?"
                placeholderTextColor={theme.sub}
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.filterBtn} onPress={handleSearch}>
                <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}
