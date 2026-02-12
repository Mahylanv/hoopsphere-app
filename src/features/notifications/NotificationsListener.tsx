import React from "react";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  Query,
  DocumentData,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { useAuth } from "../auth/context/AuthContext";
import { useToast } from "../../shared/components/ToastProvider";
import { registerPushTokenForUser } from "../../utils/push/registerPushToken";

const PREMIUM_REQUIRED = {
  profileViews: true,
  favoriteClubOffer: true,
  candidatureStatus: true,
  favoritePlayerPost: true,
  favoritePlayerMatch: true,
  candidatureOnOffer: true,
};

function getClubName(data: any) {
  return (
    data?.nom?.toString().trim() ||
    data?.name?.toString().trim() ||
    "Club"
  );
}

function getPlayerName(data: any) {
  const firstName = (data?.prenom || "").toString().trim();
  const lastName = (data?.nom || "").toString().trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || firstName || lastName || "Joueur";
}

function usePremiumStatus(uid: string | null, userType: string | null) {
  const [isPremium, setIsPremium] = React.useState(false);

  React.useEffect(() => {
    if (!uid || !userType) {
      setIsPremium(false);
      return;
    }

    const ref = doc(db, userType === "club" ? "clubs" : "joueurs", uid);
    return onSnapshot(ref, (snap) => {
      const data = snap.data() as any;
      const premium = !!(data?.premium ?? data?.isPremium);
      setIsPremium(premium);
    });
  }, [uid, userType]);

  return isPremium;
}

function useFavoriteClubs(uid: string | null) {
  const [clubIds, setClubIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!uid) {
      setClubIds([]);
      return;
    }

    const ref = collection(db, "joueurs", uid, "favoriteClubs");
    return onSnapshot(ref, (snap) => {
      const ids = snap.docs.map((d) => d.id);
      setClubIds(ids);
    });
  }, [uid]);

  return clubIds;
}

function useFavoritePlayers(uid: string | null) {
  const [playerIds, setPlayerIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!uid) {
      setPlayerIds([]);
      return;
    }

    const ref = collection(db, "clubs", uid, "favoritePlayers");
    return onSnapshot(ref, (snap) => {
      const ids = snap.docs.map((d) => d.id);
      setPlayerIds(ids);
    });
  }, [uid]);

  return playerIds;
}

function useSkipInitialSnapshot<T extends DocumentData>(
  q: Query<T> | null,
  onAdded: (doc: T, id: string) => void
) {
  React.useEffect(() => {
    if (!q) return;

    let initial = true;

    const unsub = onSnapshot(q, (snap) => {
      if (initial) {
        initial = false;
        return;
      }

      snap.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        onAdded(change.doc.data() as T, change.doc.id);
      });
    });

    return () => unsub();
  }, [q, onAdded]);
}

