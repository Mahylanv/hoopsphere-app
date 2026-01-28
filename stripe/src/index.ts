// stripe/src/index.ts

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// ðŸ” Stripe (secrets via params)
const stripeSecretKey = defineSecret("STRIPE_SECRET");
const stripeWebhookSecretKey = defineSecret("STRIPE_WEBHOOK_SECRET");
const smtpHost = defineSecret("SMTP_HOST");
const smtpPort = defineSecret("SMTP_PORT");
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");
const smtpFrom = defineSecret("SMTP_FROM");

const resolveStripeSecret = () => {
  const raw = stripeSecretKey.value() || process.env.STRIPE_SECRET;
  const secret = raw ? raw.trim() : "";
  if (!secret) {
    return {
      secret: null,
      error: "Stripe secret manquant. Verifie STRIPE_SECRET.",
    };
  }
  if (/\s/.test(secret)) {
    return {
      secret: null,
      error:
        "Stripe secret invalide (espaces detectes). Copie la cle sans espaces.",
    };
  }
  if (secret.startsWith("pk_")) {
    return {
      secret: null,
      error:
        "Cle publique detectee. Utilise une cle secrete sk_test_ ou sk_live_.",
    };
  }
  if (!/^sk_(test|live)_/.test(secret)) {
    return {
      secret: null,
      error:
        "Stripe secret invalide. Il doit commencer par sk_test_ ou sk_live_.",
    };
  }
  return { secret, error: null };
};

const getStripeOrThrow = () => {
  const { secret, error } = resolveStripeSecret();
  if (!secret) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      error || "Stripe secret manquant."
    );
  }
  return new Stripe(secret, { apiVersion: "2025-12-15.clover" });
};

const resolveSmtpConfig = () => {
  const host = smtpHost.value() || process.env.SMTP_HOST;
  const portRaw = smtpPort.value() || process.env.SMTP_PORT;
  const user = smtpUser.value() || process.env.SMTP_USER;
  const pass = smtpPass.value() || process.env.SMTP_PASS;
  const from = smtpFrom.value() || process.env.SMTP_FROM;
  if (!host || !user || !pass || !from) {
    return null;
  }
  const port = Number(portRaw);
  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    user,
    pass,
    from,
  };
};

const handleStripeError = (err: any, fallback: string) => {
  if (err instanceof functions.https.HttpsError) {
    throw err;
  }
  if (err?.type === "StripeAuthenticationError") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Cle Stripe invalide. Verifie STRIPE_SECRET."
    );
  }
  if (err?.code === "resource_missing") {
    throw new functions.https.HttpsError("not-found", "Aucun abonnement actif.");
  }
  if (
    typeof err?.message === "string" &&
    err.message.includes("Changing plan intervals")
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Impossible de changer d'intervalle avec cette date."
    );
  }
  const message = typeof err?.message === "string" ? err.message : fallback;
  throw new functions.https.HttpsError("internal", message);
};

const resolveSwitchAt = (
  rawStartAt: unknown,
  currentPeriodEnd: number
) => {
  let switchAt = currentPeriodEnd;
  if (typeof rawStartAt === "number" && Number.isFinite(rawStartAt)) {
    const candidate =
      rawStartAt > 1_000_000_000_000
        ? Math.floor(rawStartAt / 1000)
        : Math.floor(rawStartAt);
    if (Number.isFinite(candidate)) {
      switchAt = candidate;
    }
  }

  const now = Math.floor(Date.now() / 1000);
  if (switchAt < now) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "La date doit être dans le futur."
    );
  }
  if (switchAt < currentPeriodEnd) {
    const startDate = new Date(switchAt * 1000);
    const periodEndDate = new Date(currentPeriodEnd * 1000);
    const sameDay =
      startDate.getUTCFullYear() === periodEndDate.getUTCFullYear() &&
      startDate.getUTCMonth() === periodEndDate.getUTCMonth() &&
      startDate.getUTCDate() === periodEndDate.getUTCDate();
    if (sameDay) {
      return currentPeriodEnd;
    }
    throw new functions.https.HttpsError(
      "invalid-argument",
      "La date doit être après la fin de la période actuelle."
    );
  }

  return switchAt;
};

const applyScheduledPlanChange = async (params: {
  stripe: Stripe;
  userDoc: UserDocInfo;
  plan: "month" | "year";
  rawStartAt?: unknown;
}) => {
  const { stripe, userDoc, plan, rawStartAt } = params;
  const customerId = userDoc.data?.stripeCustomerId as string | undefined;
  if (!customerId) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Aucun customer Stripe lié à ce compte."
    );
  }

  const subscriptionId = await resolveSubscriptionId(
    stripe,
    customerId,
    userDoc.data?.stripeSubscriptionId
  );
  if (!subscriptionId) {
    throw new functions.https.HttpsError(
      "not-found",
      "Aucun abonnement actif."
    );
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const item = subscription.items.data[0];
  const itemId = item?.id;
  const currentPriceId = item?.price?.id ?? null;
  const currentPeriodEnd = item?.current_period_end ?? null;
  if (!itemId || !currentPriceId || !currentPeriodEnd) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Impossible de modifier cet abonnement."
    );
  }

  const switchAt = resolveSwitchAt(rawStartAt, currentPeriodEnd);

  if (currentPriceId === PRICE_IDS[plan]) {
    return { subscription, switchAt };
  }

  let scheduleId: string | null = null;
  if (subscription.schedule) {
    scheduleId =
      typeof subscription.schedule === "string"
        ? subscription.schedule
        : subscription.schedule.id;
  }

  let schedule: Stripe.SubscriptionSchedule | null = null;
  if (scheduleId) {
    schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    if (schedule.status === "canceled" || schedule.status === "released") {
      schedule = null;
    }
  }
  if (!schedule) {
    schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscriptionId,
    });
  }

  const phaseStart =
    (schedule.phases?.[0]?.start_date as number | undefined) ??
    item.current_period_start ??
    Math.floor(Date.now() / 1000);

  await stripe.subscriptionSchedules.update(schedule.id, {
    proration_behavior: "none",
    phases: [
      {
        start_date: phaseStart,
        end_date: switchAt,
        items: [
          {
            price: currentPriceId,
            quantity: item.quantity ?? 1,
          },
        ],
        proration_behavior: "none",
      },
      {
        start_date: switchAt,
        items: [
          {
            price: PRICE_IDS[plan],
            quantity: item.quantity ?? 1,
          },
        ],
        billing_cycle_anchor: "phase_start",
        proration_behavior: "none",
      },
    ],
  });

  let updatedSubscription = subscription;
  if (subscription.cancel_at_period_end) {
    updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  const scheduledAt = admin.firestore.Timestamp.fromMillis(switchAt * 1000);
      await userDoc.ref.set(
        {
          ...buildSubscriptionUpdate(updatedSubscription),
          subscriptionScheduledInterval: plan,
          subscriptionScheduledAt: scheduledAt,
        },
        {merge: true}
      );

  return { subscription: updatedSubscription, switchAt };
};

