import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore - The types for getReactNativePersistence are sometimes missing in older @firebase/auth versions but it exists at runtime
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// PLACEHOLDER CONFIGURATION
// Swap these with your authentic Firebase Web App credentials when active.
const firebaseConfig = {
  apiKey: "AIzaSyD_v4vvyBwq0TO3FrGSmQfWbG0sWeG8PI0",
  authDomain: "braindump-52a68.firebaseapp.com",
  projectId: "braindump-52a68",
  storageBucket: "braindump-52a68.firebasestorage.app",
  messagingSenderId: "265435127988",
  appId: "1:265435127988:web:dea9409baab5f8a6a7b7e1",
  measurementId: "G-9KKQ4130H1"
};

let app: any;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firestore with offline persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
const storage = getStorage(app);

// Initialize Firebase Auth with React Native persistence to prevent the AsyncStorage warning
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { app, db, storage, auth };
