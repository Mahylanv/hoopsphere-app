// src/hooks/useAllVideos.ts

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

export default function useAllVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const col = collection(db, "gallery");
        const snap = await getDocs(col);

        const all = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();

            // 🔥 On va chercher l’avatar du joueur
            let avatar = null;

            if (data.playerUid && typeof data.playerUid === "string") {
              const ref = doc(db, "joueurs", data.playerUid);
              const userSnap = await getDoc(ref);
              avatar = userSnap.exists() ? userSnap.data().avatar : null;
            }            

            return {
              id: d.id,
              url: data.url,
              type: data.type,
              playerUid: data.playerUid,
              createdAt: data.createdAt,
              avatar, // 🔥 ajouté ici
            };
          })
        );

        setVideos(all.filter((v) => v.type === "video"));
      } catch (e) {
        console.log("Erreur vidéos :", e);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  return { videos, loading };
}
