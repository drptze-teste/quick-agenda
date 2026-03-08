import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBnKkjWMb9tpW2yqLUDeOGGOXxC71YFdnU",
  authDomain: "agenda-quick-benesse.firebaseapp.com",
  projectId: "agenda-quick-benesse",
  storageBucket: "agenda-quick-benesse.firebasestorage.app",
  messagingSenderId: "90248119703",
  appId: "1:90248119703:web:2be3cd45b31e31d12470d2"
};

const app = initializeApp(firebaseConfig);

// ✅ API moderna — substitui enableIndexedDbPersistence (depreciado)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

export const auth = getAuth(app);
