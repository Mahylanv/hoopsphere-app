// src/features/home/hooks/useAllPosts.ts

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
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
  likeCount: number;
  isLikedByMe: boolean;
  premium: boolean;
  thumbnailUrl?: string | null;
  description?: string | null;
  location?: string | null;
  skills?: string[] | null;
}

/* ============================================================
   HOOK
============================================================ */
export default function useAllPosts() {
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    console.log("👂 Écoute temps réel des posts HOME");

    const q = query(
      collection(db, "posts"),
      where("mediaType", "==", "video"),
      where("visibility", "==", "public"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const all: HomePost[] = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // 🔥 avatar joueur
            let avatar: string | null = null;
            let premium = false;
            if (data.playerUid) {
              const userSnap = await getDoc(
                doc(db, "joueurs", data.playerUid)
              );
              if (userSnap.exists()) {
                const uData = userSnap.data();
                avatar = uData.avatar ?? null;
                premium = !!uData.premium;
              }
            }

            // ❤️ est-ce que moi j'ai liké ce post ?
            let isLikedByMe = false;
            if (uid) {
              const likeSnap = await getDoc(
                doc(db, "posts", docSnap.id, "likes", uid)
              );
              isLikedByMe = likeSnap.exists();
            }

            return {
              id: docSnap.id,
              url: data.mediaUrl,
              playerUid: data.playerUid,
              createdAt: data.createdAt,
              avatar,
              likeCount: data.likeCount ?? 0,
              // isLikedByMe: false, // branchable plus tard
              premium,
              isLikedByMe,
              thumbnailUrl: data.thumbnailUrl ?? null,
              description: data.description ?? null,
              location: data.location ?? null,
              skills: data.skills ?? [],
            };
          })
        );

        const getTime = (d: any) => {
          if (!d) return 0;
          if (typeof d.toMillis === "function") return d.toMillis();
          const t = new Date(d).getTime();
          return Number.isFinite(t) ? t : 0;
        };

        // Premium d'abord, puis date desc
        const sorted = [...all].sort((a, b) => {
          if (a.premium !== b.premium) return b.premium ? 1 : -1;
          return getTime(b.createdAt) - getTime(a.createdAt);
        });

        console.log("🔄 Feed HOME mis à jour :", sorted.length);
        setPosts(sorted);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Erreur listener posts HOME :", error);
        setLoading(false);
      }
    );

    // 🔥 cleanup obligatoire
    return () => unsubscribe();
  }, []);

  return { posts, loading };
}
