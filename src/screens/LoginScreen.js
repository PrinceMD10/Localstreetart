// src/screens/LoginScreen.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth } from "../services/firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // Firebase Auth
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        navigation.replace("Home");
      })
      .catch((error) => {
        Alert.alert("Login Failed", error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Subscribe")}>
        <Text style={styles.linkText}>
          Don't have an account? Subscribe here.
        </Text>
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
    color: "#7209b7",
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
    fontFamily: "Quicksand",
  },
  button: {
    backgroundColor: "#f72585",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  linkText: { color: "#3a0ca3", textAlign: "center", marginTop: 20 },
});
