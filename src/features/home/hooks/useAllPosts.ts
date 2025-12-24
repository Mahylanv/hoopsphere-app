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
            if (data.playerUid) {
              const userSnap = await getDoc(
                doc(db, "joueurs", data.playerUid)
              );
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
              likeCount: data.likeCount ?? 0,
              isLikedByMe: false, // branchable plus tard
              thumbnailUrl: data.thumbnailUrl ?? null,
              description: data.description ?? null,
              location: data.location ?? null,
              skills: data.skills ?? [],
            };
          })
        );

        console.log("🔄 Feed HOME mis à jour :", all.length);
        setPosts(all);
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
