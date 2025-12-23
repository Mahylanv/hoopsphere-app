import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../../config/firebaseConfig";

/* ============================================================
   TYPES
============================================================ */
export type PlayerPost = {
  id: string;
  playerUid: string;

  mediaUrl: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string | null; // ✅ MINIATURE VIDÉO

  description: string;
  location?: string | null;

  postType: "highlight" | "match" | "training";
  skills: string[];
  visibility: "public" | "private";

  createdAt: Timestamp;
  likesCount: number;
  commentsCount: number;
};

/* ============================================================
   HOOK
============================================================ */
export default function usePlayerPosts(playerUid?: string) {
  const [posts, setPosts] = useState<PlayerPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerUid) {
      setPosts([]);
      setLoading(false);
      return;
    }

    console.log("📥 Chargement posts joueur :", playerUid);

    const q = query(
      collection(db, "joueurs", playerUid, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: PlayerPost[] = snapshot.docs.map((doc) => {
          const d = doc.data();

          return {
            id: doc.id,
            playerUid: d.playerUid,

            mediaUrl: d.mediaUrl,
            mediaType: d.mediaType,
            thumbnailUrl: d.thumbnailUrl ?? null, // ✅ IMPORTANT

            description: d.description,
            location: d.location ?? null,

            postType: d.postType,
            skills: d.skills ?? [],
            visibility: d.visibility,

            createdAt: d.createdAt,
            likesCount: d.likesCount ?? 0,
            commentsCount: d.commentsCount ?? 0,
          };
        });

        console.log("✅ Posts profil reçus :", data.length);
        setPosts(data);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Erreur récupération posts profil :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [playerUid]);

  return {
    posts,
    loading,
  };
}
