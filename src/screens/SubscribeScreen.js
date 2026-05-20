// src/screens/SubscribeScreen.js
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";
import { auth, db } from "../services/firebaseConfig";

export default function SubscribeScreen({ navigation }) {
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Shows a cross-platform alert.
   */
  const showAlert = (title, message) => {
    if (Platform.OS === "web") alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  /**
   * Validates all registration form fields.
   * @returns {boolean} true if all fields are valid
   */
  const validate = () => {
    const newErrors = {};
    if (!pseudo.trim()) newErrors.pseudo = "Pseudonym is required.";
    else if (pseudo.trim().length < 3)
      newErrors.pseudo = "Pseudonym must be at least 3 characters.";
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Invalid email address.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    if (!confirm) newErrors.confirm = "Please confirm your password.";
    else if (confirm !== password)
      newErrors.confirm = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles account creation with Firebase Authentication and Firestore.
   */
  const handleSubscribe = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      console.log("[Firebase] Creating account...");
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      // Save display name in Firebase Auth
      await updateProfile(user, { displayName: pseudo.trim() });

      // Save user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        pseudo: pseudo.trim(),
        liked_artworks: [],
        createdAt: new Date().toISOString(),
      });

      console.log("[Firebase] ✅ Account created:", user.uid);
      navigation.replace("Home");
    } catch (error) {
      console.error("[Firebase] ❌ Error:", error.code);
      const messages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password is too weak.",
      };
      showAlert("Registration Failed", messages[error.code] || error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: null }));

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Join LocalStreetArt</Text>

      {/* Pseudonym */}
      <TextInput
        style={[styles.input, errors.pseudo && styles.inputError]}
        placeholder="Pseudonym"
        placeholderTextColor="#aaa"
        value={pseudo}
        onChangeText={(v) => {
          setPseudo(v);
          clearError("pseudo");
        }}
      />
      {errors.pseudo && <Text style={styles.errorText}>{errors.pseudo}</Text>}

      {/* Email */}
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          clearError("email");
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      {/* Password */}
      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          clearError("password");
        }}
        secureTextEntry
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      {/* Confirm password */}
      <TextInput
        style={[styles.input, errors.confirm && styles.inputError]}
        placeholder="Confirm Password"
        placeholderTextColor="#aaa"
        value={confirm}
        onChangeText={(v) => {
          setConfirm(v);
          clearError("confirm");
        }}
        secureTextEntry
      />
      {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubscribe}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Subscribe</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Log in.</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
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
    marginBottom: 4,
    fontSize: 15,
    color: "#222",
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#f72585" },
  errorText: {
    color: "#f72585",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#7209b7",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  linkText: { color: "#3a0ca3", textAlign: "center", marginTop: 16 },
});
