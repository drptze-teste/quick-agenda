import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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

// ✅ Força long-polling — resolve ERR_QUIC_PROTOCOL_ERROR
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true, // 👈 chave do problema
  useFetchStreams: false               // 👈 desativa streams via QUIC
});

export const auth = getAuth(app);
