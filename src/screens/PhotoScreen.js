// src/screens/PhotoScreen.js
import { CommonActions } from "@react-navigation/native";
import { addDoc, collection } from "firebase/firestore";
import { useEffect, useState } from "react";
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

// CORS-safe images for web simulation (picsum allows cross-origin)
const STREET_ART_IMAGES = [
  "https://picsum.photos/seed/streetart1/600/400",
  "https://picsum.photos/seed/streetart2/600/400",
  "https://picsum.photos/seed/streetart3/600/400",
  "https://picsum.photos/seed/graffiti1/600/400",
  "https://picsum.photos/seed/urban1/600/400",
  "https://picsum.photos/seed/mural1/600/400",
];

// Load expo modules only on mobile to avoid web crashes
let ImagePicker = null;
let Location = null;

if (Platform.OS !== "web") {
  try {
    ImagePicker = require("expo-image-picker");
  } catch (e) {}
  try {
    Location = require("expo-location");
  } catch (e) {}
}

export default function PhotoScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  /**
   * Requests and retrieves the current GPS position.
   * On web, uses the browser Geolocation API.
   * On mobile, uses expo-location.
   */
  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setLocLoading(true);
    try {
      if (Platform.OS === "web") {
        // Browser Geolocation API
        if (!navigator.geolocation) {
          console.warn("[Location] Geolocation not supported on this browser.");
          setLocLoading(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            console.log(
              "[Location] ✅ Web GPS:",
              pos.coords.latitude,
              pos.coords.longitude,
            );
            setLocLoading(false);
          },
          (err) => {
            console.warn("[Location] ⚠️ Web GPS denied:", err.message);
            setLocLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      } else if (Location) {
        // expo-location on mobile
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("[Location] ⚠️ Permission denied.");
          setLocLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        console.log(
          "[Location] ✅ Mobile GPS:",
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setLocLoading(false);
      }
    } catch (err) {
      console.warn("[Location] ❌ Error:", err.message);
      setLocLoading(false);
    }
  };

  /**
   * Takes a photo using the device camera (mobile) or picks a random image (web simulation).
   */
  const takePicture = async () => {
    if (Platform.OS === "web" || !ImagePicker) {
      // Web: random CORS-safe image
      const img =
        STREET_ART_IMAGES[Math.floor(Math.random() * STREET_ART_IMAGES.length)];
      setPhoto(img);
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Camera access is required.");
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
      Alert.alert("Camera error", error.message);
    }
  };

  /**
   * Opens the gallery to pick an image (mobile only).
   */
  const pickFromGallery = async () => {
    if (!ImagePicker) return;
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Gallery access is required.");
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
      Alert.alert("Gallery error", error.message);
    }
  };

  /**
   * Saves the artwork (image URL + geolocation + author) to Firestore,
   * then navigates back to Home immediately.
   */
  const handlePublish = async () => {
    if (!photo) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    setUploading(true);

    // Navigate to Home immediately — addDoc runs in background
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }),
    );

    // Save artwork to Firestore with geolocation
    addDoc(collection(db, "artworks"), {
      imageUrl: photo,
      author: user.displayName || user.email.split("@")[0],
      authorId: user.uid,
      likes: 0,
      likedBy: [],
      // Geolocation — null if permission was denied
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      createdAt: new Date().toISOString(),
    })
      .then(() =>
        console.log(
          "[Firestore] ✅ Artwork published with location:",
          location,
        ),
      )
      .catch((err) => console.error("[Firestore] ❌", err.code, err.message));
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
          {Platform.OS === "web" ? "Simulate a photo" : "Take a photo"}
        </Text>
        <Text style={styles.subtitle}>
          {Platform.OS === "web"
            ? "Press the button to simulate taking a street art photo"
            : "Use your camera or pick from your gallery"}
        </Text>

        {/* GPS status indicator */}
        <View style={styles.gpsStatus}>
          {locLoading ? (
            <>
              <ActivityIndicator size="small" color="#f72585" />
              <Text style={styles.gpsText}> Getting location...</Text>
            </>
          ) : location ? (
            <Text style={styles.gpsTextOk}>
              📍 Location ready ({location.latitude.toFixed(3)},{" "}
              {location.longitude.toFixed(3)})
            </Text>
          ) : (
            <Text style={styles.gpsTextWarn}>
              ⚠️ Location unavailable — artwork will have no map
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.innerCaptureButton} />
        </TouchableOpacity>
        <Text style={styles.captureLabel}>
          {Platform.OS === "web" ? "Simulate" : "Camera"}
        </Text>

        {Platform.OS !== "web" && ImagePicker && (
          <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
            <Text style={styles.galleryBtnText}>🖼️ Gallery</Text>
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

      {/* Location badge on preview */}
      <View style={styles.locationBadge}>
        <Text style={styles.locationBadgeText}>
          {location
            ? `📍 ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
            : "📍 No location"}
        </Text>
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
  // ── Camera view ──
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
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },

  // GPS indicator
  gpsStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
  },
  gpsText: { color: "#aaa", fontSize: 13 },
  gpsTextOk: { color: "#4ade80", fontSize: 13, fontWeight: "600" },
  gpsTextWarn: { color: "#facc15", fontSize: 13 },

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

  // ── Preview view ──
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
  locationBadge: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationBadgeText: { color: "#fff", fontSize: 13 },
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