// ðŸ’³ IDs Stripe des abonnements
const PRICE_IDS = {
  month: "price_1SpTpMAUQxk5OdPwJQZxKCCH",
  year: "price_1SpTpMAUQxk5OdPwYrqPudN3",
};

type UserDocInfo = {
  ref: FirebaseFirestore.DocumentReference;
  data: FirebaseFirestore.DocumentData | null;
  type: "joueur" | "club";
};

const resolveUserDoc = async (uid: string): Promise<UserDocInfo> => {
  const joueurRef = db.collection("joueurs").doc(uid);
  const clubRef = db.collection("clubs").doc(uid);
  const [joueurSnap, clubSnap] = await Promise.all([
    joueurRef.get(),
    clubRef.get(),
  ]);

  if (clubSnap.exists) {
    return { ref: clubRef, data: clubSnap.data() ?? null, type: "club" };
  }

  return { ref: joueurRef, data: joueurSnap.data() ?? null, type: "joueur" };
};

const resolveUserByStripeCustomerId = async (
  customerId: string
): Promise<UserDocInfo | null> => {
  const [joueurSnap, clubSnap] = await Promise.all([
    db
      .collection("joueurs")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get(),
    db
      .collection("clubs")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get(),
  ]);

  if (!joueurSnap.empty) {
    const doc = joueurSnap.docs[0];
    return { ref: doc.ref, data: doc.data(), type: "joueur" };
  }

  if (!clubSnap.empty) {
    const doc = clubSnap.docs[0];
    return { ref: doc.ref, data: doc.data(), type: "club" };
  }

  return null;
};

const buildSubscriptionUpdate = (subscription: Stripe.Subscription) => {
  const price = subscription.items.data[0]?.price;
  const item = subscription.items.data[0];
  const premiumActive = ["active", "trialing"].includes(subscription.status);

  return {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    subscriptionPriceId: price?.id ?? null,
    subscriptionInterval: price?.recurring?.interval ?? null,
    subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    subscriptionCurrentPeriodStart: item?.current_period_start
      ? admin.firestore.Timestamp.fromMillis(
        item.current_period_start * 1000
      )
      : null,
    subscriptionCurrentPeriodEnd: item?.current_period_end
      ? admin.firestore.Timestamp.fromMillis(item.current_period_end * 1000)
      : null,
    premium: premiumActive,
    premiumSince: premiumActive
      ? admin.firestore.FieldValue.serverTimestamp()
      : null,
  };
};

const resolveSubscriptionId = async (
  stripe: Stripe,
  customerId: string,
  storedId?: string | null
) => {
  if (storedId) return storedId;

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  return subs.data[0]?.id ?? null;
};

const formatAmountLabel = (
  amount: number | null | undefined,
  currency?: string | null
) => {
  if (typeof amount !== "number") return null;
  const safeCurrency = currency ? currency.toUpperCase() : "EUR";
  return `${(amount / 100).toFixed(2)} ${safeCurrency}`;
};

const resolveInvoicePaymentIntentId = (invoice: Stripe.Invoice) => {
  const raw = (invoice as any).payment_intent;
  if (!raw) return null;
  return typeof raw === "string" ? raw : raw.id ?? null;
};

const resolveInvoiceEmailFromPaymentIntent = async (
  stripe: Stripe,
  invoice: Stripe.Invoice
) => {
  const paymentIntentId = resolveInvoicePaymentIntentId(invoice);
  if (!paymentIntentId) return null;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const receiptEmail =
      typeof paymentIntent.receipt_email === "string"
        ? paymentIntent.receipt_email.trim()
        : "";
    if (receiptEmail) return receiptEmail;

    const charges = await stripe.charges.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });
    const chargeEmail = charges.data[0]?.billing_details?.email ?? "";
    if (chargeEmail) return chargeEmail.trim();

    const paymentMethodId =
      typeof paymentIntent.payment_method === "string"
        ? paymentIntent.payment_method
        : paymentIntent.payment_method?.id ?? null;
    if (!paymentMethodId) return null;
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const paymentMethodEmail = paymentMethod.billing_details?.email ?? "";
    return paymentMethodEmail ? paymentMethodEmail.trim() : null;
  } catch (err) {
    console.error("Impossible de récupérer l'email du payment_intent:", err);
    return null;
  }
};

