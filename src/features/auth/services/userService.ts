// src/services/userService.ts

import { auth, db, storage } from "../../../config/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll} from "firebase/storage";

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

export const deleteUserAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    try {
      const uid = user.uid;
  
      // 1️⃣ Supprimer les fichiers de l'utilisateur (avatars, etc.)
      const userFolderRef = ref(storage, `avatars/${uid}`);
      const files = await listAll(userFolderRef);
      for (const fileRef of files.items) {
        await deleteObject(fileRef);
      }
  
      // 2️⃣ Supprimer le document Firestore
      await deleteDoc(doc(db, "joueurs", uid));
  
      // 3️⃣ Supprimer le compte Auth
      await user.delete();
  
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du compte :", error);
      throw error;
    }
  };
