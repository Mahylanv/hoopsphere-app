// src/features/home/hooks/useAllPosts.ts

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

/* ============================================================
   TYPES
============================================================ */
export interface HomePost {
  id: string;
  url: string;
  playerUid: string;
  createdAt: any;
  avatar: string | null;

  // ➕ requis par VideoCarouselPreview
  likeCount: number;
  isLikedByMe: boolean;
  thumbnailUrl?: string | null;
}

/* ============================================================
   HOOK
============================================================ */
export default function useAllPosts() {
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        console.log("📥 Chargement des posts HOME");

        const q = query(
          collection(db, "posts"),
          where("mediaType", "==", "video"),
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        const all: HomePost[] = await Promise.all(
          snap.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // 🔥 avatar joueur
            let avatar: string | null = null;
            if (data.playerUid) {
              const userSnap = await getDoc(doc(db, "joueurs", data.playerUid));
              avatar = userSnap.exists()
                ? (userSnap.data().avatar ?? null)
                : null;
            }

            return {
              id: docSnap.id,
              url: data.mediaUrl,
              playerUid: data.playerUid,
              createdAt: data.createdAt,
              avatar,

              // ✅ champs requis par VideoCarouselPreview
              likeCount: data.likesCount ?? 0,
              isLikedByMe: false, // à brancher plus tard
              thumbnailUrl: data.thumbnailUrl ?? null,
            };
          })
        );

        console.log("✅ Posts HOME chargés :", all.length);
        setPosts(all);
      } catch (e) {
        console.error("❌ Erreur posts HOME :", e);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  return { posts, loading };
}
