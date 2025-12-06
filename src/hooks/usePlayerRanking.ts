// src/hooks/usePlayerRanking.ts
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { computePlayerStats } from "../utils/computePlayerStats";
import { computePlayerRating } from "../utils/computePlayerRating";

export type RankingPlayer = {
  uid: string;
  prenom: string;
  nom: string;
  avatar: string;
  poste: string;
  stats: any;
  rating: number;
};

export default function usePlayerRanking() {
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRanking = async () => {
      try {
        const playersSnap = await getDocs(collection(db, "joueurs"));
        const allPlayers: RankingPlayer[] = [];

        for (const playerDoc of playersSnap.docs) {
          const uid = playerDoc.id;
          const playerData = playerDoc.data();

          // Charger les matchs du joueur
          const matchesSnap = await getDocs(
            collection(db, "joueurs", uid, "matches")
          );

          const matches = matchesSnap.docs.map((m) => {
            const d = m.data();
            return {
              points: d.points || 0,
              threes: d.threes || 0,
              two_int: d.two_int || 0,
              two_ext: d.two_ext || 0,
              ft_made: d.ft_made || 0,
              fouls_committed: d.fouls_committed || 0,
            };
          });

          // ⚠️ FUTURE VERSION :
          // Ici on pourra filtrer les matchs des 7 derniers jours :
          // matches = matches.filter(m => m.parsedAt.toDate() >= (now - 7 jours))

          const averages = computePlayerStats(matches);
          const rating = computePlayerRating(averages, playerData.poste);

          allPlayers.push({
            uid,
            prenom: playerData.prenom,
            nom: playerData.nom,
            avatar: playerData.avatar,
            poste: playerData.poste,
            stats: averages,
            rating,
          });
        }

        // Trier par rating décroissant
        allPlayers.sort((a, b) => {
          // 1️⃣ Priorité : rating
          if (b.rating !== a.rating) return b.rating - a.rating;

          // 2️⃣ Si égalité : moyenne de points
          return b.stats.pts - a.stats.pts;
        });

        setRanking(allPlayers);
      } catch (err) {
        console.error("Erreur chargement classement :", err);
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, []);

  return { ranking, loading };
}
