// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Si ton projet est en Europe, garde la région ci-dessous.
// Sinon, enlève `.region("europe-west1")`.
export const onCandidatureCreated = functions
    .region("europe-west1")
    .firestore
    .document("clubs/{clubUid}/offres/{offerId}/candidatures/{candId}")
    .onCreate(async (snap, context) => {
        try {
            const data = snap.data() || {};
            const clubUid: string | undefined =
                data.clubUid || context.params.clubUid;

            if (!clubUid) {
                console.warn("[onCandidatureCreated] Missing clubUid.");
                return;
            }

            const applicantEmail: string =
                (data.applicantEmail || "Un joueur").toString();

            const offerTitle: string =
                (data.offerTitle || "").toString().trim() || "Offre";

            const messageText: string = (data.message || "").toString();

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
                .map((d) => (d.data()?.token as string | undefined))
                .filter((t): t is string => typeof t === "string" && t.length > 0);

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
                const message: admin.messaging.MulticastMessage = {
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
                    console.warn(
                        `[onCandidatureCreated] FCM errors (${failed.length}/${slice.length})`,
                        failed.map((f) => f.error?.message)
                    );
                }
            }

            console.log("[onCandidatureCreated] Done for club", clubUid);
        } catch (err) {
            console.error("[onCandidatureCreated] ERROR:", err);
        }
    });
