import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useMemo } from 'react'
import { Colors } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const CARDS = [
    { key: "30%", img: require('../../assets/images/special2.png'), colors: ["#00C851", "#007E33"] },
    { key: "15%", img: require('../../assets/images/special1.png'), colors: ["#FFB347", "#FF6F00"] },
    { key: "20%", img: require('../../assets/images/special3.png'), colors: ["#FF6F91", "#FF3D68"] },
    { key: "25%", img: require('../../assets/images/special4.png'), colors: ["#2196F3", "#1976D2"] }
]

export default function SpecialOffers() {

    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    const discountClick = (discount) => {
        router.push({ pathname: "/Main/listMeals", params: { discount: parseInt(discount) } });
    };

    const styles = useMemo(() => getStyles(theme), [theme]);
    return (
        <View style={styles.container}>
            <FlatList
                data={CARDS}
                keyExtractor={(i) => i.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                style={{ marginTop: 14 }}
                renderItem={({ item }) => (
                    <LinearGradient
                        colors={item.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.promoCard}
                        onTouchEnd={() => discountClick(item.key)}
                    >
                        <View>
                            <Text style={[styles.promoBig, { fontFamily: "Fredoka_700Bold" }]}>{item.key}</Text>
                            <Text style={styles.promoSmall}>DISCOUNT ONLY</Text>
                            <Text style={[styles.promoTiny, { fontFamily: "Orbitron_700Bold" }]}>VALID FOR TODAY!</Text>
                        </View>

                        <View style={styles.promoImageBubble}>
                            <Image
                                source={item.img}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="contain"
                            />
                        </View>
                        {/* <Ionicons style={} name="arrow-forward" size={24} color="#fff" /> */}
                        <Ionicons style={styles.arrow} name="chevron-forward" size={24} color="#fff" />
                    </LinearGradient>
                )}
            />
        </View>
    )
}


function getStyles(theme) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        arrow: { position: 'absolute', bottom: 25, left: 30 },
        promoCard: {
            marginTop: 10,
            borderRadius: 22,
            padding: 16,
            height: 180,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        promoBig: { fontSize: 50, color: "#fff", lineHeight: 42 },
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
        // promoBtnText: { color: theme.tint, fontWeight: "700" },
        promoImageBubble: {
            width: '60%',
            height: "100%",
            borderRadius: 18,
            backgroundColor: "transparent",
            alignItems: "center",
            justifyContent: "center",
        },
    })
}