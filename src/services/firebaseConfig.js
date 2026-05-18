import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Ta configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAry74FkbA2VxWNcQQPcywq6bauB5n4Ijs",
  authDomain: "localstreetart-b9373.firebaseapp.com",
  projectId: "localstreetart-b9373",
  storageBucket: "localstreetart-b9373.firebasestorage.app",
  messagingSenderId: "497968710605",
  appId: "1:497968710605:web:7cad60bb2b6d5cf7fcfa84",
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Exportation des services pour les utiliser dans l'application
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
