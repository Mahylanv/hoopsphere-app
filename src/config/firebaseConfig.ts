// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyClvHa4SAH9QogkFc7sKJxnoA3eCWBpcek",
  authDomain: "hoopsphere-df315.firebaseapp.com",
  projectId: "hoopsphere-df315",
  storageBucket: "hoopsphere-df315.firebasestorage.app",
  messagingSenderId: "573890431126",
  appId: "1:573890431126:web:4c64b7534030cb4b191ab7",
  measurementId: "G-MH63E7L4BS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Services
export const auth = getAuth(app);
export const db = getFirestore(app);