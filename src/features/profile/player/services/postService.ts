// src/features/profile/player/services/postService.ts

import { auth, db, storage } from "../../../../config/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import * as VideoThumbnails from "expo-video-thumbnails";

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
  visibility: "public" | "private" | "clubs";
};

export type UpdatePostPayload = {
  description: string;
  location?: string;
  postType: "highlight" | "match" | "training";
  skills: string[];
  visibility: "public" | "private" | "clubs";
};

/* ============================================================
   UTILS — GENERATE VIDEO THUMBNAIL
============================================================ */
const generateVideoThumbnail = async (videoUri: string) => {
  const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
    time: 500, // 0.5s → fiable
  });

  const response = await fetch(uri);
  return await response.blob();
};

/* ============================================================
   CREATE POST
============================================================ */
export const createPost = async (payload: CreatePostPayload) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    // console.log("🟡 CREATE POST");

    /* ---------- UPLOAD MEDIA ---------- */
    const mediaResponse = await fetch(payload.mediaUri);
    const mediaBlob = await mediaResponse.blob();

    const mediaExt = payload.mediaType === "video" ? "mp4" : "jpg";
    const mediaFilename = `${Date.now()}.${mediaExt}`;
    const mediaPath = `posts/${user.uid}/${mediaFilename}`;
    const mediaRef = ref(storage, mediaPath);

    await uploadBytes(mediaRef, mediaBlob);
    const mediaUrl = await getDownloadURL(mediaRef);

    /* ---------- THUMBNAIL (VIDEO ONLY) ---------- */
    let thumbnailUrl: string | null = null;

    if (payload.mediaType === "video") {
      const thumbBlob = await generateVideoThumbnail(payload.mediaUri);
      const thumbPath = `posts/${user.uid}/thumb_${Date.now()}.jpg`;
      const thumbRef = ref(storage, thumbPath);

      await uploadBytes(thumbRef, thumbBlob);
      thumbnailUrl = await getDownloadURL(thumbRef);
    }

    /* ---------- FIRESTORE ---------- */
    const postRef = doc(collection(db, "posts"));

    const postDoc = {
      id: postRef.id,
      playerUid: user.uid,

      mediaUrl,
      mediaType: payload.mediaType,
      thumbnailUrl,

      description: payload.description,
      location: payload.location || null,

      postType: payload.postType,
      skills: payload.skills,
      visibility: payload.visibility,

      likeCount: 0,
      commentsCount: 0,

      createdAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    batch.set(postRef, postDoc);
    batch.set(
      doc(db, "joueurs", user.uid, "posts", postRef.id),
      postDoc
    );

    await batch.commit();

    // console.log("✅ POST CRÉÉ :", postRef.id);
    return postRef.id;
  } catch (e) {
    console.error("❌ createPost error:", e);
    throw e;
  }
};

/* ============================================================
   UPDATE POST
   - joueur → sync feed
============================================================ */
export const updatePost = async (
  postId: string,
  updates: UpdatePostPayload
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    // console.log("🟡 UPDATE POST :", postId);

    const cleanUpdates = {
      description: updates.description,
      location: updates.location || null,
      postType: updates.postType,
      skills: updates.skills,
      visibility: updates.visibility,
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    batch.update(
      doc(db, "joueurs", user.uid, "posts", postId),
      cleanUpdates
    );

    batch.update(
      doc(db, "posts", postId),
      cleanUpdates
    );

    await batch.commit();

    // console.log("✅ POST MIS À JOUR :", postId);
  } catch (e) {
    console.error("❌ updatePost error:", e);
    throw e;
  }
};

/* ============================================================
   DELETE POST
   - SUPPRESSION TOTALE
============================================================ */
export const deletePost = async (
  postId: string,
  mediaUrl?: string,
  thumbnailUrl?: string | null
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    // console.log("🟡 DELETE POST :", postId);

    const batch = writeBatch(db);

    batch.delete(doc(db, "posts", postId));
    batch.delete(doc(db, "joueurs", user.uid, "posts", postId));

    await batch.commit();

    // console.log("🧹 Firestore OK");

    if (mediaUrl) {
      await deleteObject(ref(storage, mediaUrl));
      // console.log("🧹 Media supprimé");
    }

    if (thumbnailUrl) {
      await deleteObject(ref(storage, thumbnailUrl));
      // console.log("🧹 Miniature supprimée");
    }

    // console.log("✅ POST SUPPRIMÉ PARTOUT :", postId);
  } catch (e) {
    console.error("❌ deletePost error:", e);
    throw e;
  }
};
