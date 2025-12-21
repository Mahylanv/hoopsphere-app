// src/features/profile/player/services/postService.ts

import { auth, db, storage } from "../../../../config/firebaseConfig";
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
  deleteObject,
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

export type UpdatePostPayload = {
  description: string;
  location?: string;
  postType: "highlight" | "match" | "training";
  skills: string[];
  visibility: "public" | "private";

  // ➕ optionnel : seulement si on change le média
  mediaUrl?: string;
  mediaType?: "image" | "video";
};

/* ============================================================
   CREATE POST
   - Double écriture volontaire
============================================================ */
export const createPost = async (payload: CreatePostPayload) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    /* ---------- UPLOAD MEDIA ---------- */
    const response = await fetch(payload.mediaUri);
    const blob = await response.blob();

    const ext = payload.mediaType === "video" ? "mp4" : "jpg";
    const filename = `${Date.now()}.${ext}`;
    const storagePath = `posts/${user.uid}/${filename}`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);

    const mediaUrl = await getDownloadURL(storageRef);

    /* ---------- FIRESTORE DOC ---------- */
    const postRef = doc(collection(db, "posts"));

    const postDoc = {
      id: postRef.id,
      playerUid: user.uid,

      mediaUrl,
      mediaType: payload.mediaType,

      description: payload.description,
      location: payload.location || null,

      postType: payload.postType,
      skills: payload.skills,
      visibility: payload.visibility,

      likesCount: 0,
      commentsCount: 0,

      createdAt: serverTimestamp(),
    };

    // 🌍 Feed global (lecture)
    await setDoc(postRef, postDoc);

    // 👤 Source de vérité joueur
    await setDoc(
      doc(db, "joueurs", user.uid, "posts", postRef.id),
      postDoc
    );

    return postRef.id;
  } catch (e) {
    console.error("❌ createPost error:", e);
    throw e;
  }
};

/* ============================================================
   UPDATE POST ✅ (SOURCE UNIQUE)
   - Écriture UNIQUEMENT dans /joueurs/{uid}/posts
============================================================ */
export const updatePost = async (
  postId: string,
  updates: UpdatePostPayload
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");

  const cleanUpdates = {
    description: updates.description,
    location: updates.location || null,
    postType: updates.postType,
    skills: updates.skills,
    visibility: updates.visibility,
    ...(updates.mediaUrl && {
      mediaUrl: updates.mediaUrl,
      mediaType: "video",
    }),
    updatedAt: serverTimestamp(),
  };

  try {
    // 👤 SEULE écriture autorisée côté client
    await updateDoc(
      doc(db, "joueurs", user.uid, "posts", postId),
      cleanUpdates
    );

    console.log("✅ Post joueur mis à jour :", postId);
  } catch (e) {
    console.error("❌ updatePost error:", e);
    throw e;
  }
};

/* ============================================================
   DELETE POST
   - Suppression des deux copies
============================================================ */
export const deletePost = async (postId: string, mediaUrl?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    // 🗑️ Firestore
    await deleteDoc(doc(db, "posts", postId));
    await deleteDoc(doc(db, "joueurs", user.uid, "posts", postId));

    // 🗑️ Storage
    if (mediaUrl) {
      const mediaRef = ref(storage, mediaUrl);
      await deleteObject(mediaRef);
    }

    console.log("🗑️ Post supprimé :", postId);
  } catch (e) {
    console.error("❌ deletePost error:", e);
    throw e;
  }
};
