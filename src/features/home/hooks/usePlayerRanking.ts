// src/hooks/usePlayerRanking.ts

import { useEffect, useRef, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import {
  computePlayerStats,
  PlayerAverages,
} from "../../../utils/player/computePlayerStats";
import { computePlayerRating } from "../../../utils/player/computePlayerRating";

// 🎯 Type complet pour RankingPlayer → compatible avec JoueurCard
export type RankingPlayer = {
  uid: string;
  prenom: string;
  nom: string;
  avatar: string;
  poste: string;

  // Champs ajoutés pour correspondre au type Joueur
  email: string;
  dob: string;
  taille: string;
  poids: string;
  main: string;
  departement: string;
  club: string;
  genre: string;
  createdAt: any | null;
  premium: boolean;
  cardStyle?: "normal" | "premium";

  // Stats & notes
  stats: PlayerAverages;
  rating: number;
};

export default function usePlayerRanking() {
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const playersRef = collection(db, "joueurs");

    const unsubscribe = onSnapshot(playersRef, (playersSnap) => {
      const requestId = ++requestIdRef.current;

      const loadRanking = async () => {
        try {
          const premiumDocs = playersSnap.docs.filter(
            (playerDoc) => !!playerDoc.data()?.premium
          );

          const allPlayers = await Promise.all(
            premiumDocs.map(async (playerDoc) => {
              const uid = playerDoc.id;
              const playerData = playerDoc.data();

              // Charger les matchs du joueur
              const matchesSnap = await getDocs(
                collection(db, "joueurs", uid, "matches")
              );

              const matches = matchesSnap.docs.map((m) => {
                const d = m.data();
                return {
                  points: d.points ?? 0,
                  threes: d.threes ?? 0,
                  two_int: d.two_int ?? 0,
                  two_ext: d.two_ext ?? 0,
                  ft_made: d.ft_made ?? 0,
                  fouls_committed: d.fouls_committed ?? 0,
                };
              });

              const averages = computePlayerStats(matches);
              const rating = computePlayerRating(averages, playerData.poste);

              return {
                uid,
                prenom: playerData.prenom ?? "",
                nom: playerData.nom ?? "",
                avatar:
                  playerData.avatar && playerData.avatar.trim() !== ""
                    ? playerData.avatar
                    : "https://via.placeholder.com/200.png",

                poste: playerData.poste ?? "",
                premium: !!playerData.premium,
                cardStyle: playerData.cardStyle ?? "normal",

                // Champs nécessaires pour JoueurCard
                email: playerData.email ?? "",
                dob: playerData.dob ?? "",
                taille: playerData.taille ?? "",
                poids: playerData.poids ?? "",
                main: playerData.main ?? "",
                departement: playerData.departement ?? "",
                club: playerData.club ?? "",
                genre: playerData.genre ?? "",
                createdAt: playerData.createdAt ?? null,

                stats: averages,
                rating,
              } as RankingPlayer;
            })
          );

          // Classement : priorité rating → puis points
          allPlayers.sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.stats.pts - a.stats.pts;
          });

          if (isMounted && requestId === requestIdRef.current) {
            setRanking(allPlayers);
          }
        } catch (err) {
          console.error("Erreur chargement classement :", err);
          if (isMounted && requestId === requestIdRef.current) {
            setRanking([]);
          }
        } finally {
          if (isMounted && !initialLoadRef.current) {
            setLoading(false);
            initialLoadRef.current = true;
          }
        }
      };

      loadRanking();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { ranking, loading };
}
