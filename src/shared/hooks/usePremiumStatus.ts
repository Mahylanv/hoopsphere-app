import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

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

    setLoading(true);

    const functions = getFunctions(getApp());
    const refreshSubscription = async () => {
      try {
        const getSubscriptionInfo = httpsCallable(
          functions,
          "getSubscriptionInfo"
        );
        await getSubscriptionInfo({});
      } catch {
        // No-op: we keep cached Firestore data if sync fails.
      }
    };
    refreshSubscription();

    const joueurRef = doc(db, "joueurs", uid);
    const clubRef = doc(db, "clubs", uid);

    const handleValue = (playerPremium?: boolean, clubPremium?: boolean) => {
      setIsPremium(!!playerPremium || !!clubPremium);
      setLoading(false);
    };

    let lastPlayer: boolean | undefined;
    let lastClub: boolean | undefined;

    const unsubJoueur = onSnapshot(
      joueurRef,
      (snap) => {
        lastPlayer = !!snap.data()?.premium;
        handleValue(lastPlayer, lastClub);
      },
      () => {
        lastPlayer = false;
        handleValue(lastPlayer, lastClub);
      }
    );

    const unsubClub = onSnapshot(
      clubRef,
      (snap) => {
        lastClub = !!snap.data()?.premium;
        handleValue(lastPlayer, lastClub);
      },
      () => {
        lastClub = false;
        handleValue(lastPlayer, lastClub);
      }
    );

    return () => {
      unsubJoueur();
      unsubClub();
    };
  }, [uid]);

  return { isPremium, loading };
}
