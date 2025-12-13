// src/config/firebaseConfig.ts

import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";

import {
  getAuth,
  initializeAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  setLogLevel,
} from "firebase/firestore";

import { getStorage } from "firebase/storage";

/* ===========================================================
   🔥 CONFIG FIREBASE (.env)
=========================================================== */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/* ===========================================================
   🔥 INITIALISATION FIREBASE
=========================================================== */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/* ===========================================================
   🔥 AUTH COMPATIBLE EXPO
=========================================================== */
function initAuth() {
  if (Platform.OS !== "web") {
    try {
      const { getReactNativePersistence } = require("firebase/auth/react-native");
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (err) {
      console.warn("⚠️ Auth fallback:", err);
      return getAuth(app);
    }
  }

  // Web
  return getAuth(app);
}

export const auth = initAuth();

/* ===========================================================
   🔥 FIRESTORE (fix pour Expo)
=========================================================== */

setLogLevel("error"); // moins de bruit

export const db = initializeFirestore(app, {
  localCache:
    Platform.OS === "web"
      ? persistentLocalCache() // ✅ Web version simplifiée (OK pour Expo Web)
      : memoryLocalCache(), // ✅ Mobile
  experimentalAutoDetectLongPolling: true,
});

/* ===========================================================
   🔥 STORAGE
=========================================================== */
export const storage = getStorage(app);

export default app;
