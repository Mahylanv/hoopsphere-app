// src/Profil/Joueurs/hooks/usePlayerProfile.ts

import { useState, useEffect } from "react";
import { getAuth, updateProfile, deleteUser } from "firebase/auth";
import { Platform } from "react-native";
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
import { computePlayerStats, PlayerAverages } from "../../../utils/computePlayerStats";
import { computePlayerRating } from "../../../utils/computePlayerRating";

export type MediaItem = {
  url: string;
  type: "image" | "video";
};

export default function usePlayerProfile() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  /* -----------------------------------------------------
      STATES
  ----------------------------------------------------- */
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<PlayerAverages | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [gallery, setGallery] = useState<MediaItem[]>([]);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  /** Champs affichés dans l'app */
  const [fields, setFields] = useState({
    prenom: "",
    nom: "",
    dob: "",
    taille: "",
    poids: "",
    poste: "",
    main: "",
    departement: "",
    club: "",
    email: "",
    phone: "",
    level: "",
    experience: "",
    description: "",
    avatar: "",
  });

  /** Champs modifiables → sauvegardés uniquement quand on clique sur Enregistrer */
  const [editFields, setEditFields] = useState(fields);

  const setEditField = (k: string, v: string) => {
    setEditFields((prev) => ({ ...prev, [k]: v }));
  };

  /* -----------------------------------------------------
      🔥 CHARGEMENT PROFIL + GALERIE
  ----------------------------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      const refUser = doc(db, "joueurs", currentUser.uid);
      const snap = await getDoc(refUser);

      if (snap.exists()) {
        const data = snap.data();

        const loaded = {
          prenom: data.prenom || "",
          nom: data.nom || "",
          dob: data.dob || "",
          taille: data.taille || "",
          poids: data.poids || "",
          poste: data.poste || "",
          main: data.main || "",
          departement: data.departement || "",
          club: data.club || "",
          email: currentUser.email || "",
          phone: data.phone || "",
          level: data.level || "",
          experience: data.experience || "",
          description: data.description || "",
          avatar: data.avatar || "",
        };

        setUser({ uid: currentUser.uid, ...loaded });
        setFields(loaded);
        setEditFields(loaded); // ← valeurs initiales dans le modal
      }

      await loadGallery();
      setLoading(false);
    };

    fetchData();
  }, []);

  /* -----------------------------------------------------
      🔥 RECHARGE STATS + RATING
  ----------------------------------------------------- */
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.uid) return;

      const snap = await getDocs(collection(db, "joueurs", user.uid, "matches"));
      const matches = snap.docs.map((d) => d.data()) as any[];

      const averages = computePlayerStats(matches);
      setStats(averages);

      const overall = computePlayerRating(averages, user.poste);
      setRating(overall);
    };

    loadStats();
  }, [user]);

  /* -----------------------------------------------------
      🔥 GALERIE
  ----------------------------------------------------- */
  const loadGallery = async () => {
    if (!currentUser) return;
    setGalleryLoading(true);

    try {
      const fsRef = collection(db, "joueurs", currentUser.uid, "gallery");
      const snaps = await getDocs(fsRef);

      const list = snaps.docs
        .map((d) => d.data())
        .filter((i: any) => i.url && i.type)
        .map((i: any) => ({ url: i.url, type: i.type }));

      setGallery(list);
    } catch (e) {
      console.log("🔥 ERREUR loadGallery:", e);
    }

    setGalleryLoading(false);
  };

  const addGalleryMedia = async (uri: string, isVideo: boolean, file?: File) => {
    if (!currentUser) return;
    setGalleryLoading(true);

    const ext = isVideo ? "mp4" : "jpg";
    const filename = `${Date.now()}.${ext}`;
    const storagePath = `gallery/${currentUser.uid}/${filename}`;
    const storageRef = ref(storage, storagePath);

    try {
      const blob =
        Platform.OS === "web" && file
          ? file
          : await (await fetch(uri)).blob();

      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "joueurs", currentUser.uid, "gallery"), {
        url,
        type: isVideo ? "video" : "image",
        createdAt: serverTimestamp(),
      });

      setGallery((p) => [...p, { url, type: isVideo ? "video" : "image" }]);
    } catch (e) {
      console.log("🔥 ERREUR addGalleryMedia:", e);
    }

    setGalleryLoading(false);
  };

  const deleteGalleryMedia = async (url: string) => {
    if (!currentUser) return;

    try {
      const storagePath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      await deleteObject(ref(storage, storagePath));

      const fsRef = collection(db, "joueurs", currentUser.uid, "gallery");
      const snaps = await getDocs(fsRef);

      snaps.forEach(async (docSnap) => {
        if (docSnap.data().url === url) {
          await deleteDoc(docSnap.ref);
        }
      });

      setGallery((p) => p.filter((m) => m.url !== url));
    } catch (e) {
      console.log("🔥 ERREUR deleteGalleryMedia:", e);
    }
  };

  /* -----------------------------------------------------
      🔥 AVATAR (mise à jour immédiate dans UI & BDD)
  ----------------------------------------------------- */
  const handleAvatarChange = async (imageUri: string) => {
    if (!currentUser) return;

    try {
      setAvatarLoading(true);

      const blob = await (await fetch(imageUri)).blob();
      const storageRef = ref(storage, `avatars/${currentUser.uid}/avatar.jpg`);

      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await updateProfile(currentUser, { photoURL: url });
      await updateDoc(doc(db, "joueurs", currentUser.uid), { avatar: url });

      // UI : avatar visible immédiatement
      setFields((p) => ({ ...p, avatar: url }));
      setEditFields((p) => ({ ...p, avatar: url }));
      setUser((p: any) => ({ ...p, avatar: url }));
    } catch (e) {
      console.log("🔥 ERREUR avatar:", e);
    } finally {
      setAvatarLoading(false);
    }
  };

  /* -----------------------------------------------------
      🔥 SAUVEGARDE (BDD uniquement quand on clique)
  ----------------------------------------------------- */
  const saveProfile = async () => {
    if (!currentUser) return;

    // EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editFields.email)) {
      setEmailError("Email invalide");
      return;
    }

    // TELEPHONE
    const cleaned = editFields.phone.replace(/\s/g, "");
    if (!/^(\+33|0)[67]\d{8}$/.test(cleaned)) {
      setPhoneError("Numéro invalide");
      return;
    }

    try {
      const refUser = doc(db, "joueurs", currentUser.uid);

      await updateDoc(refUser, { ...editFields });

      // → Mise à jour des champs visibles
      setFields(editFields);

      // → Mise à jour globale utilisateur
      setUser((prev: any) => ({ ...prev, ...editFields }));
    } catch (e) {
      console.log("🔥 ERREUR saveProfile:", e);
    }
  };

  /* -----------------------------------------------------
      ❌ SUPPRESSION COMPTE
  ----------------------------------------------------- */
  const deleteAccount = async () => {
    if (!currentUser) return false;
    try {
      await deleteUser(currentUser);
      return true;
    } catch {
      return false;
    }
  };

  /* -----------------------------------------------------
      EXPORTS
  ----------------------------------------------------- */
  return {
    user,
    loading,
    avatarLoading,
    galleryLoading,

    gallery,
    fields,
    editFields,
    setEditField,

    handleAvatarChange,
    saveProfile,
    deleteAccount,

    addGalleryMedia,
    deleteGalleryMedia,

    stats,
    rating,
    emailError,
    setEmailError,
    phoneError,
    setPhoneError,
  };
}
