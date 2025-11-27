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

function initAuthNative() {
  let getReactNativePersistence: any | undefined;
  try {
    ({ getReactNativePersistence } = require('firebase/auth/react-native'));
  } catch {
    try {
      ({ getReactNativePersistence } = require('@firebase/auth/dist/rn/index.js'));
    } catch {
      throw new Error(
        "Impossible de charger 'getReactNativePersistence'. Vérifie 'firebase@^12' et relance avec 'expo start --clear'."
      );
    }
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app); 
  }
}

export const auth = Platform.OS === 'web' ? getAuth(app) : initAuthNative();
export const storage = getStorage(app);

setLogLevel('error');

export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalAutoDetectLongPolling: true,
});

export default app;