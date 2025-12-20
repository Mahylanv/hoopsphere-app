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

export function useFavoriteClubs() {
  const [favoriteClubIds, setFavoriteClubIds] = useState<Set<string>>(new Set());
  const [uid, setUid] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<FavoriteSort>("recent");

  /* ============================
     AUTH
  ============================ */
  useEffect(() => {
    console.log("🔐 useFavoriteClubs mounted");

    const unsub = auth.onAuthStateChanged((user) => {
      console.log("👤 Auth state changed:", user?.uid);
      setUid(user?.uid ?? null);
    });

    return () => unsub();
  }, []);

  /* ============================
     FAVORITES SNAPSHOT
  ============================ */
  useEffect(() => {
    if (!uid) {
      console.log("⛔ Pas de uid → reset favoris");
      setFavoriteClubIds(new Set());
      return;
    }

    console.log("📡 Abonnement aux favoris pour uid =", uid);

    const ref = collection(db, "joueurs", uid, "favoriteClubs");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        console.log("📥 Snapshot favoris reçu, size =", snap.size);

        const set = new Set<string>();
        snap.forEach((doc) => {
          console.log("⭐ Favori trouvé:", doc.id);
          set.add(doc.id);
        });

        setFavoriteClubIds(set);
      },
      (error) => {
        console.error("❌ Erreur snapshot favoris:", error);
      }
    );

    return () => {
      console.log("🧹 Unsubscribe favoris");
      unsub();
    };
  }, [uid]);

  /* ============================
     HELPERS
  ============================ */
  const isFavorite = useCallback(
    (clubUid: string) => favoriteClubIds.has(clubUid),
    [favoriteClubIds]
  );

  const toggleFavorite = useCallback(
    async (clubUid: string) => {
      console.log("🔁 toggleFavorite:", clubUid);

      if (!uid) {
        console.log("⛔ toggleFavorite annulé (uid null)");
        return;
      }

      if (favoriteClubIds.has(clubUid)) {
        console.log("🗑 removeFavoriteClub:", clubUid);
        await removeFavoriteClub(uid, clubUid);
      } else {
        console.log("➕ addFavoriteClub:", clubUid);
        await addFavoriteClub(uid, clubUid);
      }
    },
    [favoriteClubIds, uid]
  );

  /* ============================
     CLEAR ALL
  ============================ */
  const clearAllFavorites = useCallback(async () => {
    console.log("🧨 clearAllFavorites appelé");

    if (!uid) {
      console.log("⛔ uid null → abandon");
      return;
    }

    const ids = Array.from(favoriteClubIds);
    console.log("🗑 Favoris à supprimer (snapshot):", ids);

    for (const clubId of ids) {
      try {
        console.log("➡ suppression:", clubId);
        await removeFavoriteClub(uid, clubId);
      } catch (e) {
        console.error("❌ Erreur suppression:", clubId, e);
      }
    }

    console.log("✅ Tous les favoris supprimés");
  }, [favoriteClubIds, uid]);

  return {
    favoriteClubIds,
    isFavorite,
    toggleFavorite,
    clearAllFavorites,
  };
}
