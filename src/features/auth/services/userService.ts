// src/services/userService.ts

import { auth, db, storage } from "../../../config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export const getUserProfile = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(doc(db, "joueurs", uid));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (data: any) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await updateDoc(doc(db, "joueurs", uid), data);
};

export const updateAvatar = async (imageUri: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const response = await fetch(imageUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `avatars/${uid}/avatar.jpg`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, "joueurs", uid), { avatar: url });
  return url;
};

export const deleteUserAccount = async (password?: string) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    if (password && user.email) {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
    }

    // Supprime uniquement Auth. Les données Firestore/Storage sont nettoyées
    // via la fonction backend cleanupUserOnDelete.
    await user.delete();

    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression du compte :", error);
    throw error;
  }
};
