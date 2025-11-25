// src/Profil/Joueur/hooks/usePlayerProfile.ts

import { useState, useEffect } from "react";
import { getAuth, updateProfile, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../../../config/firebaseConfig";

export default function usePlayerProfile() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [user, setUser] = useState<any>(null);

  // Champs du profil
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

  // Charger les données Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      // ❗ Correction : collection = joueurs (et pas users)
      const docRef = doc(db, "joueurs", currentUser.uid);
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

      setLoading(false);
    };

    fetchData();
  }, []);

  // Mise à jour Avatar
  const handleAvatarChange = async (imageUri: string) => {
    try {
      if (!currentUser) return;

      setAvatarLoading(true);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storageRef = ref(storage, `avatars/${currentUser.uid}.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadUrl = await getDownloadURL(storageRef);

      // Mise à jour Auth
      await updateProfile(currentUser, { photoURL: downloadUrl });

      // ❗ Correction Firestore: joueurs
      await updateDoc(doc(db, "joueurs", currentUser.uid), {
        avatar: downloadUrl,
      });

      setUser((prev: any) => ({ ...prev, avatar: downloadUrl }));
    } catch (e) {
      console.error("Erreur avatar :", e);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Sauvegarder Bio
  const saveProfile = async () => {
    if (!currentUser) return;

    try {
      const refUser = doc(db, "joueurs", currentUser.uid); // ❗ Correction

      await updateDoc(refUser, {
        dob: fields.dob,
        taille: fields.taille,
        poids: fields.poids,
        poste: fields.poste,
        main: fields.main,
        departement: fields.departement,
        club: fields.club,
        description: fields.description,
      });

      setUser((prev: any) => ({
        ...prev,
        ...fields,
      }));

      setEditMode(false);
    } catch (e) {
      console.error("Erreur sauvegarde :", e);
    }
  };

  // Suppression du compte
  const deleteAccount = async () => {
    if (!currentUser) return;

    try {
      await deleteUser(currentUser);
      return true;
    } catch (e) {
      console.error("Erreur suppression compte :", e);
      return false;
    }
  };

  return {
    user,
    loading,
    editMode,
    setEditMode,
    avatarLoading,
    fields,
    setField,
    handleAvatarChange,
    saveProfile,
    deleteAccount,
  };
}