const sendSubscriptionEmail = async (
  stripe: Stripe,
  invoice: Stripe.Invoice,
  userDoc?: UserDocInfo | null
) => {
  const smtp = resolveSmtpConfig();
  if (!smtp) {
    console.log("SMTP non configuré, email ignoré.");
    return;
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id ?? null;

  const resolvedUserDoc =
    userDoc ?? (customerId ? await resolveUserByStripeCustomerId(customerId) : null);
  const paymentIntentEmail = await resolveInvoiceEmailFromPaymentIntent(
    stripe,
    invoice
  );
  const email =
    paymentIntentEmail ||
    invoice.customer_email ||
    (resolvedUserDoc?.data?.email as string | undefined) ||
    null;

  if (!email) {
    console.log("Email client introuvable, email ignoré.");
    return;
  }

  const amountLabel = formatAmountLabel(
    invoice.amount_paid,
    invoice.currency
  );
  const invoiceNumber = invoice.number || invoice.id;
  const pdfUrl = invoice.invoice_pdf || null;
  const hostedUrl = invoice.hosted_invoice_url || null;
  const invoiceUrl = pdfUrl || hostedUrl;
  const invoiceCtaLabel = pdfUrl ? "Télécharger la facture (PDF)" : "Voir la facture";

  const lines = [
    "Bonjour,",
    "",
    "Votre abonnement Hoopsphere est confirmé.",
    amountLabel ? `Montant : ${amountLabel}` : null,
    invoiceNumber ? `Facture : ${invoiceNumber}` : null,
    invoiceUrl ? `Facture : ${invoiceUrl}` : null,
    "",
    "Merci pour votre confiance.",
    "",
    "L'équipe Hoopsphere",
  ].filter(Boolean);

  const html = `<!doctype html>
  <html lang="fr">
    <body style="margin:0;padding:0;background:#0b0b0b;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0b0b0b;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
              <tr>
                <td style="padding:28px 28px 8px 28px;">
                  <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(249,115,22,0.16);color:#f97316;font-weight:600;font-size:12px;letter-spacing:0.3px;">
                    HOOPSPHERE
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:4px 28px 0 28px;">
                  <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.3;">Abonnement confirmé</h1>
                  <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.7;">
                    Bonjour, votre abonnement Hoopsphere est maintenant actif.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 28px 0 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0b0b0b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                    <tr>
                      <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Détail</td>
                      <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;" align="right">Valeur</td>
                    </tr>
                    ${
                      amountLabel
                        ? `<tr>
                      <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e5e7eb;font-size:14px;">Montant</td>
                      <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);color:#ffffff;font-weight:600;font-size:14px;" align="right">${amountLabel}</td>
                    </tr>`
                        : ""
                    }
                    ${
                      invoiceNumber
                        ? `<tr>
                      <td style="padding:14px 16px;color:#e5e7eb;font-size:14px;">Facture</td>
                      <td style="padding:14px 16px;color:#ffffff;font-weight:600;font-size:14px;" align="right">${invoiceNumber}</td>
                    </tr>`
                        : ""
                    }
                  </table>
                </td>
              </tr>
              ${
                invoiceUrl
                  ? `<tr>
                <td style="padding:22px 28px 0 28px;">
                  <a href="${invoiceUrl}" style="display:inline-block;background:#f97316;color:#0b0b0b;text-decoration:none;font-weight:700;font-size:14px;padding:12px 16px;border-radius:10px;">
                    ${invoiceCtaLabel}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 28px 0 28px;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                    Si le bouton ne fonctionne pas, copiez ce lien :
                    <br />
                    <a href="${invoiceUrl}" style="color:#f97316;word-break:break-all;">${invoiceUrl}</a>
                  </p>
                </td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding:22px 28px 28px 28px;">
                  <p style="margin:0;color:#d1d5db;font-size:13px;line-height:1.8;">
                    Merci pour votre confiance.
                    <br />
                    L'équipe Hoopsphere
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0 0;color:#6b7280;font-size:11px;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to: email,
    subject: "Confirmation d'abonnement Hoopsphere",
    text: lines.join("\n"),
    html,
  });
};

const sendSubscriptionEmailIfNeeded = async (
  stripe: Stripe,
  invoice: Stripe.Invoice
) => {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id ?? null;
  const userDoc = customerId
    ? await resolveUserByStripeCustomerId(customerId)
    : null;
  const isPaid =
    invoice.status === "paid" || (invoice.amount_paid ?? 0) > 0;

  if (!isPaid) {
    console.log("facture non payee, email ignore:", {
      id: invoice.id,
      status: invoice.status,
      amount_paid: invoice.amount_paid ?? 0,
    });
    return;
  }
  const lastInvoiceId = userDoc?.data?.lastInvoiceEmailedId as
    | string
    | undefined;

  if (lastInvoiceId && lastInvoiceId === invoice.id) {
    console.log("email deja envoye pour la facture", invoice.id);
    return;
  }

  await sendSubscriptionEmail(stripe, invoice, userDoc);

  if (userDoc) {
    await userDoc.ref.set(
      {
        lastInvoiceEmailedId: invoice.id,
        lastInvoiceEmailedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
};

const handlePaymentIntentSucceeded = async (
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent
) => {
  try {
    const customerId =
      typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id ?? null;
    if (!customerId) {
      console.log("payment_intent sans customer:", paymentIntent.id);
      return;
    }
    const metadata = paymentIntent.metadata || {};
    const upgradePlan = metadata.plan as "month" | "year" | undefined;
    const upgradeType = metadata.upgrade_type;
    const rawSwitchAt =
      typeof metadata.switchAt === "string" ? Number(metadata.switchAt) : null;
    if (
      upgradeType === "scheduled_change" &&
      (upgradePlan === "month" || upgradePlan === "year")
    ) {
      try {
        const userDoc = await resolveUserByStripeCustomerId(customerId);
        if (userDoc) {
          const pendingId = userDoc.data?.pendingUpgradePaymentIntentId as
            | string
            | undefined;
          if (pendingId && pendingId !== paymentIntent.id) {
            return;
          }
          const pendingPlan = userDoc.data?.pendingUpgradePlan as
            | "month"
            | "year"
            | undefined;
          if (pendingPlan && pendingPlan !== upgradePlan) {
            return;
          }
          const scheduledAt = userDoc.data?.subscriptionScheduledAt as
            | admin.firestore.Timestamp
            | null
            | undefined;
          const scheduledAtSeconds =
            typeof scheduledAt?.seconds === "number"
              ? scheduledAt.seconds
              : null;
          const scheduledPlan =
            userDoc.data?.subscriptionScheduledInterval as
              | "month"
              | "year"
              | null
              | undefined;
          if (
            !scheduledPlan ||
            scheduledPlan !== upgradePlan ||
            (scheduledAtSeconds !== null &&
              rawSwitchAt !== null &&
              scheduledAtSeconds !== rawSwitchAt)
          ) {
            await applyScheduledPlanChange({
              stripe,
              userDoc,
              plan: upgradePlan,
              rawStartAt: rawSwitchAt ?? undefined,
            });
          }
          await userDoc.ref.set(
            {
              pendingUpgradePaymentIntentId: null,
              pendingUpgradePlan: null,
              pendingUpgradeSwitchAt: null,
              pendingUpgradeCreatedAt: null,
              lastUpgradePaymentIntentId: paymentIntent.id,
              lastUpgradePaymentIntentAt:
                admin.firestore.FieldValue.serverTimestamp(),
            },
            {merge: true}
          );
        }
      } catch (err) {
        console.error("Erreur upgrade via payment_intent:", err);
      }
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 5,
    });
    const invoice =
      invoices.data.find(
        (item) => resolveInvoicePaymentIntentId(item) === paymentIntent.id
      ) ?? null;
    if (!invoice) {
      console.log("payment_intent sans facture associee:", paymentIntent.id);
      return;
    }
    console.log("facture via payment_intent:", {
      id: invoice.id,
      status: invoice.status,
      customer_email: invoice.customer_email,
    });
    await sendSubscriptionEmailIfNeeded(stripe, invoice);
  } catch (err) {
    console.error("Erreur facture via payment_intent:", err);
  }
};

const resolveUidFromSubscription = async (
  stripe: Stripe,
  subscription: Stripe.Subscription
) => {
  const metaUid = subscription.metadata?.uid;
  if (metaUid) return metaUid;

  const customer = await stripe.customers.retrieve(
    subscription.customer as string
  );
  if (customer && !("deleted" in customer) && customer.metadata?.uid) {
    return customer.metadata.uid;
  }
  return null;
};

// --------------------------------------------------
// ðŸ”¹ Paiement simple (ONE-SHOT / TEST)
// --------------------------------------------------
export const createPaymentIntent = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User not authenticated"
      );
    }
    const stripe = getStripeOrThrow();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 499, // 4,99 â‚¬
      currency: "eur",
      metadata: {
        uid: context.auth.uid,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }
);

