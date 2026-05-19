// src/screens/PhotoScreen.js
import { CommonActions } from "@react-navigation/native";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../services/firebaseConfig";

// ✅ Images CORS-safe — picsum n'est pas bloqué par Firefox sur localhost
const STREET_ART_IMAGES = [
  "https://picsum.photos/seed/streetart1/600/400",
  "https://picsum.photos/seed/streetart2/600/400",
  "https://picsum.photos/seed/streetart3/600/400",
  "https://picsum.photos/seed/graffiti1/600/400",
  "https://picsum.photos/seed/urban1/600/400",
  "https://picsum.photos/seed/mural1/600/400",
];

// expo-image-picker uniquement sur mobile
let ImagePicker = null;
if (Platform.OS !== "web") {
  try {
    ImagePicker = require("expo-image-picker");
  } catch (e) {
    console.log("[Camera] expo-image-picker non disponible");
  }
}

export default function PhotoScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ── Prendre une photo ─────────────────────────────────────────
  const takePicture = async () => {
    if (Platform.OS === "web" || !ImagePicker) {
      const img =
        STREET_ART_IMAGES[Math.floor(Math.random() * STREET_ART_IMAGES.length)];
      setPhoto(img);
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "L'accès à la caméra est nécessaire.",
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur caméra", error.message);
    }
  };

  const pickFromGallery = async () => {
    if (!ImagePicker) return;
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "L'accès à la galerie est nécessaire.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur galerie", error.message);
    }
  };

  // ── Publier ───────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!photo) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté.");
      return;
    }

    setUploading(true);

    // ✅ FIX DÉFINITIF :
    // On navigue IMMÉDIATEMENT vers Home sans attendre addDoc.
    // addDoc continue en arrière-plan — Firestore le termine et
    // onSnapshot dans HomeScreen reçoit la mise à jour automatiquement.
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: "Home" }],
      }),
    );

    // addDoc en arrière-plan
    addDoc(collection(db, "artworks"), {
      imageUrl: photo,
      author: user.displayName || user.email.split("@")[0],
      authorId: user.uid,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
    })
      .then(() => {
        console.log("[Firestore] ✅ Published!");
      })
      .catch((error) => {
        console.error("[Firestore] ❌", error.code, error.message);
      });
  };

  // ── Camera View ───────────────────────────────────────────────
  if (!photo) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.emoji}>📷</Text>
        <Text style={styles.title}>
          {Platform.OS === "web" ? "Simuler une photo" : "Prendre une photo"}
        </Text>
        <Text style={styles.subtitle}>
          {Platform.OS === "web"
            ? "Appuie sur le bouton pour simuler une prise de vue"
            : "Utilise la caméra ou choisis depuis la galerie"}
        </Text>

        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.innerCaptureButton} />
        </TouchableOpacity>
        <Text style={styles.captureLabel}>
          {Platform.OS === "web" ? "Simuler" : "Caméra"}
        </Text>

        {Platform.OS !== "web" && ImagePicker && (
          <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
            <Text style={styles.galleryBtnText}>🖼️ Galerie</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Preview View ──────────────────────────────────────────────
  return (
    <View style={styles.previewWrapper}>
      <Image
        source={{ uri: photo }}
        style={styles.preview}
        resizeMode="cover"
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setPhoto(null)} disabled={uploading}>
          <Text style={styles.backBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.previewTitle}>Photo Preview 🎨</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.btn, styles.retakeBtn]}
          onPress={() => setPhoto(null)}
          disabled={uploading}
        >
          <Text style={styles.btnText}>🔄 Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.publishBtn, uploading && styles.disabled]}
          onPress={handlePublish}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>🚀 Publish</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Camera View ──
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  closeBtn: { position: "absolute", top: 50, left: 20, padding: 10 },
  closeBtnText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#6c757d",
    fontSize: 14,
    marginBottom: 48,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  innerCaptureButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#f72585",
  },
  captureLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginBottom: 32,
  },
  galleryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  galleryBtnText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Preview View ──
  previewWrapper: { flex: 1, backgroundColor: "#000" },
  preview: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backBtn: { color: "white", fontSize: 22, fontWeight: "bold" },
  previewTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  actionButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  btn: {
    padding: 16,
    borderRadius: 30,
    width: "45%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  disabled: { opacity: 0.6 },
  retakeBtn: { backgroundColor: "#3a0ca3" },
  publishBtn: { backgroundColor: "#f72585" },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
