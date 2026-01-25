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
  const message = typeof err?.message === "string" ? err.message : fallback;
  throw new functions.https.HttpsError("internal", message);
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

const sendSubscriptionEmail = async (invoice: Stripe.Invoice) => {
  const smtp = resolveSmtpConfig();
  if (!smtp) {
    console.log("SMTP non configuré, email ignoré.");
    return;
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id ?? null;

  const userDoc = customerId
    ? await resolveUserByStripeCustomerId(customerId)
    : null;
  const email =
    invoice.customer_email ||
    (userDoc?.data?.email as string | undefined) ||
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

  const lines = [
    "Bonjour,",
    "",
    "Votre abonnement Hoopsphere est confirmé.",
    amountLabel ? `Montant : ${amountLabel}` : null,
    invoiceNumber ? `Facture : ${invoiceNumber}` : null,
    pdfUrl ? `PDF : ${pdfUrl}` : hostedUrl ? `Facture en ligne : ${hostedUrl}` : null,
    "",
    "Merci pour votre confiance.",
    "",
    "L'équipe Hoopsphere",
  ].filter(Boolean);

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
  });
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
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
      metadata: {uid},
    });

    const latestInvoice = subscription.latest_invoice;

    let paymentIntentId: string | null = null;
    let paymentIntentClientSecret: string | null = null;
    let setupIntentClientSecret: string | null = null;

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

    const pendingSetupIntent =
      subscription.pending_setup_intent as
        | string
        | Stripe.SetupIntent
        | null
        | undefined;

    if (typeof pendingSetupIntent === "string") {
      const setupIntent =
        await stripe.setupIntents.retrieve(pendingSetupIntent);
      setupIntentClientSecret = setupIntent.client_secret;
    } else if (
      pendingSetupIntent &&
      typeof pendingSetupIntent === "object"
    ) {
      if (typeof pendingSetupIntent.client_secret === "string") {
        setupIntentClientSecret = pendingSetupIntent.client_secret;
      } else if (typeof pendingSetupIntent.id === "string") {
        const setupIntent =
          await stripe.setupIntents.retrieve(pendingSetupIntent.id);
        setupIntentClientSecret = setupIntent.client_secret;
      }
    }

    if (
      !paymentIntentClientSecret &&
      !paymentIntentId &&
      !setupIntentClientSecret
    ) {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: "off_session",
      });
      setupIntentClientSecret = setupIntent.client_secret;
    }

    if (!paymentIntentClientSecret && paymentIntentId) {
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentIntentClientSecret = paymentIntent.client_secret;
    }

    await userDoc.ref.set(buildSubscriptionUpdate(subscription), {merge: true});

      return {
        clientSecret: paymentIntentClientSecret,
        setupIntentClientSecret,
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

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      await userDoc.ref.set(buildSubscriptionUpdate(subscription), {merge: true});

      return { status: subscription.status };
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
      const itemId = subscription.items.data[0]?.id;
      if (!itemId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Impossible de modifier cet abonnement."
        );
      }

      const updated = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
        // Applique le nouveau tarif au prochain cycle sans facturer tout de suite.
        billing_cycle_anchor: "unchanged",
        proration_behavior: "none",
        items: [{id: itemId, price: PRICE_IDS[plan]}],
      });

      await userDoc.ref.set(buildSubscriptionUpdate(updated), {merge: true});

      return { status: updated.status };
    } catch (err) {
      handleStripeError(err, "Impossible de changer l'abonnement.");
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
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = await resolveUidFromSubscription(stripe, subscription);
        if (!uid) break;

        const userDoc = await resolveUserDoc(uid);
        await userDoc.ref.set(buildSubscriptionUpdate(subscription), {
          merge: true,
        });
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
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
            await sendSubscriptionEmail(invoice);
          } catch (err) {
            console.error("Erreur envoi email abonnement:", err);
          }
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