// --------------------------------------------------
// ðŸ”¹ Abonnement Premium (mensuel / annuel)
// --------------------------------------------------
export const createSubscription = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

    const plan = data?.plan as "month" | "year";

    if (!plan || !PRICE_IDS[plan]) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Plan invalide. Utiliser 'month' ou 'year'."
      );
    }

    const uid = context.auth.uid;
    const priceId = PRICE_IDS[plan];

    const userDoc = await resolveUserDoc(uid);
    let customerId = userDoc.data?.stripeCustomerId as string | undefined;

    if (!customerId) {
      const customerPayload: Stripe.CustomerCreateParams = {
        metadata: {uid},
      };
      const customerEmail = userDoc.data?.email as string | undefined;
      if (customerEmail) {
        customerPayload.email = customerEmail;
      }
      const customer = await stripe.customers.create(customerPayload);
      customerId = customer.id;
      await userDoc.ref.set({stripeCustomerId: customerId}, {merge: true});
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      {customer: customerId},
      {apiVersion: "2025-12-15.clover"}
    );

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{price: priceId}],
      collection_method: "charge_automatically",
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
      metadata: {uid},
    });

    const expandedSubscription = await stripe.subscriptions.retrieve(
      subscription.id,
      { expand: ["latest_invoice.payment_intent"] }
    );
    const latestInvoice = expandedSubscription.latest_invoice;

    let paymentIntentId: string | null = null;
    let paymentIntentClientSecret: string | null = null;
    let setupIntentClientSecret: string | null = null;
    let noPaymentRequired = false;

    // 1ï¸âƒ£ latest_invoice est un ID string
    if (typeof latestInvoice === "string") {
      const invoice = (await stripe.invoices.retrieve(
        latestInvoice
      )) as Stripe.Invoice & {
        payment_intent?: string | Stripe.PaymentIntent | null;
      };

      if (typeof invoice.payment_intent === "string") {
        paymentIntentId = invoice.payment_intent;
      } else if (
        invoice.payment_intent &&
        typeof invoice.payment_intent === "object"
      ) {
        const pi = invoice.payment_intent as Stripe.PaymentIntent;
        if (typeof pi.client_secret === "string") {
          paymentIntentClientSecret = pi.client_secret;
        } else if (typeof pi.id === "string") {
          paymentIntentId = pi.id;
        }
      }
    }

    // 2ï¸âƒ£ latest_invoice est un objet Invoice
    if (typeof latestInvoice === "object" && latestInvoice !== null) {
      const invoice = latestInvoice as Stripe.Invoice & {
        payment_intent?: string | Stripe.PaymentIntent | null;
      };
      if (typeof invoice.payment_intent === "string") {
        paymentIntentId = invoice.payment_intent;
      } else if (
        invoice.payment_intent &&
        typeof invoice.payment_intent === "object"
      ) {
        const pi = invoice.payment_intent as Stripe.PaymentIntent;
        if (typeof pi.client_secret === "string") {
          paymentIntentClientSecret = pi.client_secret;
        } else if (typeof pi.id === "string") {
          paymentIntentId = pi.id;
        }
      }
    }

    if (!paymentIntentClientSecret && paymentIntentId) {
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentIntentClientSecret = paymentIntent.client_secret;
    }

    if (!paymentIntentClientSecret) {
      const latestInvoiceId =
        typeof latestInvoice === "string"
          ? latestInvoice
          : latestInvoice?.id ?? null;
      if (latestInvoiceId) {
        let invoice =
          typeof latestInvoice === "object" && latestInvoice !== null
            ? (latestInvoice as Stripe.Invoice)
            : await stripe.invoices.retrieve(latestInvoiceId, {
                expand: ["payment_intent"],
              });

        if (invoice.status === "draft") {
          invoice = await stripe.invoices.finalizeInvoice(invoice.id);
        }

        const invoiceIntent = (invoice as Stripe.Invoice & {
          payment_intent?: string | Stripe.PaymentIntent | null;
        }).payment_intent;
        if (typeof invoiceIntent === "string") {
          const paymentIntent =
            await stripe.paymentIntents.retrieve(invoiceIntent);
          paymentIntentClientSecret = paymentIntent.client_secret;
        } else if (invoiceIntent && typeof invoiceIntent === "object") {
          paymentIntentClientSecret = invoiceIntent.client_secret ?? null;
          if (!paymentIntentClientSecret && invoiceIntent.id) {
            const paymentIntent =
              await stripe.paymentIntents.retrieve(invoiceIntent.id);
            paymentIntentClientSecret = paymentIntent.client_secret;
          }
        }

        if (
          !paymentIntentClientSecret &&
          invoice.amount_due === 0 &&
          (invoice.status === "paid" ||
            subscription.status === "active" ||
            subscription.status === "trialing")
        ) {
          noPaymentRequired = true;
        }

        if (!paymentIntentClientSecret && !noPaymentRequired) {
          console.warn("createSubscription: payment_intent manquant", {
            subscriptionId: subscription.id,
            invoiceId: invoice.id,
            invoiceStatus: invoice.status,
            collectionMethod: (invoice as any).collection_method,
            amountDue: invoice.amount_due,
          });
        }
      }
    }

    if (!paymentIntentClientSecret && !noPaymentRequired) {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: "off_session",
      });
      setupIntentClientSecret = setupIntent.client_secret;
    }

    if (!paymentIntentClientSecret && !setupIntentClientSecret && !noPaymentRequired) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Impossible de créer le paiement. Merci de réessayer."
      );
    }

    await userDoc.ref.set(buildSubscriptionUpdate(subscription), {merge: true});

      return {
        clientSecret: paymentIntentClientSecret,
        setupIntentClientSecret,
        noPaymentRequired,
        subscriptionId: subscription.id,
        customerId,
        ephemeralKeySecret: ephemeralKey.secret,
      };
    } catch (err: any) {
      if (err instanceof functions.https.HttpsError) {
        throw err;
      }
      if (err?.type === "StripeAuthenticationError") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Stripe secret invalide. Verifie STRIPE_SECRET."
        );
      }
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors du paiement Stripe."
      );
    }
  }
);

