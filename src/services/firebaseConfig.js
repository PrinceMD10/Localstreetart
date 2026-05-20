// src/services/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAry74FkbA2VxWNcQQPcywq6bauB5n4Ijs",
  authDomain: "localstreetart-b9373.firebaseapp.com",
  projectId: "localstreetart-b9373",
  storageBucket: "localstreetart-b9373.firebasestorage.app",
  messagingSenderId: "497968710605",
  appId: "1:497968710605:web:7cad60bb2b6d5cf7fcfa84",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Fix CORS WebChannel on localhost — use long polling instead
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export const storage = getStorage(app);

console.log("[Firebase] ✅ Initialized with long polling");
