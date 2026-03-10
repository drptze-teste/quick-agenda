import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration using official credentials
const firebaseConfig = {
  apiKey: "AIzaSyBnKkjWMb9tpW2yqLUDeOGGOXxC71YFdnU",
  authDomain: "agenda-quick-benesse.firebaseapp.com",
  projectId: "agenda-quick-benesse",
  storageBucket: "agenda-quick-benesse.firebasestorage.app",
  messagingSenderId: "90248119703",
  appId: "1:90248119703:web:2be3cd45b31e31d12470d2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
export const auth = getAuth(app);
