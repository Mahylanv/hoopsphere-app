// src/Profil/Joueurs/hooks/usePlayerProfile.ts

import { useState, useEffect, useCallback } from "react";
import {
  // getAuth,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  User,
} from "firebase/auth";

import {
  doc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { Platform } from "react-native";

import { db, storage, auth } from "../../../../config/firebaseConfig";

import {
  computePlayerStats,
  PlayerAverages,
} from "../../../../utils/player/computePlayerStats";
import { computePlayerRating } from "../../../../utils/player/computePlayerRating";

/* ============================================================
   TYPES
============================================================ */
export type MediaItem = {
  url: string;
  type: "image" | "video";
};

/* ============================================================
   HOOK PRINCIPAL
============================================================ */
export default function usePlayerProfile() {
  const currentUser = auth.currentUser;
  const currentUid = currentUser?.uid ?? null;
  /* ---------------------------------------------------------
        STATES
  --------------------------------------------------------- */
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<PlayerAverages | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [gallery, setGallery] = useState<MediaItem[]>([]);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [tempNewEmail, setTempNewEmail] = useState("");
  const [passwordForReauth, setPasswordForReauth] = useState("");

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
    cardStyle: "normal",
  });

  const [editFields, setEditFields] = useState(fields);

  const setEditField = (k: string, v: string) => {
    setEditFields((prev) => ({ ...prev, [k]: v }));
  };

  /* ============================================================
        NORMALISATION
  ============================================================ */
  const normalizePoste = (poste: string) => {
    if (!poste) return "";
    const normalizeValue = (value: string) => {
      const raw = value.trim();
      if (!raw) return "";
      const normalized = raw
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
      const compact = normalized.replace(/[\s-]/g, "");

      if (["MEN", "MENEUR", "M", "PG"].includes(compact)) return "MEN";
      if (["ARR", "ARRIERE", "AR", "SG"].includes(compact)) return "ARR";
      if (["AIL", "AILIER", "SF"].includes(compact)) return "AIL";
      if (["AF", "AILIERFORT", "PF"].includes(compact)) return "AF";
      if (["PIV", "PIVOT", "C"].includes(compact)) return "PIV";

      return raw;
    };

    return poste
      .split(",")
      .map((p) => normalizeValue(p))
      .filter(Boolean)
      .join(", ");
  };

  useEffect(() => {
    if (!currentUser) return;

    const refUser = doc(db, "joueurs", currentUser.uid);
    const unsubscribe = onSnapshot(refUser, (snap) => {
      if (snap.exists()) {
        const data = snap.data();

        const loaded = {
          prenom: data.prenom || "",
          nom: data.nom || "",
          dob: data.dob || "",
          taille: data.taille || "",
          poids: data.poids || "",
          poste: normalizePoste(data.poste || ""),
          main: data.main || "",
          departement: data.departement || "",
          club: data.club || "",
          email: currentUser?.email || "",
          phone: data.phone || "",
          level: data.level || "",
          experience: data.experience || "",
          description: data.description || "",
          avatar: data.avatar || "",
          cardStyle: data.cardStyle || "normal",
          premium: data.premium ?? false,
        };

        setUser({
          uid: currentUid,
          ...loaded,
          stripeCustomerId: data.stripeCustomerId || null,
          stripeSubscriptionId: data.stripeSubscriptionId || null,
          subscriptionStatus: data.subscriptionStatus || null,
          subscriptionPriceId: data.subscriptionPriceId || null,
          subscriptionInterval: data.subscriptionInterval || null,
          subscriptionCancelAtPeriodEnd: data.subscriptionCancelAtPeriodEnd ?? false,
          subscriptionCurrentPeriodStart:
            data.subscriptionCurrentPeriodStart || null,
          subscriptionCurrentPeriodEnd:
            data.subscriptionCurrentPeriodEnd || null,
          subscriptionScheduledInterval:
            data.subscriptionScheduledInterval || null,
          subscriptionScheduledAt: data.subscriptionScheduledAt || null,
        });
        setFields(loaded);
        setEditFields(loaded); // ��? valeurs initiales dans le modal
      }

      setLoading(false);
    });

    loadGallery();

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  /* ============================================================
       CHARGEMENT DES STATS
  ============================================================ */
  const loadStats = useCallback(async () => {
    if (!user?.uid) return;

    const snap = await getDocs(
      collection(db, "joueurs", user.uid, "matches")
    );
    const matches = snap.docs.map((d) => d.data()) as any[];

    const averages = computePlayerStats(matches);
    setStats(averages);

    const overall = computePlayerRating(averages, user.poste);
    setRating(overall);
  }, [user?.uid, user?.poste]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /* ============================================================
       GALERIE
  ============================================================ */
  const loadGallery = useCallback(async () => {
    if (!currentUid) return;
    setGalleryLoading(true);

    try {
      const fsRef = collection(db, "joueurs", currentUid, "gallery");
      const snaps = await getDocs(fsRef);

      const list = snaps.docs
        .map((d) => d.data())
        .filter((i: any) => i.url && i.type)
        .map((i: any) => ({ url: i.url, type: i.type }));

      setGallery(list);
    } catch (e) {
    }

    setGalleryLoading(false);
  }, [currentUid]);

  /* ============================================================
       AJOUT MEDIA
  ============================================================ */
  const addGalleryMedia = async (
    uri: string,
    isVideo: boolean,
    file?: File
  ) => {
    const current = auth.currentUser;
    if (!current) return;

    setGalleryLoading(true);

    const ext = isVideo ? "mp4" : "jpg";
    const filename = `${Date.now()}.${ext}`;
    const storagePath = `gallery/${current.uid}/${filename}`;
    const storageRef = ref(storage, storagePath);

    try {
      const blob =
        Platform.OS === "web" && file ? file : await (await fetch(uri)).blob();

      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "joueurs", current.uid, "gallery"), {
        url,
        type: isVideo ? "video" : "image",
        createdAt: serverTimestamp(),
      });

      if (isVideo) {
        await addDoc(collection(db, "gallery"), {
          url,
          type: "video",
          playerUid: current.uid,
          createdAt: serverTimestamp(),
        });
      }

      setGallery((prev) => [
        ...prev,
        { url, type: isVideo ? "video" : "image" },
      ]);
    } catch (e) {
    }

    setGalleryLoading(false);
  };

  /* ============================================================
       SUPPRESSION MEDIA
  ============================================================ */
  const deleteGalleryMedia = async (url: string) => {
    const current = auth.currentUser;
    if (!current) return;
  
    try {
      // 1️⃣ Suppression Storage
      const storagePath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      await deleteObject(ref(storage, storagePath));
  
      // 2️⃣ Suppression galerie joueur
      const fsRef = collection(db, "joueurs", current.uid, "gallery");
      const snaps = await getDocs(fsRef);
  
      snaps.forEach(async (docSnap) => {
        if (docSnap.data().url === url) {
          await deleteDoc(docSnap.ref);
        }
      });
  
      const globalRef = collection(db, "gallery");
      const globalSnaps = await getDocs(globalRef);
  
      globalSnaps.forEach(async (docSnap) => {
        if (
          docSnap.data().url === url &&
          docSnap.data().playerUid === current.uid
        ) {
          await deleteDoc(docSnap.ref);
        }
      });
  
      // 4️⃣ Update front
      setGallery((prev) => prev.filter((m) => m.url !== url));
    } catch (e) {
    }
  };
  

  /* ============================================================
       AVATAR
  ============================================================ */
  const handleAvatarChange = async (imageUri: string) => {
    const current = auth.currentUser;
    if (!current) return;

    try {
      setAvatarLoading(true);

      const blob = await (await fetch(imageUri)).blob();
      const storageRef = ref(storage, `avatars/${current.uid}/avatar.jpg`);

      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await updateProfile(current, { photoURL: url });
      await updateDoc(doc(db, "joueurs", current.uid), { avatar: url });

      setFields((prev) => ({ ...prev, avatar: url }));
      setEditFields((prev) => ({ ...prev, avatar: url }));
      setUser((prev: any) => ({ ...prev, avatar: url }));
    } catch (e) {
    }

    setAvatarLoading(false);
  };

  /* ============================================================
       REAUTHENTIFICATION
  ============================================================ */
  const reauthenticate = async (password: string) => {
    const current = auth.currentUser;
    if (!current || !current.email) return false;

    try {
      const cred = EmailAuthProvider.credential(current.email, password);
      await reauthenticateWithCredential(current, cred);
      return true;
    } catch (e) {
      // console.log(" ERREUR RE-AUTH :", e);
      return false;
    }
  };

  /* ============================================================
============================================================ */
  const saveProfileView = async (targetUid: string) => {
    const viewer = auth.currentUser;
    if (!viewer) return;

    try {
      // console.log("📌 Tentative d'enregistrement d'une visite...");
      // console.log("👤 viewerUid =", viewer.uid, "| target =", targetUid);

      const ref = collection(db, "joueurs", targetUid, "views");

      await addDoc(ref, {
        viewerUid: viewer.uid,
        viewerType: "joueur",
        viewedAt: serverTimestamp(),
        seen: false, // ou true selon ton besoin
      });

      // console.log(" Visite enregistrée !");
    } catch (e) {
      // console.log(" ERREUR saveProfileView :", e);
    }
  };

  /* ============================================================
       SAUVEGARDE DU PROFIL
  ============================================================ */
  const saveProfile = async () => {
    const current = auth.currentUser;
    if (!current) return;


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanedPhone = (editFields.phone ?? "").replace(/\s/g, "");

    if (!emailRegex.test(editFields.email)) {
      setEmailError("Email invalide");
      return;
    }

    if (cleanedPhone !== "" && !/^(\+33|0)[67]\d{8}$/.test(cleanedPhone)) {
      setPhoneError("Numéro invalide");
      return;
    }

    const emailChanged = editFields.email !== fields.email;

    if (emailChanged && !passwordForReauth) {
      setTempNewEmail(editFields.email);
      setPasswordModalVisible(true);
      return;
    }

    try {
      const refUser = doc(db, "joueurs", current.uid);
      await updateDoc(refUser, { ...editFields, email: fields.email });

      if (emailChanged) {
        const ok = await reauthenticate(passwordForReauth);
        if (!ok) {
          alert("Mot de passe incorrect.");
          return;
        }

        await updateEmail(current, editFields.email);
        await updateDoc(refUser, { email: editFields.email });
      }

      setFields(editFields);
      setUser((prev: any) => ({
        ...prev,
        ...editFields,
        email: editFields.email,
      }));

      setPasswordForReauth("");
      setPasswordModalVisible(false);
    } catch (e) {
      alert("Impossible de sauvegarder les modifications.");
    }
  };

  /* ============================================================
       SUPPRESSION DU COMPTE
  ============================================================ */
  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) return false;

    try {
      await deleteUser(current);
      return true;
    } catch {
      return false;
    }
  };

  /* ============================================================
       EXPORTS
  ============================================================ */
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

    passwordModalVisible,
    setPasswordModalVisible,
    passwordForReauth,
    setPasswordForReauth,
    tempNewEmail,
    setTempNewEmail,
    saveProfileView,
    refetch: useCallback(async () => {
      await Promise.all([loadStats(), loadGallery()]);
    }, [loadStats, loadGallery]),
  };
}



