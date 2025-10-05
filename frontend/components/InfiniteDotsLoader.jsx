// components/InfiniteDotsLoader.js
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export default function InfiniteDotsLoader({
  dotCount = 3,
  dotSize = 10,
  dotSpacing = 8,
  color = "#fff",
  duration = 600, // time for one dot's up+down cycle (ms)
  scaleRange = [0.4, 1], // [minScale, maxScale]
  style,
}) {
  const animatedValues = useRef(
    Array.from({ length: dotCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // create an array of animations (each animation is a sequence scale up -> down)
    const animations = animatedValues.map((av) =>
      Animated.sequence([
        Animated.timing(av, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(av, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );

    // stagger them so they animate in wave
    const staggerDelay = Math.round(duration / dotCount);
    const loopAnimation = Animated.loop(Animated.stagger(staggerDelay, animations));

    loopAnimation.start();

    return () => loopAnimation.stop();
  }, [animatedValues, duration, dotCount]);

  // map animated value (0..1) to scale using interpolate
  const minScale = scaleRange[0];
  const maxScale = scaleRange[1];

  return (
    <View style={[styles.container, style]}>
      {animatedValues.map((av, i) => {
        const scale = av.interpolate({
          inputRange: [0, 1],
          outputRange: [minScale, maxScale],
        });
        const opacity = av.interpolate({
          inputRange: [0, 1],
          outputRange: [0.45, 1],
        });
        return (
          <Animated.View
            key={i}
            style={[
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                marginHorizontal: dotSpacing / 2,
                backgroundColor: color,
                transform: [{ scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
