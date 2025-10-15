import React from "react";
import { View } from "react-native";
import { Skeleton } from "moti/skeleton";

export default function SkeletonList({ items = 6 }) {
    return (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
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
                    <Skeleton width={64} height={64} radius="round" />
                    <View style={{ flex: 1 }}>
                        <Skeleton width={"70%"} height={16} radius={6} />
                        <View style={{ height: 8 }} />
                        <Skeleton width={"45%"} height={14} radius={6} />
                    </View>
                </View>
            ))}
        </View>
    );
}