// --------------------------------------------------
// 🔹 Nettoyage des données à la suppression Auth
// --------------------------------------------------
export const cleanupUserOnDelete = functions.auth.user().onDelete(
  async (user) => {
    const uid = user.uid;
    const joueurRef = db.collection("joueurs").doc(uid);
    const clubRef = db.collection("clubs").doc(uid);

    const safeDeleteDoc = async (
      ref: FirebaseFirestore.DocumentReference
    ) => {
      if (typeof (admin.firestore() as any).recursiveDelete === "function") {
        await (admin.firestore() as any).recursiveDelete(ref);
      } else {
        await ref.delete();
      }
    };

    try {
      await Promise.all([safeDeleteDoc(joueurRef), safeDeleteDoc(clubRef)]);
    } catch (err) {
      console.error("cleanupUserOnDelete: Firestore delete failed", err);
    }

    try {
      await admin
        .storage()
        .bucket()
        .deleteFiles({ prefix: `avatars/${uid}` });
    } catch (err) {
      console.error("cleanupUserOnDelete: Storage delete failed", err);
    }
  }
);

// --------------------------------------------------
// 🔹 Finaliser le paiement d'une subscription (fallback setup intent)
// --------------------------------------------------
export const confirmSubscriptionPayment = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

      const uid = context.auth.uid;
      const paymentMethodId = data?.paymentMethodId as string | undefined;
      const subscriptionIdOverride = data?.subscriptionId as string | undefined;
      const billingEmail =
        typeof data?.billingEmail === "string" ? data.billingEmail.trim() : "";

      if (!paymentMethodId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "paymentMethodId manquant."
        );
      }

      const userDoc = await resolveUserDoc(uid);
      const customerId = userDoc.data?.stripeCustomerId as string | undefined;
      if (!customerId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun customer Stripe lié à ce compte."
        );
      }

      const subscriptionId = subscriptionIdOverride
        ? subscriptionIdOverride
        : await resolveSubscriptionId(
            stripe,
            customerId,
            userDoc.data?.stripeSubscriptionId
          );
      if (!subscriptionId) {
        throw new functions.https.HttpsError(
          "not-found",
          "Aucun abonnement actif."
        );
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const latestInvoiceId =
        typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice?.id ?? null;

      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
      } catch (err: any) {
        if (err?.code !== "resource_already_exists") {
          throw err;
        }
      }

      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
        ...(billingEmail ? { email: billingEmail } : {}),
      });
      await stripe.subscriptions.update(subscriptionId, {
        default_payment_method: paymentMethodId,
      });

      if (latestInvoiceId) {
        let invoice = await stripe.invoices.retrieve(latestInvoiceId);
        const paymentIntentId = resolveInvoicePaymentIntentId(invoice);
        if (billingEmail && paymentIntentId) {
          await stripe.paymentIntents.update(paymentIntentId, {
            receipt_email: billingEmail,
          });
        }
        if (invoice.status === "draft") {
          invoice = await stripe.invoices.finalizeInvoice(invoice.id);
        }
        if (invoice.status === "open") {
          await stripe.invoices.pay(invoice.id, {
            payment_method: paymentMethodId,
          });
        }
      }

      const updatedSubscription = await stripe.subscriptions.retrieve(
        subscriptionId
      );
      await userDoc.ref.set(buildSubscriptionUpdate(updatedSubscription), {
        merge: true,
      });

      return { status: updatedSubscription.status };
    } catch (err) {
      handleStripeError(err, "Impossible de finaliser le paiement.");
    }
  });

// --------------------------------------------------
// ÃY"Ã» Stripe Customer Portal
// --------------------------------------------------
export const createBillingPortalSession = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User not authenticated"
      );
    }
    const stripe = getStripeOrThrow();
    if (!stripe) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Stripe secret manquant."
      );
    }

    const uid = context.auth.uid;
    const userDoc = await resolveUserDoc(uid);
    const customerId = userDoc.data?.stripeCustomerId as string | undefined;
    if (!customerId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Aucun customer Stripe lié à ce compte."
      );
    }

    const returnUrl =
      typeof data?.returnUrl === "string" ? data.returnUrl : "";
    if (!returnUrl) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "returnUrl manquant."
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }
);

// --------------------------------------------------
// 🔹 Dernière facture PDF
// --------------------------------------------------
export const getLatestInvoicePdf = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (_data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

      const uid = context.auth.uid;
      const userDoc = await resolveUserDoc(uid);
      const customerId = userDoc.data?.stripeCustomerId as string | undefined;
      if (!customerId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun customer Stripe lié à ce compte."
        );
      }

      let invoice = null as Stripe.Invoice | null;
      const paidInvoices = await stripe.invoices.list({
        customer: customerId,
        limit: 1,
        status: "paid",
      });
      invoice = paidInvoices.data[0] ?? null;

      if (!invoice) {
        const anyInvoices = await stripe.invoices.list({
          customer: customerId,
          limit: 1,
        });
        invoice = anyInvoices.data[0] ?? null;
      }

      if (!invoice) {
        throw new functions.https.HttpsError(
          "not-found",
          "Aucune facture disponible."
        );
      }

      const pdfUrl = invoice.invoice_pdf || null;
      const hostedUrl = invoice.hosted_invoice_url || null;
      if (!pdfUrl && !hostedUrl) {
        throw new functions.https.HttpsError(
          "not-found",
          "Aucune facture PDF disponible."
        );
      }

      return {
        url: pdfUrl ?? hostedUrl,
        hostedUrl,
      };
    } catch (err) {
      handleStripeError(err, "Impossible de récupérer la facture.");
    }
  }
);

// --------------------------------------------------
// ÃY"Ã» Infos abonnement
// --------------------------------------------------
export const getSubscriptionInfo = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User not authenticated"
      );
    }
    const stripe = getStripeOrThrow();
    if (!stripe) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Stripe secret manquant."
      );
    }

    const uid = context.auth.uid;
    const userDoc = await resolveUserDoc(uid);
    const customerId = userDoc.data?.stripeCustomerId as string | undefined;
    if (!customerId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Aucun customer Stripe lié à ce compte."
      );
    }

    const subscriptionId = await resolveSubscriptionId(
      stripe,
      customerId,
      userDoc.data?.stripeSubscriptionId
    );
    if (!subscriptionId) {
      return { subscription: null };
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await userDoc.ref.set(buildSubscriptionUpdate(subscription), {merge: true});

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart:
          subscription.items.data[0]?.current_period_start ?? null,
        currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        priceId: subscription.items.data[0]?.price?.id ?? null,
        interval:
          subscription.items.data[0]?.price?.recurring?.interval ?? null,
      },
    };
  }
);

