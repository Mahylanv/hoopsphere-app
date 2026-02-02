import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const FieldPath = admin.firestore.FieldPath;
const fetchAny = (globalThis as any).fetch as (input: any, init?: any) => Promise<any>;

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type UserType = "joueur" | "club";

async function getDeviceTokens(userType: UserType, uid: string) {
  const root = userType === "club" ? "clubs" : "joueurs";
  const snap = await db.collection(root).doc(uid).collection("devices").get();
  return snap.docs
    .map((d) => d.data()?.token || d.id)
    .filter((t) => typeof t === "string" && t.length > 0);
}

async function isPremium(userType: UserType, uid: string) {
  const root = userType === "club" ? "clubs" : "joueurs";
  const snap = await db.collection(root).doc(uid).get();
  if (!snap.exists) return false;
  const data = snap.data() as any;
  return !!(data?.premium ?? data?.isPremium);
}

async function sendPush(tokens: string[], title: string, body: string, data?: any) {
  if (!tokens.length) return;

  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    chunks.push(tokens.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const messages = chunk.map((to) => ({
      to,
      title,
      body,
      sound: "default",
      data: data ?? {},
    }));

    try {
      const res = await fetchAny(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        const text = await res.text();
        logger.warn("Expo push error", { status: res.status, text });
      }
    } catch (e) {
      logger.warn("Expo push exception", e as any);
    }
  }
}

async function notifyUser(
  userType: UserType,
  uid: string,
  title: string,
  body: string,
  data?: any
) {
  const tokens = await getDeviceTokens(userType, uid);
  if (!tokens.length) return;
  await sendPush(tokens, title, body, data);
}

// =========================
// LIKE SUR VIDEO (joueur)
// =========================
export const onLikeCreated = onDocumentCreated(
  "posts/{postId}/likes/{likeId}",
  async (event) => {
    const data = event.data?.data() as any;
    if (!data) return;

    const ownerUid = data.postOwnerUid as string | undefined;
    const likerUid = data.likerUid as string | undefined;
    if (!ownerUid) return;
    if (likerUid && likerUid === ownerUid) return;

    await notifyUser("joueur", ownerUid, "Nouveau like", "Quelqu'un a aimé votre vidéo.", {
      type: "like",
      postId: data.postId ?? event.params.postId,
    });
  }
);

// =========================
// VUES PROFIL JOUEUR (premium)
// =========================
export const onPlayerViewCreated = onDocumentCreated(
  "joueurs/{playerUid}/views/{viewId}",
  async (event) => {
    const playerUid = event.params.playerUid as string;
    const view = event.data?.data() as any;
    if (view?.viewerUid && view.viewerUid === playerUid) return;

    if (!(await isPremium("joueur", playerUid))) return;

    await notifyUser(
      "joueur",
      playerUid,
      "Nouvelle visite",
      "Quelqu'un a consulté votre profil.",
      { type: "profile_view" }
    );
  }
);

// =========================
// VUES PROFIL CLUB (premium)
// =========================
export const onClubViewCreated = onDocumentCreated(
  "clubs/{clubUid}/views/{viewId}",
  async (event) => {
    const clubUid = event.params.clubUid as string;
    const view = event.data?.data() as any;
    if (view?.viewerUid && view.viewerUid === clubUid) return;

    if (!(await isPremium("club", clubUid))) return;

    await notifyUser(
      "club",
      clubUid,
      "Nouvelle visite",
      "Quelqu'un a consulté votre profil club.",
      { type: "club_profile_view" }
    );
  }
);

// =========================
// NOUVELLE OFFRE CLUB -> joueurs favoris (premium)
// =========================
export const onOfferCreated = onDocumentCreated(
  "clubs/{clubUid}/offres/{offerId}",
  async (event) => {
    const clubUid = event.params.clubUid as string;
    const offer = event.data?.data() as any;
    const offerTitle = offer?.title || offer?.poste || "Offre";

    const favSnap = await db
      .collectionGroup("favoriteClubs")
      .where(FieldPath.documentId(), "==", clubUid)
      .get();

    if (favSnap.empty) return;

    const notified: string[] = [];

    for (const docSnap of favSnap.docs) {
      const playerUid = docSnap.ref.parent.parent?.id;
      if (!playerUid) continue;
      if (!(await isPremium("joueur", playerUid))) continue;
      notified.push(playerUid);
    }

    await Promise.all(
      notified.map((playerUid) =>
        notifyUser(
          "joueur",
          playerUid,
          "Nouvelle offre",
          `Un club favori a publié une offre : ${offerTitle}.`,
          { type: "favorite_club_offer", offerId: event.params.offerId }
        )
      )
    );
  }
);

