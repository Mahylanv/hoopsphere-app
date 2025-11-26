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
} from "firebase/storage";

import { db, storage } from "../../../config/firebaseConfig";

export default function usePlayerProfile() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [gallery, setGallery] = useState<string[]>([]);

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
      📸 CHARGEMENT GALERIE
  --------------------------------------- */
  const loadGallery = async () => {
    if (!currentUser) return;

    setGalleryLoading(true);

    const galleryRef = collection(db, "joueurs", currentUser.uid, "gallery");

    try {
      const snaps = await getDocs(galleryRef);
      const urls = snaps.docs.map((d) => d.data().url).filter(Boolean);
      setGallery(urls);
    } catch (e) {
      console.log("❌ ERREUR loadGallery =", e);
    }

    setGalleryLoading(false);
  };

  /* ---------------------------------------
      📤 AJOUT PHOTO GALERIE
  --------------------------------------- */
  const addGalleryImage = async (uri: string) => {
    if (!currentUser) return;

    setGalleryLoading(true);

    const fileName = `${Date.now()}.jpg`;
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
        createdAt: serverTimestamp(),
      });

      setGallery((prev) => [...prev, url]);
    } catch (error: any) {
      console.log("🔥 ERREUR addGalleryImage =", error.code, error.message);
    }

    setGalleryLoading(false);
  };

  /* ---------------------------------------
      ❌ SUPPRESSION D’UNE PHOTO
  --------------------------------------- */
  const deleteGalleryImage = async (url: string) => {
    if (!currentUser) return;

    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);

      const fsRef = collection(db, "joueurs", currentUser.uid, "gallery");
      const snaps = await getDocs(fsRef);

      snaps.forEach(async (d) => {
        if (d.data().url === url) {
          await deleteDoc(d.ref);
        }
      });

      setGallery((prev) => prev.filter((img) => img !== url));
    } catch (e) {
      console.log("🔥 ERREUR deleteGalleryImage =", e);
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
    gallery,

    editMode,
    setEditMode,

    fields,
    setField,

    handleAvatarChange,
    saveProfile,
    deleteAccount,

    addGalleryImage,
    deleteGalleryImage,
  };
}
  