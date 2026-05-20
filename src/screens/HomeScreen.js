// src/screens/HomeScreen.js
import { signOut } from "firebase/auth";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../services/firebaseConfig";

export default function HomeScreen({ navigation }) {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "likes" | "mine"

  const currentUser = auth.currentUser;

  /**
   * Subscribe to real-time Firestore updates for artworks collection.
   */
  useEffect(() => {
    const q = query(collection(db, "artworks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setArtworks(data);
        setLoading(false);
        console.log("[Firestore] ✅ Artworks loaded:", data.length);
      },
      (error) => {
        console.error("[Firestore] ❌ Error:", error.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  /**
   * Toggles like on an artwork for the current user.
   * @param {Object} artwork - The artwork document
   */
  const handleLike = async (artwork) => {
    const likedBy = artwork.likedBy || [];
    const alreadyLiked = likedBy.includes(currentUser.uid);
    try {
      const ref = doc(db, "artworks", artwork.id);
      await updateDoc(ref, {
        likes: alreadyLiked
          ? (artwork.likes || 1) - 1
          : (artwork.likes || 0) + 1,
        likedBy: alreadyLiked
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid),
      });
    } catch (e) {
      console.error("[Like] Error:", e.message);
    }
  };

  /**
   * Opens the artwork location in Google Maps.
   * @param {Object} artwork - The artwork document with latitude/longitude
   */
  const handleOpenMap = (artwork) => {
    if (!artwork.latitude || !artwork.longitude) {
      Alert.alert("No location", "This artwork has no geolocation data.");
      return;
    }
    const { latitude, longitude, author } = artwork;
    const label = encodeURIComponent(`Street Art by ${author}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps?q=${latitude},${longitude}`,
    });
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Unable to open maps."),
    );
  };

  /**
   * Signs out the current user.
   */
  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => signOut(auth) },
    ]);
  };

  // Filter artworks based on active tab
  const displayedArtworks = (() => {
    if (activeTab === "likes")
      return artworks.filter((a) =>
        (a.likedBy || []).includes(currentUser.uid),
      );
    if (activeTab === "mine")
      return artworks.filter((a) => a.authorId === currentUser.uid);
    return artworks;
  })();

  /**
   * Renders a single artwork card.
   */
  const renderArtwork = ({ item }) => {
    const liked = (item.likedBy || []).includes(currentUser.uid);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOpenMap(item)}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

        {/* Geolocation badge */}
        {item.latitude && item.longitude ? (
          <View style={styles.geoBadge}>
            <Text style={styles.geoBadgeText}>📍 View on map</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardAuthor}>@{item.author}</Text>
            <Text style={styles.cardDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.latitude && item.longitude && (
              <Text style={styles.cardCoords}>
                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.likeBtn, liked && styles.likeBtnActive]}
            onPress={() => handleLike(item)}
          >
            <Text style={styles.likeBtnText}>
              {liked ? "❤️" : "🤍"} {item.likes || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const emptyMessages = {
    all: { emoji: "🎨", text: "No artworks yet. Be the first!" },
    likes: { emoji: "🤍", text: "No liked artworks yet." },
    mine: { emoji: "📷", text: "You haven't posted any artwork yet." },
  };

  return (
    <View style={styles.container}>
      {/* ── Header / Tab bar ── */}
      <View style={styles.header}>
        {[
          { key: "all", label: "All Arts" },
          { key: "likes", label: "My Likes" },
          { key: "mine", label: "My Photos" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3a0ca3" />
        </View>
      ) : displayedArtworks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>
            {emptyMessages[activeTab].emoji}
          </Text>
          <Text style={styles.emptyText}>{emptyMessages[activeTab].text}</Text>
        </View>
      ) : (
        <FlatList
          data={displayedArtworks}
          keyExtractor={(item) => item.id}
          renderItem={renderArtwork}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── FAB: Add artwork ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Photo")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  // Tab bar
  header: {
    flexDirection: "row",
    backgroundColor: "#3a0ca3",
    paddingTop: 50,
    alignItems: "flex-end",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#f72585" },
  tabText: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#ffffff" },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    justifyContent: "center",
  },
  logoutText: { color: "rgba(255,255,255,0.7)", fontSize: 20 },

  // States
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  list: { padding: 16, gap: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardImage: { width: "100%", height: 220, backgroundColor: "#eee" },
  geoBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  geoBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  cardInfo: { flex: 1 },
  cardAuthor: { fontSize: 15, fontWeight: "700", color: "#3a0ca3" },
  cardDate: { fontSize: 12, color: "#aaa", marginTop: 2 },
  cardCoords: { fontSize: 11, color: "#bbb", marginTop: 2 },

  // Like button
  likeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  likeBtnActive: { backgroundColor: "#ffe0ec" },
  likeBtnText: { fontSize: 14, fontWeight: "600" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#f72585",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f72585",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36 },
});
