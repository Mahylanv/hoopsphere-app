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