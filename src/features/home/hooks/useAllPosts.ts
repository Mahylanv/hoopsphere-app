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

export interface HomePost {
  id: string;
  url: string;
  playerUid: string;
  createdAt: any;
  avatar: string | null;
}

export default function useAllPosts() {
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const q = query(
          collection(db, "posts"),
          where("mediaType", "==", "video"),
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        const all = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();

            // 🔥 avatar joueur
            let avatar: string | null = null;
            if (data.playerUid) {
              const userSnap = await getDoc(doc(db, "joueurs", data.playerUid));
              avatar = userSnap.exists() ? userSnap.data().avatar : null;
            }

            return {
              id: d.id,
              url: data.mediaUrl,
              playerUid: data.playerUid,
              createdAt: data.createdAt,
              avatar,
            };
          })
        );

        setPosts(all);
      } catch (e) {
        console.log("❌ Erreur posts :", e);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  return { posts, loading };
}
