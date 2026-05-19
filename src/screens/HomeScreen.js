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
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../services/firebaseConfig";

export default function HomeScreen({ navigation }) {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const currentUser = auth.currentUser;

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

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => signOut(auth) },
    ]);
  };

  const displayedArtworks =
    activeTab === "likes"
      ? artworks.filter((a) => (a.likedBy || []).includes(currentUser.uid))
      : artworks;

  const renderArtwork = ({ item }) => {
    const liked = (item.likedBy || []).includes(currentUser.uid);
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardAuthor}>@{item.author}</Text>
            <Text style={styles.cardDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.tabTextActive,
            ]}
          >
            All Arts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "likes" && styles.tabActive]}
          onPress={() => setActiveTab("likes")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "likes" && styles.tabTextActive,
            ]}
          >
            My Likes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>↩</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3a0ca3" />
        </View>
      ) : displayedArtworks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>
            {activeTab === "likes" ? "🤍" : "🎨"}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === "likes"
              ? "No liked artworks yet"
              : "No artworks yet. Be the first!"}
          </Text>
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
  header: {
    flexDirection: "row",
    backgroundColor: "#3a0ca3",
    paddingTop: 50,
    paddingBottom: 0,
    alignItems: "flex-end",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#f72585" },
  tabText: { color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: "600" },
  tabTextActive: { color: "#ffffff" },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    justifyContent: "center",
  },
  logoutText: { color: "rgba(255,255,255,0.7)", fontSize: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#888", fontSize: 16, textAlign: "center" },
  list: { padding: 16, gap: 16 },
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
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  cardAuthor: { fontSize: 15, fontWeight: "700", color: "#3a0ca3" },
  cardDate: { fontSize: 12, color: "#aaa", marginTop: 2 },
  likeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  likeBtnActive: { backgroundColor: "#ffe0ec" },
  likeBtnText: { fontSize: 14, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f72585",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f72585",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: "#fff", fontSize: 30, lineHeight: 34 },
});
