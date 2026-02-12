import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../../config/firebaseConfig";

/* ============================================================
   TYPES
============================================================ */
export type PlayerPost = {
  id: string;
  playerUid: string;

  mediaUrl: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string | null; //  MINIATURE VIDÉO

  // cache local éventuel (préfet chage vidéo)
  cachedUrl?: string | null;

  description: string;
  location?: string | null;
  createdBy?: string;

  postType: "highlight" | "match" | "training";
  skills: string[];
  visibility: "public" | "private" | "clubs";
  mediaFit?: "cover" | "contain";

  createdAt: Timestamp;
  likeCount: number;
  commentsCount: number;
};

/* ============================================================
   HOOK
============================================================ */
export default function usePlayerPosts(playerUid?: string) {
  const [posts, setPosts] = useState<PlayerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    if (!playerUid) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // 🔽 requête Firestore ici
  }, [playerUid]);

  useEffect(() => {
    if (!playerUid) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const currentUid = auth.currentUser?.uid;
    const isOwner = currentUid === playerUid;

    const constraints = [
      where("playerUid", "==", playerUid),
      orderBy("createdAt", "desc"),
    ];

    if (!isOwner) {
      constraints.push(where("visibility", "==", "public"));
    }

    const q = query(collection(db, "posts"), ...constraints);

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
            thumbnailUrl: d.thumbnailUrl ?? null, //  IMPORTANT

            description: d.description ?? null,
            location: d.location ?? null,

            postType: d.postType,
            skills: d.skills ?? [],
            visibility: d.visibility,
            mediaFit: d.mediaFit ?? "cover",

            createdAt: d.createdAt,
            likeCount: d.likeCount ?? 0,
            commentsCount: d.commentsCount ?? 0,
          };
        });

        setPosts(data);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur récupération posts profil :", error);
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
