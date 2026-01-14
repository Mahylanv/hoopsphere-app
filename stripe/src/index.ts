// stripe/src/index.ts

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();

// 🔐 Stripe (clé secrète depuis functions:config)
const stripeSecret = functions.config().stripe?.secret || "";
const stripe = stripeSecret ?
  new Stripe(stripeSecret, {apiVersion: "2025-12-15.clover"}) :
  null;

// 💳 IDs Stripe des abonnements
const PRICE_IDS = {
  month: "price_1SpTpMAUQxk5OdPwJQZxKCCH",
  year: "price_1SpTpMAUQxk5OdPwYrqPudN3",
};

// --------------------------------------------------
// 🔹 Paiement simple (ONE-SHOT / TEST)
// --------------------------------------------------
export const createPaymentIntent = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User not authenticated"
      );
    }
    if (!stripe) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Stripe secret manquant."
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 499, // 4,99 €
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
// 🔹 Abonnement Premium (mensuel / annuel)
// --------------------------------------------------
export const createSubscription = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User not authenticated"
      );
    }
    if (!stripe) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Stripe secret manquant."
      );
    }

    const plan = data?.plan as "month" | "year";

    if (!plan || !PRICE_IDS[plan]) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Plan invalide. Utiliser 'month' ou 'year'."
      );
    }

    const uid = context.auth.uid;
    const priceId = PRICE_IDS[plan];

    const customer = await stripe.customers.create({
      metadata: {uid},
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      {customer: customer.id},
      {apiVersion: "2025-12-15.clover"}
    );

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{price: priceId}],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {uid},
    });

    const latestInvoice = subscription.latest_invoice;

    let paymentIntentId: string | null = null;
    let paymentIntentClientSecret: string | null = null;

    // 1️⃣ latest_invoice est un ID string
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

    // 2️⃣ latest_invoice est un objet Invoice
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

    if (!paymentIntentClientSecret && !paymentIntentId) {
      throw new functions.https.HttpsError(
        "internal",
        "PaymentIntent introuvable."
      );
    }

    if (!paymentIntentClientSecret && paymentIntentId) {
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentIntentClientSecret = paymentIntent.client_secret;
    }

    return {
      clientSecret: paymentIntentClientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      ephemeralKeySecret: ephemeralKey.secret,
    };
  }
);
