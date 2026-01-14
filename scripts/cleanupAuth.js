const admin = require("firebase-admin");
const fs = require("fs");

// 🔐 Charger la clé admin
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// Init Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanupGhostUsers() {
  // console.log("🚀 Démarrage du nettoyage des comptes fantômes...");

  const list = await admin.auth().listUsers(1000);

  for (const user of list.users) {
    const uid = user.uid;

    const joueurSnap = await db.collection("joueurs").doc(uid).get();
    const clubSnap = await db.collection("clubs").doc(uid).get();

    if (!joueurSnap.exists && !clubSnap.exists) {
      await admin.auth().deleteUser(uid);
      // console.log("🧹 Utilisateur fantôme supprimé :", uid);
    }
  }

  // console.log("✅ Nettoyage terminé.");
}

cleanupGhostUsers().catch(console.error);
