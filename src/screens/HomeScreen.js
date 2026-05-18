// src/screens/HomeScreen.js
import { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen({ navigation }) {
  const [artworks, setArtworks] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' or 'liked'

  // Dummy data fallback for UI testing if Firebase is empty
  const dummyData = [
    {
      id: "1",
      imageUrl: "https://via.placeholder.com/300",
      author: "BanksyFake",
      likes: 12,
      lat: 48.8566,
      lng: 2.3522,
    },
  ];

  useEffect(() => {
    // TODO: Fetch from Firebase Firestore
    // const fetchArt = async () => { ... }
    setArtworks(dummyData);
  }, []);

  const handleLike = async (id) => {
    // TODO: Implement Firebase like increment and update user's liked list
    console.log(`Liked artwork ${id}`);
  };

  const openMap = (lat, lng) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => openMap(item.lat, item.lng)}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      </TouchableOpacity>
      <View style={styles.cardInfo}>
        <Text style={styles.author}>By: {item.author}</Text>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => handleLike(item.id)}
        >
          <Text style={styles.likeText}>❤️ {item.likes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setFilter("all")}>
          <Text style={styles.navText}>All Arts</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("liked")}>
          <Text style={styles.navText}>My Likes</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={artworks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

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
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "#3a0ca3",
    paddingTop: 50,
  },
  navText: { color: "white", fontWeight: "bold" },
  card: {
    margin: 15,
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
  },
  image: { width: "100%", height: 200 },
  cardInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    alignItems: "center",
  },
  author: { fontWeight: "bold", color: "#7209b7" },
  likeBtn: {
    backgroundColor: "#f72585",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  likeText: { color: "white" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#f72585",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  fabText: { color: "white", fontSize: 30, fontWeight: "bold" },
});
