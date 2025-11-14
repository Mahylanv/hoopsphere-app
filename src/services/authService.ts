// src/services/authService.ts
import { auth, db, storage } from "../config/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const registerPlayer = async (data: any) => {
  const { email, password, ...profileData } = data;

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let avatarUrl = null;
  if (profileData.avatar) {
    const response = await fetch(profileData.avatar);
    const blob = await response.blob();
    const storageRef = ref(storage, `avatars/${user.uid}/avatar.jpg`);
    await uploadBytes(storageRef, blob);
    avatarUrl = await getDownloadURL(storageRef);
  }

  await setDoc(doc(db, "joueurs", user.uid), {
    ...profileData,
    email,
    avatar: avatarUrl,
    createdAt: new Date().toISOString(),
  });

  return user;
};
