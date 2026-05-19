// src/screens/SubscribeScreen.js
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../services/firebaseConfig";

export default function SubscribeScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");

  const triggerAlert = (title, message) => {
    if (Platform.OS === "web") {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubscribe = async () => {
    if (!email || !password || !pseudo) {
      triggerAlert(
        "Error",
        "Please fill in all fields (Email, Password, Pseudo).",
      );
      return;
    }
    try {
      console.log("[Firebase] Account creation started...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      console.log("[Firebase] Authentication user created:", user.uid);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        pseudo: pseudo,
        liked_artworks: [],
      });
      console.log("[Firebase] User profile saved in Firestore.");

      navigation.replace("Home");
    } catch (error) {
      console.error("[Firebase] Error:", error);
      triggerAlert("Registration Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join LocalStreetArt</Text>
      <TextInput
        style={styles.input}
        placeholder="Pseudonym"
        value={pseudo}
        onChangeText={setPseudo}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
        <Text style={styles.buttonText}>Subscribe</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Log in.</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 32,
    color: "#f72585",
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#7209b7",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  linkText: { color: "#3a0ca3", textAlign: "center", marginTop: 20 },
});
