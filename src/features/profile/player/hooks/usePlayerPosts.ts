// src/Profil/Joueur/hooks/usePlayerPosts.ts

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
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
  description: string;
  location?: string | null;
  postType: "highlight" | "match" | "training";
  skills: string[];
  visibility: "public" | "private";
  createdAt: any;
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

    console.log("📥 Chargement des posts PROFIL joueur :", playerUid);

    const q = query(
      collection(db, "joueurs", playerUid, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: PlayerPost[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<PlayerPost, "id">),
        }));

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
