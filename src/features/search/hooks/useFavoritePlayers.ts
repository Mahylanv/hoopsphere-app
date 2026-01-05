// src/hooks/search/useFavoritePlayers.ts

import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../../../config/firebaseConfig";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

/* ============================================================
   HOOK — FAVORITE PLAYERS (par CLUB)
============================================================ */
export function useFavoritePlayers(enabled = true) {
  const [clubUid, setClubUid] = useState<string | null>(null);
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  const favoritesCount = favoritePlayerIds.size;

  /* ============================
     AUTH (club connecté)
  ============================ */
  useEffect(() => {
    if (!enabled) {
      setClubUid(null);
      setFavoritePlayerIds(new Set());
      setLoading(false);
      return;
    }

    const unsub = auth.onAuthStateChanged((user) => {
      setClubUid(user?.uid ?? null);
    });

    return () => unsub();
  }, [enabled]);

  /* ============================
     SNAPSHOT FAVORIS
  ============================ */
  useEffect(() => {
    if (!enabled || !clubUid) {
      setFavoritePlayerIds(new Set());
      setLoading(false);
      return;
    }

    const ref = collection(db, "clubs", clubUid, "favoritePlayers");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const set = new Set<string>();
        snap.forEach((doc) => set.add(doc.id));
        setFavoritePlayerIds(set);
        setLoading(false);
      },
      (err) => {
        console.error("❌ Erreur snapshot favoritePlayers:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [clubUid, enabled]);

  /* ============================
     HELPERS
  ============================ */
  const isFavorite = useCallback(
    (playerUid: string) => favoritePlayerIds.has(playerUid),
    [favoritePlayerIds]
  );

  const addFavorite = useCallback(
    async (playerUid: string) => {
      if (!enabled || !clubUid) return;

      await setDoc(doc(db, "clubs", clubUid, "favoritePlayers", playerUid), {
        createdAt: serverTimestamp(),
      });
    },
    [clubUid]
  );

  const removeFavorite = useCallback(
    async (playerUid: string) => {
      if (!clubUid) return;

      await deleteDoc(doc(db, "clubs", clubUid, "favoritePlayers", playerUid));
    },
    [clubUid]
  );

  const toggleFavorite = useCallback(
    async (playerUid: string) => {
      if (!enabled || !clubUid) return;

      if (favoritePlayerIds.has(playerUid)) {
        await removeFavorite(playerUid);
      } else {
        await addFavorite(playerUid);
      }
    },
    [clubUid, favoritePlayerIds, addFavorite, removeFavorite, enabled]
  );

  const clearAllFavorites = useCallback(async () => {
    if (!enabled || !clubUid) return;

    const ids = Array.from(favoritePlayerIds);

    for (const playerUid of ids) {
      try {
        await deleteDoc(
          doc(db, "clubs", clubUid, "favoritePlayers", playerUid)
        );
      } catch (e) {
        console.error("❌ Erreur suppression favori joueur:", playerUid, e);
      }
    }
  }, [clubUid, favoritePlayerIds, enabled]);

  return {
    loading,
    favoritePlayerIds,
    favoritesCount,
    isFavorite,
    toggleFavorite,
    clearAllFavorites,
  };
}