// --------------------------------------------------
// ÃY"Ã» ArrÃ‡Â°ter le renouvellement
// --------------------------------------------------
export const setCancelAtPeriodEnd = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

      const uid = context.auth.uid;
      const cancelAtPeriodEnd = Boolean(data?.cancelAtPeriodEnd);

      const userDoc = await resolveUserDoc(uid);
      const customerId = userDoc.data?.stripeCustomerId as string | undefined;
      if (!customerId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun customer Stripe lié à ce compte."
        );
      }

      const subscriptionId = await resolveSubscriptionId(
        stripe,
        customerId,
        userDoc.data?.stripeSubscriptionId
      );
      if (!subscriptionId) {
        throw new functions.https.HttpsError(
          "not-found",
          "Aucun abonnement actif."
        );
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const scheduleId =
        typeof subscription.schedule === "string"
          ? subscription.schedule
          : subscription.schedule?.id ?? null;
      let schedule: Stripe.SubscriptionSchedule | null = null;
      if (scheduleId) {
        schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
        if (schedule.status === "canceled" || schedule.status === "released") {
          schedule = null;
        }
      }

      if (schedule) {
        const item = subscription.items.data[0];
        const currentPeriodEnd = item?.current_period_end ?? null;
        const currentPeriodStart = item?.current_period_start ?? null;
        const currentPriceId = item?.price?.id ?? null;
        const currentQuantity = item?.quantity ?? 1;

        if (!currentPeriodEnd || !currentPeriodStart || !currentPriceId) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "Impossible de modifier cet abonnement."
          );
        }

        const normalizePhase = (
          phase: Stripe.SubscriptionSchedule.Phase
        ): Stripe.SubscriptionScheduleUpdateParams.Phase => {
          const items = (phase.items ?? [])
            .map((phaseItem) => ({
              price:
                typeof phaseItem.price === "string"
                  ? phaseItem.price
                  : phaseItem.price?.id ?? null,
              quantity: phaseItem.quantity ?? 1,
            }))
            .filter((phaseItem) => phaseItem.price);

          const normalized: Stripe.SubscriptionScheduleUpdateParams.Phase = {
            start_date: phase.start_date ?? currentPeriodStart,
            items,
          };
          if (phase.end_date) {
            normalized.end_date = phase.end_date;
          }
          if (phase.billing_cycle_anchor) {
            normalized.billing_cycle_anchor = phase.billing_cycle_anchor;
          }
          if (phase.proration_behavior) {
            normalized.proration_behavior = phase.proration_behavior;
          }
          return normalized;
        };

        let phases = (schedule.phases ?? [])
          .map(normalizePhase)
          .filter((phase) => phase.items.length > 0);

        if (phases.length === 0) {
          phases = [
            {
              start_date: currentPeriodStart,
              end_date: currentPeriodEnd,
              items: [{ price: currentPriceId, quantity: currentQuantity }],
              proration_behavior: "none",
            },
          ];
        }

        if (cancelAtPeriodEnd) {
          const cutoff = currentPeriodEnd;
          let index = phases.findIndex((phase) => {
            const phaseStart =
              typeof phase.start_date === "number"
                ? phase.start_date
                : currentPeriodStart;
            const phaseEnd =
              typeof phase.end_date === "number"
                ? phase.end_date
                : phase.end_date === "now"
                  ? Math.floor(Date.now() / 1000)
                  : Number.POSITIVE_INFINITY;
            return phaseStart <= cutoff && phaseEnd >= cutoff;
          });
          if (index === -1) {
            index = phases.length - 1;
          }
          const trimmed = phases.slice(0, index + 1);
          trimmed[index] = {
            ...trimmed[index],
            end_date: cutoff,
          };

          await stripe.subscriptionSchedules.update(schedule.id, {
            end_behavior: "cancel",
            phases: trimmed,
          });

          await userDoc.ref.set(
            {
              ...buildSubscriptionUpdate(subscription),
              subscriptionCancelAtPeriodEnd: true,
              subscriptionScheduledInterval: null,
              subscriptionScheduledAt: null,
            },
            { merge: true }
          );

          return { status: subscription.status };
        }

        const lastIndex = phases.length - 1;
        if (lastIndex >= 0) {
          phases[lastIndex] = {
            ...phases[lastIndex],
            end_date: undefined,
          };
        }

        await stripe.subscriptionSchedules.update(schedule.id, {
          end_behavior: "release",
          phases,
        });

        await userDoc.ref.set(
          {
            ...buildSubscriptionUpdate(subscription),
            subscriptionCancelAtPeriodEnd: false,
          },
          { merge: true }
        );

        return { status: subscription.status };
      }

      const updatedSubscription = await stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: cancelAtPeriodEnd,
        }
      );

      await userDoc.ref.set(buildSubscriptionUpdate(updatedSubscription), {
        merge: true,
      });

      return { status: updatedSubscription.status };
    } catch (err) {
      handleStripeError(err, "Impossible de modifier le renouvellement.");
    }
  }
);

// --------------------------------------------------
// ÃY"Ã» Annuler immÃ‡Â°diatement
// --------------------------------------------------
export const cancelSubscriptionNow = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (_data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

      const uid = context.auth.uid;
      const userDoc = await resolveUserDoc(uid);
      const customerId = userDoc.data?.stripeCustomerId as string | undefined;
      if (!customerId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun customer Stripe lié à ce compte."
        );
      }

      const subscriptionId = await resolveSubscriptionId(
        stripe,
        customerId,
        userDoc.data?.stripeSubscriptionId
      );
      if (!subscriptionId) {
        throw new functions.https.HttpsError(
          "not-found",
          "Aucun abonnement actif."
        );
      }

      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      await userDoc.ref.set(buildSubscriptionUpdate(subscription), {merge: true});

      return { status: subscription.status };
    } catch (err) {
      handleStripeError(err, "Impossible d'annuler l'abonnement.");
    }
  }
);

