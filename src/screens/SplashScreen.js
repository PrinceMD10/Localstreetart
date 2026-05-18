// src/screens/SplashScreen.js
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // Simulate loading time, then navigate to Login
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>LocalStreetArt</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3a0ca3", // Deep Blue
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 40,
    color: "#f72585", // Primary Pink
    fontWeight: "bold",
  },
});
