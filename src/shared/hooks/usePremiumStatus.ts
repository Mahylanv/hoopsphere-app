import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "../../config/firebaseConfig";

export function usePremiumStatus() {
  const [uid, setUid] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    const ref = doc(db, "joueurs", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        setIsPremium(!!data?.premium);
        setLoading(false);
      },
      () => {
        setIsPremium(false);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { isPremium, loading };
}