// --------------------------------------------------
// ÃY"Ã» Changer d'abonnement
// --------------------------------------------------
export const changeSubscriptionPlan = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

      const plan = data?.plan as "month" | "year";
      if (!plan || !PRICE_IDS[plan]) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Plan invalide. Utiliser 'month' ou 'year'."
        );
      }

      const uid = context.auth.uid;
      const userDoc = await resolveUserDoc(uid);
      const result = await applyScheduledPlanChange({
        stripe,
        userDoc,
        plan,
        rawStartAt: data?.startAt,
      });

      return { status: result.subscription.status, switchAt: result.switchAt };
    } catch (err) {
      handleStripeError(err, "Impossible de changer l'abonnement.");
    }
  }
);

// --------------------------------------------------
// 🔹 Pré-paiement upgrade annuel
// --------------------------------------------------
export const createUpgradePaymentIntent = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

      const plan = data?.plan as "month" | "year";
      if (!plan || !PRICE_IDS[plan]) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Plan invalide. Utiliser 'month' ou 'year'."
        );
      }

      const uid = context.auth.uid;
      const userDoc = await resolveUserDoc(uid);
      const customerId = userDoc.data?.stripeCustomerId as string | undefined;
      if (!customerId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun customer Stripe lié à ce compte."
        );
      }
      if (userDoc.data?.subscriptionScheduledInterval === plan) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Un changement est déjà programmé."
        );
      }

      const subscriptionId = await resolveSubscriptionId(
        stripe,
        customerId,
        userDoc.data?.stripeSubscriptionId
      );
      if (!subscriptionId) {
        throw new functions.https.HttpsError(
          "not-found",
          "Aucun abonnement actif."
        );
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const item = subscription.items.data[0];
      const currentInterval = item?.price?.recurring?.interval ?? null;
      const currentPeriodEnd = item?.current_period_end ?? null;
      if (!currentPeriodEnd) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Impossible de modifier cet abonnement."
        );
      }
      if (currentInterval === plan) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Abonnement déjà sur ce plan."
        );
      }

      const switchAt = resolveSwitchAt(data?.startAt, currentPeriodEnd);
      const price = await stripe.prices.retrieve(PRICE_IDS[plan]);
      const amount = price.unit_amount;
      if (typeof amount !== "number") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Prix annuel indisponible."
        );
      }
      const monthlyPrice = await stripe.prices.retrieve(PRICE_IDS.month);
      const monthlyAmount = monthlyPrice.unit_amount ?? null;

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: price.currency || "eur",
        customer: customerId,
        metadata: {
          uid,
          plan,
          subscriptionId,
          switchAt: String(switchAt),
          upgrade_type: "scheduled_change",
        },
      });

      const scheduledAt =
        admin.firestore.Timestamp.fromMillis(switchAt * 1000);
      await userDoc.ref.set(
        {
          pendingUpgradePaymentIntentId: paymentIntent.id,
          pendingUpgradePlan: plan,
          pendingUpgradeSwitchAt: scheduledAt,
          pendingUpgradeCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {merge: true}
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency: price.currency || "eur",
        switchAt,
        priceId: price.id,
        monthlyAmount,
        monthlyCurrency: monthlyPrice.currency || "eur",
      };
    } catch (err) {
      handleStripeError(err, "Impossible de préparer l'upgrade.");
    }
  }
);

// --------------------------------------------------
// 🔹 Confirmer l'upgrade après paiement
// --------------------------------------------------
export const confirmUpgradePayment = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

      const paymentIntentId = data?.paymentIntentId as string | undefined;
      const billingEmail =
        typeof data?.billingEmail === "string" ? data.billingEmail.trim() : "";
      if (!paymentIntentId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Paiement manquant."
        );
      }

      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Paiement non confirmé."
        );
      }

      const metadata = paymentIntent.metadata || {};
      const upgradeType = metadata.upgrade_type;
      if (upgradeType !== "scheduled_change") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Paiement non valide pour un upgrade."
        );
      }
      const plan = metadata.plan as "month" | "year" | undefined;
      if (!plan || !PRICE_IDS[plan]) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Plan manquant sur le paiement."
        );
      }
      if (metadata.uid && metadata.uid !== context.auth.uid) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Paiement associé à un autre compte."
        );
      }

      const price = await stripe.prices.retrieve(PRICE_IDS[plan]);
      const expectedAmount = price.unit_amount;
      if (
        typeof expectedAmount === "number" &&
        paymentIntent.amount !== expectedAmount
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Montant du paiement invalide."
        );
      }
      if (
        typeof expectedAmount === "number" &&
        paymentIntent.amount_received < expectedAmount
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Paiement incomplet."
        );
      }
      if (price.currency && paymentIntent.currency !== price.currency) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Devise du paiement invalide."
        );
      }

      const uid = context.auth.uid;
      const userDoc = await resolveUserDoc(uid);

      const customerId = userDoc.data?.stripeCustomerId as string | undefined;
      if (!customerId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun customer Stripe lié à ce compte."
        );
      }
      const paymentCustomerId =
        typeof paymentIntent.customer === "string"
          ? paymentIntent.customer
          : paymentIntent.customer?.id ?? null;
      if (paymentCustomerId && paymentCustomerId !== customerId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Paiement associé à un autre client."
        );
      }
      if (billingEmail) {
        try {
          await stripe.customers.update(customerId, { email: billingEmail });
          await stripe.paymentIntents.update(paymentIntent.id, {
            receipt_email: billingEmail,
          });
        } catch (err) {
          console.error("Impossible de mettre à jour l'email de facturation:", err);
        }
      }

      const pendingId = userDoc.data?.pendingUpgradePaymentIntentId as
        | string
        | undefined;
      if (pendingId && pendingId !== paymentIntentId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Paiement non reconnu."
        );
      }
      const pendingPlan = userDoc.data?.pendingUpgradePlan as
        | "month"
        | "year"
        | undefined;
      if (pendingPlan && pendingPlan !== plan) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Paiement non reconnu."
        );
      }
      const pendingSwitchAt = userDoc.data?.pendingUpgradeSwitchAt as
        | admin.firestore.Timestamp
        | undefined;
      const pendingSwitchAtSeconds =
        typeof pendingSwitchAt?.seconds === "number"
          ? pendingSwitchAt.seconds
          : null;

      const rawSwitchAt =
        typeof metadata.switchAt === "string"
          ? Number(metadata.switchAt)
          : undefined;
      if (
        pendingSwitchAtSeconds !== null &&
        typeof rawSwitchAt === "number" &&
        pendingSwitchAtSeconds !== rawSwitchAt
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Paiement non reconnu."
        );
      }
      const result = await applyScheduledPlanChange({
        stripe,
        userDoc,
        plan,
        rawStartAt: rawSwitchAt,
      });

      await userDoc.ref.set(
        {
          pendingUpgradePaymentIntentId: null,
          pendingUpgradePlan: null,
          pendingUpgradeSwitchAt: null,
          pendingUpgradeCreatedAt: null,
          lastUpgradePaymentIntentId: paymentIntent.id,
          lastUpgradePaymentIntentAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {merge: true}
      );

      return { status: result.subscription.status, switchAt: result.switchAt };
    } catch (err) {
      handleStripeError(err, "Impossible de confirmer l'upgrade.");
    }
  }
);

