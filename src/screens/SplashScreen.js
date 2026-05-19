// src/screens/SplashScreen.js
import { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function SplashScreen({ navigation }) {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.content, { opacity, transform: [{ scale }] }]}
      >
        <Text style={styles.emoji}>🎨</Text>
        <Text style={styles.title}>LocalStreetArt</Text>
        <Text style={styles.subtitle}>Discover urban art around you</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3a0ca3",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { alignItems: "center" },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },
});
