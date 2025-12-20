// src/hooks/useClubs.ts

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

export type FirestoreClub = {
  id: string;
  name: string;
  logo?: string;
  city?: string;
  categories?: string[];
};

export function useClubs() {
  const [clubs, setClubs] = useState<FirestoreClub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("📡 Abonnement clubs");

    const q = query(collection(db, "clubs"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: FirestoreClub[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<FirestoreClub, "id">),
        }));

        console.log("🏀 Clubs reçus:", data.length);
        setClubs(data);
        setLoading(false);
      },
      (error) => {
        console.error("🔥 Erreur Firestore clubs:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { clubs, loading };
}
