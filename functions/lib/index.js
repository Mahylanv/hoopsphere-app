"use strict";
// functions/src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAuthUserDeleted = exports.onClubDeleted = exports.onPlayerDeleted = void 0;
const admin = __importStar(require("firebase-admin"));
/* =====================================================
   🔥 Firebase imports
===================================================== */
const v1_1 = require("firebase-functions/v1");
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-functions/v2/firestore");
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
(0, v2_1.setGlobalOptions)({
    region: "europe-west1",
});
/* =====================================================
   🔥 FIRESTORE → AUTH (v2)
===================================================== */
// 🔹 JOUEUR supprimé → AUTH supprimé
exports.onPlayerDeleted = (0, firestore_1.onDocumentDeleted)("joueurs/{uid}", async (event) => {
    const uid = event.params.uid;
    try {
        await admin.auth().deleteUser(uid);
        console.log("✅ Auth supprimé (joueur) :", uid);
    }
    catch (error) {
        if (error.code === "auth/user-not-found") {
            console.warn("⚠️ Auth déjà supprimé (joueur) :", uid);
        }
        else {
            console.error("❌ Erreur suppression Auth joueur :", error);
        }
    }
});
// 🔹 CLUB supprimé → AUTH supprimé
exports.onClubDeleted = (0, firestore_1.onDocumentDeleted)("clubs/{uid}", async (event) => {
    const uid = event.params.uid;
    try {
        await admin.auth().deleteUser(uid);
        console.log("✅ Auth supprimé (club) :", uid);
    }
    catch (error) {
        if (error.code === "auth/user-not-found") {
            console.warn("⚠️ Auth déjà supprimé (club) :", uid);
        }
        else {
            console.error("❌ Erreur suppression Auth club :", error);
        }
    }
});
/* =====================================================
   🔥 AUTH → FIRESTORE (v1 OBLIGATOIRE)
===================================================== */
exports.onAuthUserDeleted = v1_1.auth
    .user()
    .onDelete(async (user) => {
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
    }
    catch (error) {
        console.error("❌ Erreur cleanup Firestore :", error);
    }
});
