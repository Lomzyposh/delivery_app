import React from "react";
import { View } from "react-native";
import { Skeleton } from "moti/skeleton";
import { useTheme } from "../contexts/ThemeContext";

export default function SkeletonList({ items = 7 }) {
    const { isDarkMode } = useTheme();
    const colorMode = isDarkMode ? "dark" : "light";
    return (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, backgroundColor: colorMode === "dark" ? "#252525" : "#fff" }}>
            {Array.from({ length: items }).map((_, i) => (
                <View
                    key={i}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 18,
                        gap: 12,
                    }}
                >
                    <Skeleton width={64} height={64} radius="round" colorMode={colorMode} />
                    <View style={{ flex: 1 }}>
                        <Skeleton width={"70%"} height={16} radius={6} colorMode={colorMode} />
                        <View style={{ height: 8 }} />
                        <Skeleton width={"45%"} height={14} radius={6} colorMode={colorMode} />
                    </View>
                </View>
            ))}
        </View>
    );
}