// --------------------------------------------------
// 🔹 Annuler un changement d'abonnement programmé
// --------------------------------------------------
export const cancelScheduledPlanChange = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(
  async (_data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User not authenticated"
        );
      }
      const stripe = getStripeOrThrow();

      const uid = context.auth.uid;
      const userDoc = await resolveUserDoc(uid);
      const customerId = userDoc.data?.stripeCustomerId as string | undefined;
      if (!customerId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun customer Stripe lié à ce compte."
        );
      }

      const subscriptionId = await resolveSubscriptionId(
        stripe,
        customerId,
        userDoc.data?.stripeSubscriptionId
      );
      if (!subscriptionId) {
        throw new functions.https.HttpsError(
          "not-found",
          "Aucun abonnement actif."
        );
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const scheduleId =
        typeof subscription.schedule === "string"
          ? subscription.schedule
          : subscription.schedule?.id ?? null;
      if (!scheduleId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun changement programmé."
        );
      }

      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
      if (schedule.status !== "not_started" && schedule.status !== "active") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun changement programmé."
        );
      }
      const scheduledAt = userDoc.data?.subscriptionScheduledAt as
        | admin.firestore.Timestamp
        | null
        | undefined;
      const scheduledAtSeconds =
        typeof scheduledAt?.seconds === "number" ? scheduledAt.seconds : null;
      if (!scheduledAtSeconds) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Aucun changement programmé."
        );
      }
      if (scheduledAtSeconds <= Math.floor(Date.now() / 1000)) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Le changement a déjà commencé, annulation impossible."
        );
      }

      await stripe.subscriptionSchedules.release(scheduleId, {
        preserve_cancel_date: true,
      });

      await userDoc.ref.set(
        {
          subscriptionScheduledInterval: null,
          subscriptionScheduledAt: null,
        },
        {merge: true}
      );

      return { status: subscription.status };
    } catch (err) {
      handleStripeError(err, "Impossible d'annuler le changement.");
    }
  }
);

// --------------------------------------------------
// ÃY"Ã» Webhooks Stripe (temps rÃ‡Â©el)
// --------------------------------------------------
export const stripeWebhook = functions
  .runWith({
    secrets: [
      stripeSecretKey,
      stripeWebhookSecretKey,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpFrom,
    ],
  })
  .https.onRequest(async (req, res) => {
  const stripe = getStripeOrThrow();
  const stripeWebhookSecret = stripeWebhookSecretKey.value();
  if (!stripe || !stripeWebhookSecret) {
    res.status(500).send("Stripe secret manquant.");
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).send("Signature manquante.");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      stripeWebhookSecret
    );
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    console.log("stripeWebhook event:", event.type);
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("subscription event:", {
          id: subscription.id,
          status: subscription.status,
          latest_invoice:
            typeof subscription.latest_invoice === "string"
              ? subscription.latest_invoice
              : subscription.latest_invoice?.id,
        });
        const uid = await resolveUidFromSubscription(stripe, subscription);
        if (!uid) break;

        const userDoc = await resolveUserDoc(uid);
        const update = buildSubscriptionUpdate(subscription) as Record<
          string,
          unknown
        >;
        const scheduledInterval = userDoc.data?.subscriptionScheduledInterval as
          | "month"
          | "year"
          | null
          | undefined;
        const scheduledAt = userDoc.data?.subscriptionScheduledAt as
          | admin.firestore.Timestamp
          | null
          | undefined;
        const scheduledAtSeconds =
          typeof scheduledAt?.seconds === "number"
            ? scheduledAt.seconds
            : null;
        const currentInterval =
          subscription.items.data[0]?.price?.recurring?.interval ?? null;
        const currentPeriodStart =
          subscription.items.data[0]?.current_period_start ?? null;
        if (scheduledInterval && currentInterval === scheduledInterval) {
          if (
            !scheduledAtSeconds ||
            (currentPeriodStart && currentPeriodStart >= scheduledAtSeconds)
          ) {
            update.subscriptionScheduledInterval = null;
            update.subscriptionScheduledAt = null;
          }
        }
        await userDoc.ref.set(update, {merge: true});

        if (subscription.latest_invoice) {
          const invoiceId =
            typeof subscription.latest_invoice === "string"
              ? subscription.latest_invoice
              : subscription.latest_invoice?.id;
          if (invoiceId) {
            const invoice = await stripe.invoices.retrieve(invoiceId);
            console.log("latest invoice from subscription:", {
              id: invoice.id,
              status: invoice.status,
              customer_email: invoice.customer_email,
            });
            await sendSubscriptionEmailIfNeeded(stripe, invoice);
          }
        }
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("payment_intent.succeeded:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });
        await handlePaymentIntentSucceeded(stripe, paymentIntent);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("invoice event:", {
          id: invoice.id,
          status: invoice.status,
          customer: invoice.customer,
          customer_email: invoice.customer_email,
        });
        const shouldSendEmail =
          event.type === "invoice.paid" ||
          event.type === "invoice.payment_succeeded";
        const subscriptionRaw =
          (invoice as any).subscription ??
          (invoice as any).subscription_details?.subscription ??
          (invoice as any).lines?.data?.[0]?.subscription ??
          null;
        const subscriptionId =
          typeof subscriptionRaw === "string"
            ? subscriptionRaw
            : subscriptionRaw?.id ?? null;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );
        const uid = await resolveUidFromSubscription(stripe, subscription);
        if (!uid) break;

        const userDoc = await resolveUserDoc(uid);
        await userDoc.ref.set(buildSubscriptionUpdate(subscription), {
          merge: true,
        });

        if (shouldSendEmail) {
          try {
            await sendSubscriptionEmailIfNeeded(stripe, invoice);
            console.log("email abonnement envoye");
          } catch (err) {
            console.error("Erreur envoi email abonnement:", err);
          }
        } else {
          console.log("email abonnement ignore pour event:", event.type);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    res.status(500).send("Webhook handler error");
    return;
  }

  res.json({ received: true });
});
