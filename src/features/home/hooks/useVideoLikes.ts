import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../config/firebaseConfig";
import { toggleLikePost } from "../services/likeService";

/* ============================================================
   TYPES
============================================================ */
export type VideoItem = {
  id: string;
  url: string;
  playerUid: string;
  avatar?: string | null;
  likeCount: number;
  isLikedByMe: boolean;
  description?: string;
  location?: string | null;
  createdAt?: any;
};

/* ============================================================
   HOOK
============================================================ */
export function useVideoLikes(
  videos: VideoItem[],
  setVideos: React.Dispatch<React.SetStateAction<VideoItem[]>>
) {
  const auth = getAuth();

  /* ============================================================
     REALTIME SYNC
     🔥 Firestore = SOURCE DE VÉRITÉ UNIQUE
  ============================================================ */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || videos.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    videos.forEach((video) => {
      const postRef = doc(db, "posts", video.id);
      const likeRef = doc(db, "posts", video.id, "likes", user.uid);

      // 🔢 likeCount → Firestore UNIQUEMENT
      unsubscribes.push(
        onSnapshot(postRef, (snap) => {
          if (!snap.exists()) return;

          const likeCount = snap.data().likeCount ?? 0;

          setVideos((prev) =>
            prev.map((v) => (v.id === video.id ? { ...v, likeCount } : v))
          );
        })
      );

      // ❤️ isLikedByMe → Firestore UNIQUEMENT
      unsubscribes.push(
        onSnapshot(likeRef, (snap) => {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id ? { ...v, isLikedByMe: snap.exists() } : v
            )
          );
        })
      );
    });

    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [videos.map((v) => v.id).join("|")]);

  /* ============================================================
     ACTION : TOGGLE LIKE
     ⚡ Optimistic UNIQUEMENT sur isLikedByMe
  ============================================================ */
  const toggleLike = async (index: number) => {
    const video = videos[index];
    if (!video) return;

    // ⚡ UI immédiate (SANS toucher likeCount)
    setVideos((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, isLikedByMe: !v.isLikedByMe } : v
      )
    );

    // 🔥 Firestore (vérité finale)
    try {
      await toggleLikePost(video.id, video.playerUid);
    } catch (e) {
      console.error("❌ toggleLikePost error:", e);
    }
  };

  return {
    toggleLike,
  };
}
