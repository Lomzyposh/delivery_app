// app/Onboarding.jsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { usePalette } from "../utils/palette";
import { Colors, fonts } from "../constants/theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    key: "order",
    title: "Order for Food",
    desc: "Pick from your favorite restaurants and add to cart in seconds.",
    image: require("../assets/images/splash/food.png"),
  },
  {
    key: "pay",
    title: "Easy Payment",
    desc: "Pay securely with cards or wallet—fast, safe, and seamless.",
    image: require("../assets/images/splash/worker.png"),
  },
  {
    key: "deliver",
    title: "Fast Delivery",
    desc: "Riders get your meal to you hot and fresh, right on time.",
    image: require("../assets/images/splash/drive.png"),
  },
];

export default function Onboarding() {
  const router = useRouter();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const { theme } = useTheme();
  const palette = usePalette(theme);

  const styles = useMemo(() => makeStyles(palette, theme), [palette, theme]);

  const goLogin = () => router.push("/Auth/Login");

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      goLogin();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* tinted header cap like the mockup; color from palette.tint */}
      <View style={[styles.headerBg, { backgroundColor: palette.tint }]} />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        // scrollEnabled={false}
        showsHorizontalScrollIndicator={true}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={styles.illustration}>
              <Image
                source={item.image}
                style={styles.image}
                contentFit="contain"
                transition={300}
              />
            </View>

            <Text style={[styles.title, { color: palette.tint }]}>{item.title}</Text>
            <Text style={[styles.desc, { color: palette.sub }]}>{item.desc}</Text>

            <View style={styles.dots}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: palette.border },
                    i === index && { width: 22, backgroundColor: palette.tint },
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={next}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: palette.tint, shadowColor: palette.tint },
                pressed && { transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={styles.primaryLabel}>
                {index === SLIDES.length - 1 ? "Get Started" : "Next"}
              </Text>
            </Pressable>

            {index < SLIDES.length - 1 && (
              <Pressable onPress={() => router.replace('/Main/(tabs)/home')} style={styles.skip}>
                <Text style={[styles.skipText, { color: palette.sub }]}>Skip</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(palette, theme) {
  return StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 20 },
    headerBg: {
      ...StyleSheet.absoluteFillObject,
      height: 280,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    page: {
      width,
      paddingHorizontal: 14,
      paddingTop: 32,
      alignItems: "center",
    },
    illustration: {
      width: "100%",
      height: 280,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      backgroundColor: palette.card,
      borderRadius: 24,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    image: { width: "100%", height: "92%" },
    title: {
      marginTop: 28,
      fontSize: 30,
      textAlign: "center",
      fontFamily: fonts.fredoka,
    },
    desc: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      paddingHorizontal: 8,
      fontFamily: fonts.interRegular,
    },
    dots: {
      marginTop: 18,
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    primaryBtn: {
      marginTop: 122,
      width: "100%",
      paddingVertical: 16,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 12,
    },
    primaryLabel: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      fontFamily: fonts.interSemi,
    },
    skip: { marginTop: 12, padding: 8 },
    skipText: { fontWeight: "600", fontFamily: fonts.interRegular },
  });
}