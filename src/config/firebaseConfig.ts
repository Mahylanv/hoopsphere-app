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
  apiKey: 'AIzaSyClvHa4SAH9QogkFc7sKJxnoA3eCWBpcek',
  authDomain: 'hoopsphere-df315.firebaseapp.com',
  projectId: 'hoopsphere-df315',
  storageBucket: 'hoopsphere-df315.firebasestorage.app',
  messagingSenderId: '573890431126',
  appId: '1:573890431126:web:4c64b7534030cb4b191ab7',
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

setLogLevel('error');

export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalAutoDetectLongPolling: true,
});

export default app;
