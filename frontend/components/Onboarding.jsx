import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from "react-native";
// If you use Expo Router, uncomment:
// import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const router = useRouter();
const SLIDES = [
  {
    id: "1",
    title: "Fast Delivery",
    subtitle: "Get hot meals at your door in minutes.",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Everything You Crave",
    subtitle: "Burgers, pizza, suya, small chops & more.",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Safe & Seamless",
    subtitle: "Easy payments, reliable riders, real-time updates.",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function OnboardingScreen({
  buttonPosition = "bottom", // "bottom" | "top"
  intervalMs = 3000,
  indicatorStyle = "dot", // "dot" | "dash"
  onGetStarted,
}) {
  // const router = useRouter();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const max = SLIDES.length;

  // Auto-scroll
  useEffect(() => {
    const id = setInterval(() => {
      const next = (index + 1) % max;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }, intervalMs);
    return () => clearInterval(id);
  }, [index, max, intervalMs]);

  // Sync index on manual swipe
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      const i = viewableItems[0].index ?? 0;
      if (i !== index) setIndex(i);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  const goNext = () => {
    const next = Math.min(index + 1, max - 1);
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const handleGetStarted = () => {
    if (onGetStarted) return onGetStarted();
    
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {buttonPosition === "top" && <HeaderCTA onPress={handleGetStarted} />}

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Slide item={item} />}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        <Indicators
          length={max}
          activeIndex={index}
          styleType={indicatorStyle}
          onDotPress={(i) => {
            listRef.current?.scrollToIndex({ index: i, animated: true });
            setIndex(i);
          }}
        />

        {buttonPosition === "bottom" && (
          <FooterCTA
            onGetStarted={handleGetStarted}
            onNext={goNext}
            isLast={index === max - 1}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Slide({ item }) {
  return (
    <View style={{ width }}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );
}

function Indicators({ length, activeIndex, styleType, onDotPress }) {
  return (
    <View style={styles.indicators}>
      {Array.from({ length }).map((_, i) => {
        const active = i === activeIndex;
        const common = [
          styles.indicatorBase,
          active ? styles.indicatorActive : styles.indicatorInactive,
        ];
        const style =
          styleType === "dash" ? styles.indicatorDash : styles.indicatorDot;
        return (
          <TouchableOpacity key={i} onPress={() => onDotPress(i)} activeOpacity={0.8}>
            <View style={[...common, style]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HeaderCTA({ onPress }) {
  return (
    <View style={styles.headerCta}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

function FooterCTA({ onGetStarted, onNext, isLast }) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity
        onPress={isLast ? onGetStarted : onNext}
        activeOpacity={0.9}
        style={styles.primaryBtn}
      >
        <Text style={styles.primaryBtnText}>
          {isLast ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onGetStarted} activeOpacity={0.8} style={styles.linkBtn}>
        <Text style={styles.linkText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f1115" },
  container: { flex: 1 },
  image: {
    width,
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  textWrap: {
    position: "absolute",
    bottom: 160,
    paddingHorizontal: 24,
    width: "100%",
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    marginTop: 8,
    lineHeight: 22,
  },
  indicators: {
    position: "absolute",
    bottom: 120,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicatorBase: {
    marginHorizontal: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  indicatorDash: {
    width: 22,
    height: 6,
    borderRadius: 6,
  },
  indicatorActive: {
    backgroundColor: "#ffffff",
  },
  indicatorInactive: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  headerCta: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  primaryBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    minWidth: 160,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#0f1115",
    fontWeight: "700",
    fontSize: 16,
  },
  linkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  linkText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
