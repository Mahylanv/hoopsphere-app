// functions/src/index.ts

import * as admin from "firebase-admin";

/* =====================================================
   🔥 Firebase imports
===================================================== */
import { auth as authV1 } from "firebase-functions/v1";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";

/* =====================================================
   🔧 INIT ADMIN SDK
===================================================== */
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

/* =====================================================
   🌍 OPTIONS GLOBALES (v2)
===================================================== */
setGlobalOptions({
  region: "europe-west1",
});

/* =====================================================
   🔥 FIRESTORE → AUTH (v2)
===================================================== */

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
