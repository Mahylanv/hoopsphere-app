// src/features/home/services/likeService.ts

import {
  doc,
  runTransaction,
  serverTimestamp,
  getFirestore,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

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

  const postRef = doc(db, "posts", postId);
  const postLikeRef = doc(db, "posts", postId, "likes", uid);
  const userLikeRef = doc(db, "joueurs", uid, "likedPosts", postId);

  await runTransaction(db, async (transaction) => {
    const postSnap = await transaction.get(postRef);
    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }

    const likeSnap = await transaction.get(postLikeRef);

    const currentLikeCount = postSnap.data().likeCount || 0;

    // ======================
    // UNLIKE
    // ======================
    if (likeSnap.exists()) {
      transaction.delete(postLikeRef);
      transaction.delete(userLikeRef);

      transaction.update(postRef, {
        likeCount: Math.max(currentLikeCount - 1, 0),
      });

      return;
    }

    // ======================
    // LIKE
    // ======================
    transaction.set(postLikeRef, {
      createdAt: serverTimestamp(),
    });

    transaction.set(userLikeRef, {
      postId,
      playerUid: postOwnerUid,
      createdAt: serverTimestamp(),
    });

    transaction.update(postRef, {
      likeCount: currentLikeCount + 1,
    });
  });
}