// =========================
// CANDIDATURE STATUS UPDATED (premium joueur)
// =========================
export const onCandidatureUpdated = onDocumentUpdated(
  "clubs/{clubUid}/offres/{offerId}/candidatures/{candId}",
  async (event) => {
    const before = event.data?.before.data() as any;
    const after = event.data?.after.data() as any;
    if (!after) return;

    const beforeStatus = before?.status;
    const afterStatus = after?.status;

    if (!afterStatus || beforeStatus === afterStatus) return;

    if (afterStatus !== "accepted" && afterStatus !== "rejected") return;

    const applicantUid = after?.applicantUid as string | undefined;
    if (!applicantUid) return;
    if (!(await isPremium("joueur", applicantUid))) return;

    const title = afterStatus === "accepted" ? "Candidature acceptée" : "Candidature refusée";
    const body =
      afterStatus === "accepted"
        ? "Bonne nouvelle, votre candidature a été acceptée."
        : "Votre candidature a été refusée.";

    await notifyUser("joueur", applicantUid, title, body, {
      type: "candidature_status",
      status: afterStatus,
      offerId: event.params.offerId,
    });
  }
);

// =========================
// NOUVELLE CANDIDATURE (premium club)
// =========================
export const onCandidatureCreated = onDocumentCreated(
  "clubs/{clubUid}/offres/{offerId}/candidatures/{candId}",
  async (event) => {
    const clubUid = event.params.clubUid as string;
    if (!(await isPremium("club", clubUid))) return;

    const data = event.data?.data() as any;
    const offerTitle = data?.offerTitle || "Offre";

    await notifyUser(
      "club",
      clubUid,
      "Nouvelle candidature",
      `Nouvelle candidature pour ${offerTitle}.`,
      { type: "new_candidature", offerId: event.params.offerId }
    );
  }
);

// =========================
// NOUVEAU POST JOUEUR -> clubs favoris (premium)
// =========================
export const onPostCreated = onDocumentCreated(
  "posts/{postId}",
  async (event) => {
    const post = event.data?.data() as any;
    const playerUid = post?.playerUid as string | undefined;
    if (!playerUid) return;

    const favSnap = await db
      .collectionGroup("favoritePlayers")
      .where(FieldPath.documentId(), "==", playerUid)
      .get();

    if (favSnap.empty) return;

    const notified: string[] = [];

    for (const docSnap of favSnap.docs) {
      const clubUid = docSnap.ref.parent.parent?.id;
      if (!clubUid) continue;
      if (!(await isPremium("club", clubUid))) continue;
      notified.push(clubUid);
    }

    await Promise.all(
      notified.map((clubUid) =>
        notifyUser(
          "club",
          clubUid,
          "Nouveau post",
          "Un joueur favori a publié un nouveau post.",
          { type: "favorite_player_post", postId: event.params.postId }
        )
      )
    );
  }
);

// =========================
// NOUVEAU MATCH JOUEUR -> clubs favoris (premium)
// =========================
export const onMatchCreated = onDocumentCreated(
  "joueurs/{playerUid}/matches/{matchId}",
  async (event) => {
    const playerUid = event.params.playerUid as string;

    const favSnap = await db
      .collectionGroup("favoritePlayers")
      .where(FieldPath.documentId(), "==", playerUid)
      .get();

    if (favSnap.empty) return;

    const notified: string[] = [];

    for (const docSnap of favSnap.docs) {
      const clubUid = docSnap.ref.parent.parent?.id;
      if (!clubUid) continue;
      if (!(await isPremium("club", clubUid))) continue;
      notified.push(clubUid);
    }

    await Promise.all(
      notified.map((clubUid) =>
        notifyUser(
          "club",
          clubUid,
          "Nouveau match",
          "Un joueur favori a ajouté un match.",
          { type: "favorite_player_match" }
        )
      )
    );
  }
);
