// src/Profil/Joueurs/hooks/usePlayerProfile.ts

import { useState, useEffect } from "react";
import { getAuth, updateProfile, deleteUser } from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";

import * as ImagePicker from "expo-image-picker";

import { db, storage } from "../../../config/firebaseConfig";

export type MediaItem = {
  url: string;
  type: "image" | "video";
};

export default function usePlayerProfile() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 👉 La galerie contient maintenant une liste d’objets
  const [gallery, setGallery] = useState<MediaItem[]>([]);

  const [fields, setFields] = useState({
    dob: "",
    taille: "",
    poids: "",
    poste: "",
    main: "",
    departement: "",
    club: "",
    email: "",
    description: "",
  });

  const setField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------------------------------------
      🔥 CHARGER PROFIL + GALERIE
  --------------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      const docRef = doc(db, "joueurs", currentUser.uid);

      try {
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();

          setUser({ uid: currentUser.uid, ...data });

          setFields({
            dob: data.dob || "",
            taille: data.taille || "",
            poids: data.poids || "",
            poste: data.poste || "",
            main: data.main || "",
            departement: data.departement || "",
            club: data.club || "",
            email: currentUser.email || "",
            description: data.description || "",
          });
        }
      } catch (error) {
        console.log("🔥 ERREUR LECTURE FIRESTORE =", error);
      }

      await loadGallery();
      setLoading(false);
    };

    fetchData();
  }, []);

  /* ---------------------------------------
      📸📹 CHARGEMENT GALERIE (images + vidéos)
  --------------------------------------- */
  const loadGallery = async () => {
    if (!currentUser) return;

    setGalleryLoading(true);

    const fsRef = collection(db, "joueurs", currentUser.uid, "gallery");

    try {
      const snaps = await getDocs(fsRef);
      if (snaps.empty) {
        setGallery([]); // galerie vide = ok
        setGalleryLoading(false);
        return;
      }

      // 🔥 Reset avant de recharger (mais UNE seule fois)
      setGallery([]);

      const items: MediaItem[] = snaps.docs
        .map((d) => d.data())
        .filter((item) => item.url && item.type)
        .map((item) => ({
          url: item.url,
          type: item.type,
        }));

      setGallery(items);
    } catch (e) {
      console.log("❌ ERREUR loadGallery =", e);
    }

    setGalleryLoading(false);
  };

  /* ---------------------------------------
      📤 AJOUT PHOTO OU VIDÉO
  --------------------------------------- */
  const addGalleryMedia = async (uri: string, isVideo: boolean) => {
    if (!currentUser) return;

    setGalleryLoading(true);

    const extension = isVideo ? "mp4" : "jpg";
    const fileName = `${Date.now()}.${extension}`;
    const storagePath = `gallery/${currentUser.uid}/${fileName}`;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      const fsRef = collection(db, "joueurs", currentUser.uid, "gallery");

      await addDoc(fsRef, {
        url,
        type: isVideo ? "video" : "image",
        createdAt: serverTimestamp(),
      });

      // 🔥 Mise à jour instantanée
      setGallery((prev) => [
        ...prev,
        { url, type: isVideo ? "video" : "image" },
      ]);
    } catch (error: any) {
      console.log("🔥 ERREUR addGalleryMedia =", error.message);
    }

    setGalleryLoading(false);
  };

  /* ---------------------------------------
      ❌ SUPPRESSION D’UNE PHOTO / VIDÉO
  --------------------------------------- */
  const deleteGalleryMedia = async (url: string) => {
    if (!currentUser) return;

    try {
      // Supprimer dans STORAGE
      const storagePath = url.split("/o/")[1].split("?")[0];
      const fileRef = ref(storage, decodeURIComponent(storagePath));

      await deleteObject(fileRef);

      // Supprimer dans FIRESTORE
      const fsRef = collection(db, "joueurs", currentUser.uid, "gallery");
      const snaps = await getDocs(fsRef);

      snaps.forEach(async (d) => {
        if (d.data().url === url) {
          await deleteDoc(d.ref);
        }
      });

      // Mise à jour instantanée
      setGallery((prev) => prev.filter((item) => item.url !== url));
    } catch (e) {
      console.log("🔥 ERREUR deleteGalleryMedia =", e);
    }
  };

  /* ---------------------------------------
      🖼️ AVATAR
  --------------------------------------- */
  const handleAvatarChange = async (imageUri: string) => {
    try {
      if (!currentUser) return;

      setAvatarLoading(true);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storageRef = ref(storage, `avatars/${currentUser.uid}/avatar.jpg`);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      await updateProfile(currentUser, { photoURL: downloadUrl });

      await updateDoc(doc(db, "joueurs", currentUser.uid), {
        avatar: downloadUrl,
      });

      setUser((prev: any) => ({ ...prev, avatar: downloadUrl }));
    } catch (e) {
      console.error("🔥 ERREUR handleAvatarChange =", e);
    } finally {
      setAvatarLoading(false);
    }
  };

  /* ---------------------------------------
      💾 SAUVEGARDE PROFIL
  --------------------------------------- */
  const saveProfile = async () => {
    if (!currentUser) return;

    try {
      const refUser = doc(db, "joueurs", currentUser.uid);
      await updateDoc(refUser, { ...fields });

      setUser((prev: any) => ({ ...prev, ...fields }));
      setEditMode(false);
    } catch (e) {
      console.log("🔥 ERREUR saveProfile =", e);
    }
  };

  /* ---------------------------------------
      ❌ SUPPRESSION COMPTE
  --------------------------------------- */
  const deleteAccount = async () => {
    if (!currentUser) return;

    try {
      await deleteUser(currentUser);
      return true;
    } catch (e) {
      return false;
    }
  };

  return {
    user,
    loading,
    avatarLoading,
    galleryLoading,

    gallery, // <--- contient { url, type }

    editMode,
    setEditMode,

    fields,
    setField,

    handleAvatarChange,
    saveProfile,
    deleteAccount,

    // Upload & delete
    addGalleryMedia,
    deleteGalleryMedia,
  };
}
