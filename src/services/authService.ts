// src/services/authService.ts

import { auth, db, storage } from "../config/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const registerPlayer = async (data: any) => {
  const { email, password, avatar, ...profileData } = data;

  // 1️⃣ Création du compte Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // 2️⃣ Upload avatar si présent
  let avatarUrl = null;
  if (avatar) {
    const response = await fetch(avatar);
    const blob = await response.blob();
    const storageRef = ref(storage, `avatars/${user.uid}/avatar.jpg`);
    await uploadBytes(storageRef, blob);
    avatarUrl = await getDownloadURL(storageRef);
  }

  // 3️⃣ Création du document principal du joueur
  await setDoc(doc(db, "joueurs", user.uid), {
    ...profileData,
    email,
    avatar: avatarUrl,
    createdAt: serverTimestamp(),
  });

  // 4️⃣ Création automatique d’une sous-collection "gallery"
  await addDoc(collection(db, "joueurs", user.uid, "gallery"), {
    url: "",
    createdAt: serverTimestamp(),
  });

  return user;
};
