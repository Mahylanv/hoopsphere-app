
// src/config/firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  initializeFirestore,
  memoryLocalCache,
  setLogLevel,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// ✅ Auth sans persistence (user ne reste pas connecté après fermeture)
export const auth = getAuth(app);

// ✅ Firestore avec long polling (fix Expo Go)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
<<<<<<< HEAD
=======

export default app;
>>>>>>> 3f81264 (Inscripition joueur Ok)
