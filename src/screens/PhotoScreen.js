// src/screens/PhotoScreen.js
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PhotoScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      // Request Camera Permission
      const { status: cameraStatus } =
        await Camera.requestCameraPermissionsAsync();

      // Request Location Permission
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();

      setHasPermission(
        cameraStatus === "granted" && locationStatus === "granted",
      );

      if (locationStatus === "granted") {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current && location) {
      const photo = await cameraRef.current.takePictureAsync();
      console.log("Photo taken:", photo.uri);
      console.log("Location:", location.latitude, location.longitude);

      // TODO: Upload photo to Firebase Storage and save metadata to Firestore
      Alert.alert("Success", "Artwork captured!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera or location</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.innerCircle} />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1, justifyContent: "flex-end" },
  buttonContainer: {
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "white",
  },
});
