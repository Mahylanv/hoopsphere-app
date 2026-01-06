import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../../../config/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import {
  addFavoriteClub,
  removeFavoriteClub,
} from "../../../shared/services/favoriteService";

type FavoriteSort =
  | "recent"
  | "name_asc"
  | "department"
  | "categories_count";

export function useFavoriteClubs(enabled = true) {
  const [favoriteClubIds, setFavoriteClubIds] = useState<Set<string>>(new Set());
  const [uid, setUid] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<FavoriteSort>("recent");

  /* ============================
     AUTH
  ============================ */
  useEffect(() => {
    if (!enabled) {
      setUid(null);
      setFavoriteClubIds(new Set());
      return;
    }

    const unsub = auth.onAuthStateChanged((user) => {
      setUid(user?.uid ?? null);
    });

    return () => unsub();
  }, [enabled]);

  /* ============================
     FAVORITES SNAPSHOT
  ============================ */
  useEffect(() => {
    if (!enabled || !uid) {
      setFavoriteClubIds(new Set());
      return;
    }

    const ref = collection(db, "joueurs", uid, "favoriteClubs");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const set = new Set<string>();
        snap.forEach((doc) => {
          set.add(doc.id);
        });

        setFavoriteClubIds(set);
      },
      (error) => {
        console.error("Erreur snapshot favoris:", error);
      }
    );

    return () => unsub();
  }, [uid, enabled]);

  /* ============================
     HELPERS
  ============================ */
  const isFavorite = useCallback(
    (clubUid: string) => favoriteClubIds.has(clubUid),
    [favoriteClubIds]
  );

  const toggleFavorite = useCallback(
    async (clubUid: string) => {
      if (!enabled || !uid) {
        return;
      }

      if (favoriteClubIds.has(clubUid)) {
        await removeFavoriteClub(uid, clubUid);
      } else {
        await addFavoriteClub(uid, clubUid);
      }
    },
    [favoriteClubIds, uid, enabled]
  );

  /* ============================
     CLEAR ALL
  ============================ */
  const clearAllFavorites = useCallback(async () => {
    if (!enabled || !uid) {
      return;
    }

    const ids = Array.from(favoriteClubIds);
    for (const clubId of ids) {
      try {
        await removeFavoriteClub(uid, clubId);
      } catch (e) {
        console.error("Erreur suppression:", clubId, e);
      }
    }
  }, [favoriteClubIds, uid, enabled]);

  return {
    favoriteClubIds,
    isFavorite,
    toggleFavorite,
    clearAllFavorites,
  };
}
