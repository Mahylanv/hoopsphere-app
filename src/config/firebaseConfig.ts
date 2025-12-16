import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/* ============================
   AUTH
============================ */
function initAuthNative() {
  let getReactNativePersistence: any;
  try {
    ({ getReactNativePersistence } = require("firebase/auth/react-native"));
  } catch {
    ({ getReactNativePersistence } = require("@firebase/auth/dist/rn/index.js"));
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth =
  Platform.OS === "web" ? getAuth(app) : initAuthNative();

/* ============================
   FIRESTORE (SINGLE INSTANCE)
============================ */
export const db = getFirestore(app);

/* ============================
   STORAGE
============================ */
export const storage = getStorage(app);

setLogLevel("error");

export default app;