export default function NotificationsListener() {
  const { user, userType } = useAuth();
  const { showToast } = useToast();
  const uid = user?.uid ?? null;
  const isPremium = usePremiumStatus(uid, userType);
  const favoriteClubIds = useFavoriteClubs(userType === "joueur" ? uid : null);
  const favoritePlayerIds = useFavoritePlayers(userType === "club" ? uid : null);

  const clubNameCache = React.useRef<Record<string, string>>({});
  const playerNameCache = React.useRef<Record<string, string>>({});

  const fetchClubName = React.useCallback(async (clubUid: string) => {
    if (clubNameCache.current[clubUid]) return clubNameCache.current[clubUid];
    try {
      const snap = await getDoc(doc(db, "clubs", clubUid));
      if (snap.exists()) {
        const name = getClubName(snap.data());
        clubNameCache.current[clubUid] = name;
        return name;
      }
    } catch {
      // ignore
    }
    return "Club";
  }, []);

  const fetchPlayerName = React.useCallback(async (playerUid: string) => {
    if (playerNameCache.current[playerUid]) return playerNameCache.current[playerUid];
    try {
      const snap = await getDoc(doc(db, "joueurs", playerUid));
      if (snap.exists()) {
        const name = getPlayerName(snap.data());
        playerNameCache.current[playerUid] = name;
        return name;
      }
    } catch {
      // ignore
    }
    return "Joueur";
  }, []);

  React.useEffect(() => {
    if (!uid || !userType) return;
    registerPushTokenForUser(userType).catch(() => {
      // ignore
    });
  }, [uid, userType]);

  // =========================
  // JOUEUR — likes sur ses vidéos
  // =========================
  useSkipInitialSnapshot(
    uid && userType === "joueur"
      ? query(
          collectionGroup(db, "likes"),
          where("postOwnerUid", "==", uid),
          orderBy("createdAt", "desc")
        )
      : null,
    () => {
      showToast({
        title: "Nouveau like",
        message: "Quelqu'un a aimé votre vidéo.",
      });
    }
  );

  // =========================
  // JOUEUR — vues de profil (premium)
  // =========================
  useSkipInitialSnapshot(
    uid && userType === "joueur" && isPremium && PREMIUM_REQUIRED.profileViews
      ? query(collection(db, "joueurs", uid, "views"))
      : null,
    () => {
      showToast({
        title: "Nouvelle visite",
        message: "Quelqu'un a consulté votre profil.",
      });
    }
  );

  // =========================
  // JOUEUR — nouvelles offres des clubs favoris (premium)
  // =========================
  React.useEffect(() => {
    if (!uid || userType !== "joueur" || !isPremium || !PREMIUM_REQUIRED.favoriteClubOffer) return;
    if (favoriteClubIds.length === 0) return;

    const unsubs = favoriteClubIds.map((clubUid) => {
      const offersRef = collection(db, "clubs", clubUid, "offres");
      const q = query(offersRef, orderBy("createdAt", "desc"));
      let initial = true;
      return onSnapshot(q, (snap) => {
        if (initial) {
          initial = false;
          return;
        }
        snap.docChanges().forEach(async (change) => {
          if (change.type !== "added") return;
          const clubName = await fetchClubName(clubUid);
          showToast({
            title: "Nouvelle offre",
            message: `${clubName} a publié une nouvelle offre.`,
          });
        });
      });
    });

    return () => unsubs.forEach((u) => u());
  }, [uid, userType, isPremium, favoriteClubIds.join("|")]);

  // =========================
  // JOUEUR — candidature acceptée/refusée (premium)
  // =========================
  React.useEffect(() => {
    if (!uid || userType !== "joueur" || !isPremium || !PREMIUM_REQUIRED.candidatureStatus) return;

    const q = query(
      collectionGroup(db, "candidatures"),
      where("applicantUid", "==", uid)
    );

    const statusMap = new Map<string, string>();
    let initial = true;

    const unsub = onSnapshot(q, (snap) => {
      if (initial) {
        initial = false;
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if (data?.status) statusMap.set(d.id, data.status);
        });
        return;
      }

      snap.docChanges().forEach((change) => {
        const data = change.doc.data() as any;
        const nextStatus = data?.status as string | undefined;
        if (!nextStatus) return;

        const prevStatus = statusMap.get(change.doc.id);
        if (prevStatus === nextStatus) return;

        statusMap.set(change.doc.id, nextStatus);

        if (nextStatus === "accepted") {
          showToast({
            title: "Candidature acceptée",
            message: "Bonne nouvelle, votre candidature a été acceptée.",
          });
        }

        if (nextStatus === "rejected") {
          showToast({
            title: "Candidature refusée",
            message: "Votre candidature a été refusée.",
          });
        }
      });
    });

    return () => unsub();
  }, [uid, userType, isPremium]);

  // =========================
  // CLUB — vues de profil (premium)
  // =========================
  useSkipInitialSnapshot(
    uid && userType === "club" && isPremium && PREMIUM_REQUIRED.profileViews
      ? query(collection(db, "clubs", uid, "views"))
      : null,
    () => {
      showToast({
        title: "Nouvelle visite",
        message: "Quelqu'un a consulté votre profil club.",
      });
    }
  );

  // =========================
  // CLUB — nouvelles candidatures (premium)
  // =========================
  useSkipInitialSnapshot(
    uid && userType === "club" && isPremium && PREMIUM_REQUIRED.candidatureOnOffer
      ? query(collectionGroup(db, "candidatures"), where("clubUid", "==", uid))
      : null,
    (data) => {
      const offerTitle = (data as any)?.offerTitle || "Offre";
      showToast({
        title: "Nouvelle candidature",
        message: `Nouvelle candidature pour ${offerTitle}.`,
      });
    }
  );

  // =========================
  // CLUB — favoris: nouveau post / match (premium)
  // =========================
  React.useEffect(() => {
    if (!uid || userType !== "club" || !isPremium) return;
    if (favoritePlayerIds.length === 0) return;

    const unsubs: Array<() => void> = [];

    favoritePlayerIds.forEach((playerUid) => {
      if (PREMIUM_REQUIRED.favoritePlayerPost) {
        const postsQuery = query(
          collection(db, "posts"),
          where("playerUid", "==", playerUid),
          orderBy("createdAt", "desc")
        );
        let initialPosts = true;
        unsubs.push(
          onSnapshot(postsQuery, (snap) => {
            if (initialPosts) {
              initialPosts = false;
              return;
            }
            snap.docChanges().forEach(async (change) => {
              if (change.type !== "added") return;
              const playerName = await fetchPlayerName(playerUid);
              showToast({
                title: "Nouveau post",
                message: `${playerName} a publié un nouveau post.`,
              });
            });
          })
        );
      }

      if (PREMIUM_REQUIRED.favoritePlayerMatch) {
        const matchesQuery = query(
          collection(db, "joueurs", playerUid, "matches"),
          orderBy("matchDate", "desc")
        );
        let initialMatches = true;
        unsubs.push(
          onSnapshot(matchesQuery, (snap) => {
            if (initialMatches) {
              initialMatches = false;
              return;
            }
            snap.docChanges().forEach(async (change) => {
              if (change.type !== "added") return;
              const playerName = await fetchPlayerName(playerUid);
              showToast({
                title: "Nouveau match",
                message: `${playerName} a ajouté un match.`,
              });
            });
          })
        );
      }
    });

    return () => unsubs.forEach((u) => u());
  }, [uid, userType, isPremium, favoritePlayerIds.join("|")]);

  return null;
}
