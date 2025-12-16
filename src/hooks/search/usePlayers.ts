// src/hooks/usePlayers.ts

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import type { Joueur } from "../../types";

export function usePlayers() {
  const [players, setPlayers] = useState<Joueur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("📡 Abonnement joueurs");

    const q = query(
      collection(db, "joueurs"),
      orderBy("nom")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Joueur[] = snap.docs.map((doc) => ({
          uid: doc.id,
          ...(doc.data() as Omit<Joueur, "uid">),
        }));

        console.log("👤 Joueurs reçus:", list.length);
        setPlayers(list);
        setLoading(false);
      },
      (err) => {
        console.error("❌ Erreur Firestore joueurs:", err);
        setError("Impossible de charger les joueurs");
        setLoading(false);
      }
    );

    return () => {
      console.log("🧹 Unsubscribe joueurs");
      unsub();
    };
  }, []);

  return {
    players,
    loading,
    error,
  };
}
