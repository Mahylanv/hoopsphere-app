import * as admin from "firebase-admin";
import { auth as authV1 } from "firebase-functions/v1";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

setGlobalOptions({
  region: "europe-west1",
});

// 🔹 JOUEUR supprimé → AUTH supprimé
export const onPlayerDeleted = onDocumentDeleted(
  "joueurs/{uid}",
  async (event) => {
    const uid = event.params.uid;

    try {
      await admin.auth().deleteUser(uid);
      console.log("✅ Auth supprimé (joueur) :", uid);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        console.warn("⚠️ Auth déjà supprimé (joueur) :", uid);
      } else {
        console.error("❌ Erreur suppression Auth joueur :", error);
      }
    }
  }
);

// 🔹 CLUB supprimé → AUTH supprimé
export const onClubDeleted = onDocumentDeleted(
  "clubs/{uid}",
  async (event) => {
    const uid = event.params.uid;

    try {
      await admin.auth().deleteUser(uid);
      console.log("✅ Auth supprimé (club) :", uid);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        console.warn("⚠️ Auth déjà supprimé (club) :", uid);
      } else {
        console.error("❌ Erreur suppression Auth club :", error);
      }
    }
  }
);

/* =====================================================
   📧 RELANCE AUTO CANDIDATURES (7 jours)
   - Si le joueur est Premium et la candidature n'est pas refusée
   - Envoie un email de relance au club (via collection mail queue)
===================================================== */
export const sendCandidatureReminders = onSchedule("every 24 hours", async () => {
  const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const statuses = ["pending", "accepted"];

  for (const status of statuses) {
    const snap = await db
      .collectionGroup("candidatures")
      .where("status", "==", status)
      .where("createdAt", "<=", sevenDaysAgo)
      .where("reminderSent", "in", [false, null])
      .get()
      .catch((e) => {
        console.error("❌ Erreur requête candidatures:", e);
        return null;
      });

    if (!snap || snap.empty) continue;

    for (const docSnap of snap.docs) {
      const data = docSnap.data() as any;
      const applicantUid = data.applicantUid;
      const clubUid = data.clubUid;

      if (!applicantUid || !clubUid) continue;

      // Vérifier premium joueur
      const playerDoc = await db.collection("joueurs").doc(applicantUid).get();
      if (!playerDoc.exists || !playerDoc.data()?.premium) continue;

      // Email du club
      const clubDoc = await db.collection("clubs").doc(clubUid).get();
      const clubEmail = clubDoc.exists ? clubDoc.data()?.email : null;
      if (!clubEmail) continue;

      // Sujet / message simple
      const offerTitle = data.offerTitle || "Votre offre";
      const subject = `Relance candidature – ${offerTitle}`;
      const text = [
        "Bonjour,",
        "",
        "Un joueur Premium a postulé à votre offre il y a 7 jours et n’a pas reçu de réponse.",
        `Offre : ${offerTitle}`,
        data.offerLocation ? `Localisation : ${data.offerLocation}` : null,
        "",
        "Merci de revenir vers lui ou de mettre à jour le statut de la candidature.",
        "",
        "Ceci est un rappel automatique.",
      ]
        .filter(Boolean)
        .join("\n");

      // File d'email (extension mail si installée)
      await db.collection("mail").add({
        to: [clubEmail],
        message: {
          subject,
          text,
        },
      });

      await docSnap.ref.update({
        reminderSent: true,
        reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("📧 Relance candidature envoyée pour", docSnap.ref.path);
    }
  }
});

/* =====================================================
   🔥 AUTH → FIRESTORE (v1 OBLIGATOIRE)
===================================================== */

export const onAuthUserDeleted = authV1
  .user()
  .onDelete(async (user: admin.auth.UserRecord) => {
    const uid = user.uid;

    try {
      const joueurRef = db.collection("joueurs").doc(uid);
      const clubRef = db.collection("clubs").doc(uid);

      const [joueurSnap, clubSnap] = await Promise.all([
        joueurRef.get(),
        clubRef.get(),
      ]);

      if (joueurSnap.exists) {
        await joueurRef.delete();
        console.log("🧹 Joueur Firestore supprimé :", uid);
      }

      if (clubSnap.exists) {
        await clubRef.delete();
        console.log("🧹 Club Firestore supprimé :", uid);
      }
    } catch (error) {
      console.error("❌ Erreur cleanup Firestore :", error);
    }
  });

/* =====================================================
   🔥 POST JOUEUR → CLEANUP GLOBAL (🔥 NOUVEAU)
===================================================== */

/**
 * Quand un post est supprimé ici :
 * /joueurs/{uid}/posts/{postId}
 *
 * ➜ On supprime automatiquement :
 * - /posts/{postId}
 * - le fichier Storage associé
 */
export const onPlayerPostDeleted = onDocumentDeleted(
  "joueurs/{uid}/posts/{postId}",
  async (event) => {
    const { uid, postId } = event.params;
    const data = event.data?.data();

    try {
      // 🗑️ Supprimer le post global
      await db.doc(`posts/${postId}`).delete();
      console.log(`🧹 Post global supprimé : ${postId}`);

      // 🗑️ Supprimer le média dans Storage
      if (data?.mediaUrl) {
        const decodedPath = decodeURIComponent(
          data.mediaUrl.split("/o/")[1].split("?")[0]
        );

        await bucket.file(decodedPath).delete();
        console.log(`🧹 Media Storage supprimé : ${decodedPath}`);
      }
    } catch (error) {
      console.error("❌ Erreur cleanup post :", error);
    }
  }
);
