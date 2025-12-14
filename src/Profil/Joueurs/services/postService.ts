// src/Profil/services/postService.ts

import { auth, db, storage } from "../../../config/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

/* ============================================================
   TYPES
============================================================ */
export type CreatePostPayload = {
  mediaUri: string;
  mediaType: "image" | "video";
  description: string;
  location?: string;
  postType: "highlight" | "match" | "training";
  skills: string[];
  visibility: "public" | "private";
};

/* ============================================================
   CREATE POST
============================================================ */
export const createPost = async (payload: CreatePostPayload) => {
  console.log("🟡 createPost() called");
  console.log("📦 Payload reçu :", payload);

  const user = auth.currentUser;
  if (!user) {
    console.error("❌ Aucun utilisateur connecté");
    throw new Error("Utilisateur non authentifié");
  }

  try {
    /* -------------------------------
       1️⃣ Upload média
    -------------------------------- */
    console.log("⬆️ Upload média en cours...");

    const response = await fetch(payload.mediaUri);
    const blob = await response.blob();

    console.log("📦 Blob size :", blob.size);

    const ext = payload.mediaType === "video" ? "mp4" : "jpg";
    const filename = `${Date.now()}.${ext}`;
    const storagePath = `posts/${user.uid}/${filename}`;

    console.log("📂 Storage path :", storagePath);

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);

    const mediaUrl = await getDownloadURL(storageRef);
    console.log("🔗 mediaUrl :", mediaUrl);

    /* -------------------------------
       2️⃣ Firestore document (ID unique)
    -------------------------------- */
    const postRef = doc(collection(db, "posts"));

    const postDoc = {
      id: postRef.id,
      playerUid: user.uid,

      mediaUrl,
      mediaType: payload.mediaType,

      description: payload.description || "",
      location: payload.location || null,

      postType: payload.postType,
      skills: payload.skills || [],
      visibility: payload.visibility,

      likesCount: 0,
      commentsCount: 0,

      createdAt: serverTimestamp(),
    };

    console.log("📝 Post Firestore :", postDoc);

    // 🌍 COLLECTION GLOBALE
    await setDoc(postRef, postDoc);
    console.log("✅ Post créé dans /posts :", postRef.id);

    // 👤 COLLECTION PROFIL JOUEUR (MÊME ID)
    await setDoc(
      doc(db, "joueurs", user.uid, "posts", postRef.id),
      postDoc
    );
    console.log("✅ Post créé dans /joueurs/{uid}/posts :", postRef.id);

    return postRef.id;
  } catch (error) {
    console.error("❌ ERREUR createPost :", error);
    throw error;
  }
};

/* ============================================================
   UPDATE POST
============================================================ */
export const updatePost = async (
  postId: string,
  updates: {
    description: string;
    location?: string;
  }
) => {
  console.log("🟡 updatePost()", postId, updates);

  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    // 🌍 Global
    await updateDoc(doc(db, "posts", postId), updates);

    // 👤 Profil joueur
    await updateDoc(
      doc(db, "joueurs", user.uid, "posts", postId),
      updates
    );

    console.log("✅ Post mis à jour :", postId);
  } catch (error) {
    console.error("❌ ERREUR updatePost :", error);
    throw error;
  }
};

/* ============================================================
   DELETE POST
============================================================ */
export const deletePost = async (postId: string) => {
  console.log("🟡 deletePost()", postId);

  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    // 🗑️ Firestore
    await deleteDoc(doc(db, "posts", postId));
    await deleteDoc(doc(db, "joueurs", user.uid, "posts", postId));

    console.log("🗑️ Post supprimé :", postId);
  } catch (error) {
    console.error("❌ ERREUR deletePost :", error);
    throw error;
  }
};
