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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Asset } from "expo-asset";
import { db } from "../../../config/firebaseConfig";

/* ============================================================
   TYPES
============================================================ */
export interface HomePost {
  id: string;
  url: string;
  cachedUrl?: string | null;
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
export default function useAllPosts({ includeClubVisibility = false }: { includeClubVisibility?: boolean } = {}) {
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [isClub, setIsClub] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUid(user?.uid ?? null);
      setIsClub(false);

      if (user?.uid) {
        try {
          const clubSnap = await getDoc(doc(db, "clubs", user.uid));
          setIsClub(clubSnap.exists());
        } catch (e) {
          console.warn("⚠️ check isClub failed:", e);
          setIsClub(false);
        }
      }

      setAuthReady(true);
    });

    return () => unsub();
  }, [auth]);

  const prefetchTopVideos = async (list: HomePost[]) => {
    const MAX_PREFETCH = 4;
    const copy = [...list];
    await Promise.all(
      copy.slice(0, MAX_PREFETCH).map(async (p) => {
        try {
          const asset = await Asset.fromURI(p.url);
          await asset.downloadAsync();
          p.cachedUrl = asset.localUri ?? asset.uri ?? p.url;
        } catch (e) {
          console.log("⚠️ Prefetch vidéo échoué :", e);
          p.cachedUrl = p.url;
        }
      })
    );
    return copy;
  };

  useEffect(() => {
    if (includeClubVisibility && !authReady) return;

    console.log("👂 Écoute temps réel des posts HOME");

    const constraints: any[] = [where("mediaType", "==", "video")];

    if (includeClubVisibility && isClub) {
      constraints.push(where("visibility", "in", ["public", "clubs"]));
    } else {
      constraints.push(where("visibility", "==", "public"));
    }

    constraints.push(orderBy("createdAt", "desc"));

    const q = query(collection(db, "posts"), ...constraints);

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

        // Prefetch des premières vidéos pour démarrage immédiat
        const withCache = await prefetchTopVideos(sorted);

        console.log("🔄 Feed HOME mis à jour :", sorted.length);
        setPosts(withCache);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Erreur listener posts HOME :", error);
        setLoading(false);
      }
    );

    // 🔥 cleanup obligatoire
    return () => unsubscribe();
  }, [includeClubVisibility, isClub, authReady, uid]);

  return { posts, loading };
}
