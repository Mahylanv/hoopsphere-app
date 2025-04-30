// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import Constants from 'expo-constants'

// 1. Récupère ta config depuis les variables d’environnement ou hard-code
const firebaseConfig = {
    apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY!,
    authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN!,
    projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID!,
    storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID!,
    appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID!,
}

// 2. Initialise Firebase
const app = initializeApp(firebaseConfig)

// 3. Exporte les services que tu utiliseras
export const auth = getAuth(app)
export const db = getFirestore(app)


