"use strict";
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
exports.onCandidatureCreated = void 0;
// functions/src/index.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
// Si ton projet est en Europe, garde la région ci-dessous.
// Sinon, enlève `.region("europe-west1")`.
exports.onCandidatureCreated = functions
    .region("europe-west1")
    .firestore
    .document("clubs/{clubUid}/offres/{offerId}/candidatures/{candId}")
    .onCreate(async (snap, context) => {
    try {
        const data = snap.data() || {};
        const clubUid = data.clubUid || context.params.clubUid;
        if (!clubUid) {
            console.warn("[onCandidatureCreated] Missing clubUid.");
            return;
        }
        const applicantEmail = (data.applicantEmail || "Un joueur").toString();
        const offerTitle = (data.offerTitle || "").toString().trim() || "Offre";
        const messageText = (data.message || "").toString();
        // 1) Notification in-app (doc Firestore)
        await db
            .collection("clubs")
            .doc(clubUid)
            .collection("notifications")
            .add({
            type: "candidature_created",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            title: "Nouvelle candidature",
            body: `${applicantEmail} a postulé à "${offerTitle}"`,
            meta: {
                offerId: context.params.offerId,
                candId: context.params.candId,
                applicantEmail,
                message: messageText,
            },
            read: false,
        });
        // 2) Récupère les tokens FCM
        const devSnap = await db
            .collection("clubs")
            .doc(clubUid)
            .collection("devices")
            .get();
        const tokens = devSnap.docs
            .map((d) => d.data()?.token)
            .filter((t) => typeof t === "string" && t.length > 0);
        if (tokens.length === 0) {
            console.log("[onCandidatureCreated] No device tokens for club:", clubUid);
            return;
        }
        const title = "Nouvelle candidature";
        const body = `${applicantEmail} a postulé à "${offerTitle}"`;
        // 3) Envoi push FCM (paquets de 500 max)
        const chunkSize = 500;
        for (let i = 0; i < tokens.length; i += chunkSize) {
            const slice = tokens.slice(i, i + chunkSize);
            const message = {
                tokens: slice,
                notification: { title, body },
                data: {
                    type: "candidature_created",
                    offerId: context.params.offerId,
                    candId: context.params.candId,
                },
                android: { priority: "high" },
                apns: { payload: { aps: { sound: "default" } } },
            };
            const resp = await messaging.sendMulticast(message);
            const failed = resp.responses.filter((r) => !r.success);
            if (failed.length) {
                console.warn(`[onCandidatureCreated] FCM errors (${failed.length}/${slice.length})`, failed.map((f) => f.error?.message));
            }
        }
        console.log("[onCandidatureCreated] Done for club", clubUid);
    }
    catch (err) {
        console.error("[onCandidatureCreated] ERROR:", err);
    }
});
//# sourceMappingURL=index.js.map