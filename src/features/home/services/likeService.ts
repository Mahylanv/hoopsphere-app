// src/features/home/services/likeService.ts

import {
  doc,
  runTransaction,
  serverTimestamp,
  getFirestore,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { increment } from "firebase/firestore";

const db = getFirestore();
const auth = getAuth();

/**
 * Like / Unlike un post
 * - sync posts/{postId}
 * - sync posts/{postId}/likes/{uid}
 * - sync joueurs/{uid}/likedPosts/{postId}
 */
export async function toggleLikePost(postId: string, postOwnerUid: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const uid = user.uid;

  const isClub = (await getDoc(doc(db, "clubs", uid))).exists();
  const userLikeRef = isClub
    ? doc(db, "clubs", uid, "likedPosts", postId)
    : doc(db, "joueurs", uid, "likedPosts", postId);

  const postRef = doc(db, "posts", postId);
  const postLikeRef = doc(db, "posts", postId, "likes", uid);

  await runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(postLikeRef);

    // ======================
    // UNLIKE
    // ======================
    if (likeSnap.exists()) {
      transaction.delete(postLikeRef);
      transaction.delete(userLikeRef);

      transaction.update(postRef, { likeCount: increment(-1) });

      return;
    }

    // ======================
    // LIKE
    // ======================
    transaction.set(postLikeRef, {
      createdAt: serverTimestamp(),
      postId,
      postOwnerUid,
      likerUid: uid,
    });

    transaction.set(userLikeRef, {
      postId,
      playerUid: postOwnerUid,
      createdAt: serverTimestamp(),
    });

    transaction.update(postRef, { likeCount: increment(1) });
  });
}
