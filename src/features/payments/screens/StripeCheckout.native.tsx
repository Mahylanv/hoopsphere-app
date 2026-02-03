import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  TextInput,
  Text,
  NativeModules,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

const canUseStripeNative =
  Platform.OS === "android"
    ? Boolean(NativeModules?.OnrampSdk && NativeModules?.StripeSdk)
    : true;
let StripeNative: any = null;
try {
  if (canUseStripeNative) {
    StripeNative = require("@stripe/stripe-react-native");
  }
} catch {
  StripeNative = null;
}

const CardField = StripeNative?.CardField ?? null;
const confirmPaymentFn = StripeNative?.confirmPayment ?? null;
const confirmSetupIntentFn = StripeNative?.confirmSetupIntent ?? null;

const LockIcon = () => (
  <View className="w-16 h-16 rounded-full bg-orange-500/20 items-center justify-center mb-3">
    <Ionicons name="lock-closed" size={26} color="#F97316" />
  </View>
);
import { RootStackParamList } from "../../../types";
import { auth, db } from "../../../config/firebaseConfig";

type NavProp = NativeStackNavigationProp<RootStackParamList, "StripeCheckout">;
type RouteProps = RouteProp<RootStackParamList, "StripeCheckout">;
type PremiumNavType = "joueur" | "club";

type CheckoutConfig = {
  clientSecret: string;
  intentType: "payment" | "setup";
  planLabel: string;
  priceLabel: string;
  renewalLabel: string;
  prefillName: string;
  prefillEmail: string;
};

type CheckoutMessage =
  | {
      type: "payment_success";
      intentId?: string;
      paymentMethodId?: string;
      billingEmail?: string;
      receiptOptIn?: boolean;
    }
  | { type: "payment_error"; message?: string }
  | { type: "go_back" }
  | { type: "debug"; payload?: Record<string, any> };

const buildCheckoutHtml = (config: CheckoutConfig, publishableKey: string) => {
  const htmlConfig = {
    publishableKey,
    clientSecret: config.clientSecret,
    intentType: config.intentType,
    planLabel: config.planLabel,
    priceLabel: config.priceLabel,
    renewalLabel: config.renewalLabel,
    prefillName: config.prefillName,
    prefillEmail: config.prefillEmail,
    platform: Platform.OS,
  };

  const platformClass = Platform.OS === "android" ? "android" : "ios";
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg: #0e0d0d;
        --surface: #111111;
        --surface-2: #0b0b0b;
        --border: rgba(255, 255, 255, 0.08);
        --border-strong: rgba(255, 255, 255, 0.14);
        --accent: #f97316;
        --accent-soft: rgba(249, 115, 22, 0.16);
        --text: #ffffff;
        --muted: #9ca3af;
        --danger: #fca5a5;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        height: 100%;
        margin: 0;
        color-scheme: light;
      }

      body {
        font-family: "Space Grotesk", "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
        -webkit-font-smoothing: antialiased;
        overscroll-behavior: none;
      }

      .orb {
        position: fixed;
        border-radius: 999px;
        pointer-events: none;
        z-index: 0;
      }

      .orb.orange {
        width: 160px;
        height: 160px;
        top: -40px;
        right: -40px;
        background: rgba(249, 115, 22, 0.18);
      }

      .orb.blue {
        width: 140px;
        height: 140px;
        bottom: 40px;
        left: -50px;
        background: rgba(37, 99, 235, 0.16);
      }

      .container {
        position: relative;
        z-index: 1;
        max-width: 560px;
        margin: 0 auto;
        padding: 28px 20px 40px;
      }

      .hero {
        text-align: center;
        margin-bottom: 20px;
      }

      .back-link {
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
        cursor: pointer;
        max-width: fit-content;
      }

      body.android .back-link {
        display: none;
      }

      .back-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        font-size: 16px;
        line-height: 16px;
      }

      .back-label {
        line-height: 16px;
      }

      .lock-circle {
        width: 64px;
        height: 64px;
        border-radius: 999px;
        background: rgba(249, 115, 22, 0.2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }

      .lock-circle svg {
        width: 26px;
        height: 26px;
        fill: var(--accent);
      }

      .hero h1 {
        font-size: 24px;
        margin: 0;
        font-weight: 700;
      }

      .hero p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
      }

      .price-pill {
        display: inline-block;
        margin-top: 12px;
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.06);
        font-weight: 600;
        font-size: 14px;
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .card-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 12px;
      }

      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
        color: var(--muted);
        font-size: 14px;
      }

      .row strong {
        color: var(--text);
        font-weight: 600;
      }

      .note {
        color: var(--muted);
        font-size: 12px;
        margin-top: 12px;
      }

      .field {
        margin-bottom: 14px;
      }

      label {
        display: block;
        color: var(--muted);
        font-size: 12px;
        margin-bottom: 6px;
      }

      input {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--border-strong);
        background: rgba(0, 0, 0, 0.4);
        padding: 12px 14px;
        font-size: 15px;
        color: var(--text);
      }

      input:focus {
        outline: none;
        border-color: rgba(249, 115, 22, 0.6);
        box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.12);
      }

      .stripe-field {
        border-radius: 12px;
        border: 1px solid var(--border-strong);
        background: var(--surface-2);
        padding: 0 14px;
        min-height: 44px;
        display: flex;
        align-items: center;
        color: var(--text);
      }

      .stripe-field.is-focused {
        border-color: rgba(249, 115, 22, 0.6);
        box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.12);
      }

      .StripeElement {
        width: 100%;
      }

      .StripeElement iframe {
        background-color: transparent !important;
      }

      .stripe-field .StripeElement,
      .stripe-field .StripeElement iframe {
        height: 100% !important;
      }

      .stripe-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .checkbox-field {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        color: var(--muted);
        font-size: 14px;
      }

      .checkbox-field input {
        width: 18px;
        height: 18px;
        accent-color: var(--accent);
      }

      .checkbox-field label {
        display: inline-block;
        margin: 0;
        line-height: 1.2;
      }

      button {
        width: 100%;
        border: none;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 16px;
        font-weight: 700;
        padding: 14px 16px;
        cursor: pointer;
        transition: opacity 0.2s ease;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .error {
        color: var(--danger);
        font-size: 13px;
        min-height: 18px;
        margin-top: 8px;
      }

      .footer-note {
        color: var(--muted);
        font-size: 12px;
        text-align: center;
        margin-top: 12px;
      }

      @media (max-width: 420px) {
        .stripe-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body class="${platformClass}">
    <div class="orb orange"></div>
    <div class="orb blue"></div>

    <div class="container">
      <button id="back-button" class="back-link" type="button">
        <span class="back-icon" aria-hidden="true">&larr;</span>
        <span class="back-label">Retour</span>
      </button>
      <div class="hero">
        <div class="lock-circle">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 1.75c-2.9 0-5.25 2.35-5.25 5.25V10H5.5c-1.24 0-2.25 1.01-2.25 2.25v7.5C3.25 21 4.26 22 5.5 22h13c1.24 0 2.25-1 2.25-2.25v-7.5c0-1.24-1-2.25-2.25-2.25h-1.25V7c0-2.9-2.35-5.25-5.25-5.25zm3.25 8.25H8.75V7a3.25 3.25 0 0 1 6.5 0v3zm-3.25 4a1.5 1.5 0 0 1 1.5 1.5c0 .63-.39 1.16-.94 1.38v1.12a.56.56 0 1 1-1.12 0v-1.12a1.5 1.5 0 0 1 .56-2.88z"
            />
          </svg>
        </div>
        <h1>Paiement sécurisé</h1>
        <p>Finalise ton abonnement Premium en quelques secondes.</p>
        <div class="price-pill">${config.priceLabel}</div>
      </div>

      <div class="card">
        <div class="card-title">Resume</div>
        <div class="row">
          <span>Plan</span>
          <strong>${config.planLabel}</strong>
        </div>
        <div class="row">
          <span>Facturation</span>
          <strong>${config.renewalLabel}</strong>
        </div>
        <p class="note">Renouvellement automatique. Annulable a tout moment.</p>
      </div>

      <div class="card">
        <div class="card-title">Infos de facturation</div>

        <div class="field">
          <label for="name">Nom complet</label>
          <input id="name" name="name" autocomplete="name" placeholder="Ex: Jean Dupont" />
        </div>

        <div class="field">
          <label for="email">Adresse email</label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="exemple@email.com"
          />
        </div>

        <div class="checkbox-field">
          <input id="receipt" name="receipt" type="checkbox" />
          <label for="receipt">Recevoir un reçu par email</label>
        </div>

        <div class="field">
          <label>Numero de carte</label>
          <div id="card-number" class="stripe-field"></div>
        </div>

        <div class="stripe-row">
          <div class="field">
            <label>Date d'expiration</label>
            <div id="card-expiry" class="stripe-field"></div>
          </div>
          <div class="field">
            <label>CVC</label>
            <div id="card-cvc" class="stripe-field"></div>
          </div>
        </div>

        <div id="error" class="error"></div>

        <button id="submit" type="button">
          <span id="button-text">Confirmer et payer</span>
        </button>

        <div class="footer-note">
          Paiement sécurisé par Stripe. Vos informations ne sont jamais stockées.
        </div>
      </div>
    </div>

    <script src="https://js.stripe.com/v3/"></script>
    <script>
      (function () {
        const config = ${JSON.stringify(htmlConfig)};
        window.onerror = function (message, source, lineno, colno, error) {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: "payment_error",
                  message:
                    "WebView error: " +
                    String(message) +
                    " @" +
                    String(lineno) +
                    ":" +
                    String(colno),
                })
              );
            }
          } catch {}
          return false;
        };

        window.addEventListener("unhandledrejection", function (event) {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: "payment_error",
                  message:
                    "Unhandled promise: " +
                    String(event && event.reason ? event.reason : "unknown"),
                })
              );
            }
          } catch {}
        });
        const stripe = Stripe(config.publishableKey);
        const isAndroid = config.platform === "android";
        const appearance = {
          theme: "night",
          variables: {
            colorText: "#ffffff",
            colorIcon: "#ffffff",
            colorPrimary: "#f97316",
            colorDanger: "#fca5a5",
            colorBackground: "#00000000",
            fontFamily: isAndroid ? "sans-serif" : "Space Grotesk, sans-serif",
          },
          rules: {
            ".Input": {
              color: "#ffffff",
            },
            ".Input::placeholder": {
              color: "#6b7280",
            },
          },
        };
        const elements = stripe.elements({ locale: "fr", appearance });

        const style = {
          base: {
            color: "#FFFFFF",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "16px",
            iconColor: "#FFFFFF",
            backgroundColor: "#00000000",

            // 🔥 FIX ANDROID WEBVIEW
            WebkitTextFillColor: "#FFFFFF",
            caretColor: "#FFFFFF",

            "::placeholder": {
              color: "#9CA3AF",
              WebkitTextFillColor: "#9CA3AF",
            },
          },
          invalid: {
            color: "#FCA5A5",
            WebkitTextFillColor: "#FCA5A5",
          },
        };

        const elementStyle = isAndroid
          ? {
              ...style,
              base: {
                ...style.base,
                color: "#ffffff",
                iconColor: "#ffffff",
                caretColor: "#ffffff",
                fontFamily: "sans-serif",
              },
            }
          : style;

        const cardNumber = elements.create("cardNumber", {
          style: elementStyle,
          showIcon: true,
        });
        const cardExpiry = elements.create("cardExpiry", { style: elementStyle });
        const cardCvc = elements.create("cardCvc", { style: elementStyle });

        cardNumber.mount("#card-number");
        cardExpiry.mount("#card-expiry");
        cardCvc.mount("#card-cvc");

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const receiptInput = document.getElementById("receipt");
        const submitButton = document.getElementById("submit");
        const buttonText = document.getElementById("button-text");
        const errorEl = document.getElementById("error");
        const stripeFields = Array.from(document.querySelectorAll(".stripe-field"));
        const backButton = document.getElementById("back-button");

        if (config.prefillName) {
          nameInput.value = config.prefillName;
        }

        if (config.prefillEmail) {
          emailInput.value = config.prefillEmail;
          receiptInput.checked = true;
        }

        const sendGoBack = () => {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: "go_back" })
            );
          }
        };

        if (backButton) {
          const onBack = (event) => {
            event.preventDefault();
            event.stopPropagation();
            sendGoBack();
          };
          backButton.addEventListener("click", onBack);
          backButton.addEventListener("touchstart", onBack, { passive: false });
          backButton.addEventListener("touchend", onBack);
        }

        let activeStripeElement = null;
        const state = {
          number: false,
          expiry: false,
          cvc: false,
          loading: false,
        };

        const blurAll = () => {
          if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
          if (activeStripeElement && activeStripeElement.blur) {
            activeStripeElement.blur();
          }
        };

        if (!isAndroid) {
          document.addEventListener("touchstart", (event) => {
            const target = event.target;
            if (!target.closest("input") && !target.closest(".stripe-field") && !target.closest(".StripeElement")) {
              blurAll();
            }
          });

          document.addEventListener("mousedown", (event) => {
            const target = event.target;
            if (!target.closest("input") && !target.closest(".stripe-field") && !target.closest(".StripeElement")) {
              blurAll();
            }
          });
        }

        const setLoading = (isLoading) => {
          state.loading = isLoading;
          submitButton.disabled = isLoading || !(state.number && state.expiry && state.cvc);
          buttonText.textContent = isLoading ? "Paiement en cours..." : "Confirmer et payer";
        };

        const setError = (message) => {
          errorEl.textContent = message || "";
        };

        const updateReady = () => {
          if (!state.loading) {
            submitButton.disabled = !(state.number && state.expiry && state.cvc);
          }
        };

        const bindStripeElement = (element, index, key) => {
          const field = stripeFields[index];
          element.on("focus", () => {
            activeStripeElement = element;
            field.classList.add("is-focused");
          });
          element.on("blur", () => {
            field.classList.remove("is-focused");
          });
          element.on("change", (event) => {
            state[key] = event.complete;
            if (event.error) {
              setError(event.error.message);
            } else {
              setError("");
            }
            updateReady();
          });
        };

        bindStripeElement(cardNumber, 0, "number");
        bindStripeElement(cardExpiry, 1, "expiry");
        bindStripeElement(cardCvc, 2, "cvc");

        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          try {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: "debug",
                payload: {
                  userAgent: navigator.userAgent,
                  prefersDark:
                    window.matchMedia &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches,
                  colorScheme:
                    (window.getComputedStyle(document.documentElement) || {})
                      .colorScheme || "",
                },
              })
            );
          } catch {}
        }

        submitButton.addEventListener("click", async () => {
          if (submitButton.disabled) return;
          setError("");
          setLoading(true);

          const emailValue = emailInput.value ? emailInput.value.trim() : "";
          const billingDetails = {
            name: nameInput.value || undefined,
            email: emailValue || undefined,
          };

          let result;
          try {
            if (config.intentType === "payment") {
              // Always pass the billing email to Stripe when provided so
              // receipts/invoices go to the email entered in the form.
              const shouldSendReceipt = Boolean(emailValue);
              const confirmOptions = {
                payment_method: {
                  card: cardNumber,
                  billing_details: billingDetails,
                },
                ...(shouldSendReceipt ? { receipt_email: emailValue } : {}),
              };
              result = await stripe.confirmCardPayment(
                config.clientSecret,
                confirmOptions
              );
            } else {
              result = await stripe.confirmCardSetup(config.clientSecret, {
                payment_method: {
                  card: cardNumber,
                  billing_details: billingDetails,
                },
              });
            }
          } catch (error) {
            setError("Une erreur est survenue. Merci de réessayer.");
            setLoading(false);
            return;
          }

          if (result.error) {
            setError(result.error.message || "Une erreur est survenue.");
            setLoading(false);
            return;
          }

          const intent = result.paymentIntent || result.setupIntent;
          const status = intent && intent.status;
          const intentId = intent && intent.id;
          const paymentMethodId =
            intent && "payment_method" in intent ? intent.payment_method : null;
          if (
            status === "succeeded" ||
            status === "processing" ||
            status === "requires_capture"
          ) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: "payment_success",
                  intentId,
                  paymentMethodId,
                  billingEmail: emailValue || undefined,
                  receiptOptIn: Boolean(receiptInput.checked),
                })
              );
            }
          } else {
            setError("Le paiement n'a pas été validé. Merci de réessayer.");
            setLoading(false);
          }
        });

        setLoading(false);
        updateReady();
      })();
    </script>
  </body>
</html>`;
};

export default function StripeCheckout() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { interval, flow = "subscription", startAt } = route.params;
  const isUpgrade = flow === "upgrade";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [upgradeIntentId, setUpgradeIntentId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [nativeName, setNativeName] = useState("");
  const [nativeEmail, setNativeEmail] = useState("");
  const [nativeReceipt, setNativeReceipt] = useState(false);
  const [nativeCardComplete, setNativeCardComplete] = useState(false);
  const [nativeLoading, setNativeLoading] = useState(false);
  const hasCompletedRef = useRef(false);

  const functions = getFunctions(getApp());
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const resolvePremiumTarget = async (
    uid: string
  ): Promise<{ ref: ReturnType<typeof doc>; navType: PremiumNavType }> => {
    let savedType: string | null = null;
    try {
      savedType = await AsyncStorage.getItem("userType");
    } catch {}

    if (savedType === "club") {
      return { ref: doc(db, "clubs", uid), navType: "club" };
    }
    if (savedType === "joueur") {
      return { ref: doc(db, "joueurs", uid), navType: "joueur" };
    }

    const joueurRef = doc(db, "joueurs", uid);
    const clubRef = doc(db, "clubs", uid);
    const [joueurSnap, clubSnap] = await Promise.all([
      getDoc(joueurRef),
      getDoc(clubRef),
    ]);

    if (clubSnap.exists()) {
      return { ref: clubRef, navType: "club" };
    }

    return { ref: joueurRef, navType: "joueur" };
  };

  const markPremium = async (): Promise<PremiumNavType> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Utilisateur non connecte.");
    }

    const target = await resolvePremiumTarget(user.uid);
    await updateDoc(target.ref, {
      premium: true,
      premiumSince: serverTimestamp(),
    });

    return target.navType;
  };

  const getPrefillName = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) return "";

    const authName = user.displayName?.trim();
    if (authName) return authName;

    try {
      const target = await resolvePremiumTarget(user.uid);
      const snap = await getDoc(target.ref);
      if (!snap.exists()) return "";

      const data = snap.data() as Record<string, any>;
      if (target.navType === "club") {
        return (data.nom || data.name || "").toString().trim();
      }

      const fullName = (data.fullName || "").toString().trim();
      if (fullName) return fullName;

      const firstName = (data.prenom || "").toString().trim();
      const lastName = (data.nom || "").toString().trim();
      return `${firstName} ${lastName}`.trim();
    } catch {
      return "";
    }
  };

  const handleNativePayment = async () => {
    if (!config) return;
    if (!confirmPaymentFn || !confirmSetupIntentFn) {
      setError(
        "Le module Stripe natif n'est pas disponible sur cet Android. Lance un build dev avec Stripe."
      );
      return;
    }
    if (!nativeCardComplete) {
      setError("Merci de saisir une carte valide.");
      return;
    }
    const emailValue = nativeEmail.trim();
    const billingDetails = {
      name: nativeName || undefined,
      email: emailValue || undefined,
    };
    setNativeLoading(true);
    setError(null);
    hasCompletedRef.current = false;

    try {
      if (config.intentType === "payment") {
        const result = await confirmPaymentFn(config.clientSecret, {
          paymentMethodType: "Card",
          paymentMethodData: { billingDetails },
        });
        if (result.error) {
          setError(result.error.message || "Une erreur est survenue.");
          return;
        }
        const intent = result.paymentIntent;
        await finalizePayment({
          intentId: intent?.id ?? null,
          paymentMethodId:
            intent?.paymentMethod?.id || intent?.paymentMethodId || null,
          billingEmail: emailValue || undefined,
          receiptOptIn: nativeReceipt,
        });
      } else {
        const result = await confirmSetupIntentFn(config.clientSecret, {
          paymentMethodType: "Card",
          paymentMethodData: { billingDetails },
        });
        if (result.error) {
          setError(result.error.message || "Une erreur est survenue.");
          return;
        }
        const intent = result.setupIntent;
        await finalizePayment({
          intentId: intent?.id ?? null,
          paymentMethodId:
            intent?.paymentMethod?.id || intent?.paymentMethodId || null,
          billingEmail: emailValue || undefined,
          receiptOptIn: nativeReceipt,
        });
      }
    } catch (e: any) {
      setError(e?.message || "Une erreur est survenue.");
    } finally {
      setNativeLoading(false);
    }
  };

  const finalizePayment = async (params: {
    intentId?: string | null;
    paymentMethodId?: string | null;
    billingEmail?: string;
    receiptOptIn?: boolean;
  }) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    try {
      const billingEmail =
        typeof params.billingEmail === "string" ? params.billingEmail.trim() : "";
      if (isUpgrade) {
        const intentId = params.intentId || upgradeIntentId;
        if (!intentId) {
          throw new Error(
            "Paiement validé mais identifiant de transaction manquant."
          );
        }
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
        const confirmUpgradePayment = httpsCallable(
          functions,
          "confirmUpgradePayment"
        );
        const res: any = await confirmUpgradePayment({
          paymentIntentId: intentId,
          billingEmail: billingEmail || undefined,
        });
        const startLabel = formatDateLabel(
          typeof res?.data?.switchAt === "number"
            ? res.data.switchAt * 1000
            : startAt
        );
        Alert.alert(
          "Upgrade annuel confirmé",
          startLabel
            ? `Ton abonnement annuel démarrera le ${startLabel}.`
            : "Ton abonnement annuel a bien été programmé.",
          [
            {
              text: "OK",
              onPress: () => {
                if (navigation?.canGoBack?.()) {
                  navigation.pop(2);
                } else {
                  navigation.navigate("SubscriptionSettings");
                }
              },
            },
          ]
        );
        return;
      }

      if (config?.intentType === "setup") {
        const paymentMethodId = params.paymentMethodId;
        if (!paymentMethodId || !subscriptionId) {
          throw new Error(
            "Paiement validé mais identifiant de carte manquant."
          );
        }
        const confirmSubscriptionPayment = httpsCallable(
          functions,
          "confirmSubscriptionPayment"
        );
        await confirmSubscriptionPayment({
          paymentMethodId,
          subscriptionId,
          billingEmail: billingEmail || undefined,
        });
      }

      const getSubscriptionInfo = httpsCallable(functions, "getSubscriptionInfo");
      const res: any = await getSubscriptionInfo({});
      const status = res?.data?.subscription?.status as
        | string
        | null
        | undefined;
      if (status !== "active" && status !== "trialing") {
        Alert.alert(
          "Paiement en cours",
          "Le paiement est en cours de confirmation. Ton abonnement sera activé dès validation (tu peux rafraîchir dans les paramètres d’abonnement).",
          [
            {
              text: "OK",
              onPress: () => {
                if (navigation?.canGoBack?.()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("SubscriptionSettings");
                }
              },
            },
          ]
        );
        return;
      }

      const navType = await markPremium();
      Alert.alert(
        "Succès",
        "Abonnement activé ! Un email de confirmation avec la facture a bien été envoyé.",
        [
          {
            text: "OK",
            onPress: () => {
              if (navType === "club") {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "MainTabsClub",
                      params: { screen: "Home" },
                    },
                  ],
                });
              } else {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "MainTabs",
                      params: { screen: "HomeScreen" },
                    },
                  ],
                });
              }
            },
          },
        ]
      );
    } catch (err: any) {
      const code = err?.code || "";
      const message = err?.message || "";
      if (isUpgrade && (code === "unauthenticated" || message === "unauthenticated")) {
        const startLabel = formatDateLabel(startAt);
        Alert.alert(
          "Paiement reçu",
          startLabel
            ? `Ton paiement est confirmé. L'upgrade sera appliqué d'ici quelques instants (début le ${startLabel}).`
            : "Ton paiement est confirmé. L'upgrade sera appliqué d'ici quelques instants.",
          [
            {
              text: "OK",
              onPress: () => {
                if (navigation?.canGoBack?.()) {
                  navigation.pop(2);
                } else {
                  navigation.navigate("SubscriptionSettings");
                }
              },
            },
          ]
        );
        return;
      }
      setError(err?.message || "Erreur lors de la mise à jour du compte.");
    }
  };

  const formatAmountLabel = (
    amount?: number | null,
    currency?: string | null
  ) => {
    if (typeof amount !== "number") return null;
    const safeCurrency = currency ? currency.toUpperCase() : "EUR";
    return `${(amount / 100).toFixed(2)} ${safeCurrency}`;
  };

  const formatDateLabel = (value?: number | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("fr-FR");
  };

  const startCheckout = async () => {
    if (!publishableKey) {
      setError("Cle Stripe manquante. Merci de verifier la configuration.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    hasCompletedRef.current = false;

    try {
      if (isUpgrade) {
        const createUpgradePaymentIntent = httpsCallable(
          functions,
          "createUpgradePaymentIntent"
        );
        const res: any = await createUpgradePaymentIntent({
          plan: interval,
          startAt,
        });
        const clientSecret = res?.data?.clientSecret;
        const paymentIntentId = res?.data?.paymentIntentId ?? null;
        const amount = res?.data?.amount as number | null | undefined;
        const currency = res?.data?.currency as string | null | undefined;
        const scheduledStartAt =
          typeof res?.data?.switchAt === "number"
            ? res.data.switchAt * 1000
            : startAt ?? null;

        if (!clientSecret) {
          throw new Error("Impossible de démarrer le paiement.");
        }

        const amountLabel = formatAmountLabel(amount, currency);
        const startLabel = formatDateLabel(scheduledStartAt);
        const planLabel =
          interval === "year" ? "Abonnement annuel" : "Abonnement mensuel";
        const priceLabel = amountLabel
          ? `${amountLabel} (paiement immédiat)`
          : interval === "year"
            ? "19,99 EUR (paiement immédiat)"
            : "2,49 EUR (paiement immédiat)";
        const renewalLabel = startLabel
          ? `Débute le ${startLabel}`
          : "Débute à la fin de la période";
        const prefillName = await getPrefillName();

        setUpgradeIntentId(paymentIntentId);
        setConfig({
          clientSecret,
          intentType: "payment",
          planLabel,
          priceLabel,
          renewalLabel,
          prefillName,
          prefillEmail: auth.currentUser?.email ?? "",
        });
        setLoading(false);
        return;
      }

      const createSubscription = httpsCallable(functions, "createSubscription");
      const res: any = await createSubscription({
        plan: interval === "year" ? "year" : "month",
      });

      const clientSecret = res?.data?.clientSecret;
      const setupIntentClientSecret = res?.data?.setupIntentClientSecret;
      const needsInvoicePayment = Boolean(res?.data?.setupIntentClientSecret);
      const createdSubscriptionId = res?.data?.subscriptionId ?? null;
      const noPaymentRequired = Boolean(res?.data?.noPaymentRequired);
      if (!clientSecret && noPaymentRequired) {
        const navType = await markPremium();
        Alert.alert(
          "Succès",
          "Abonnement activé ! Aucun paiement supplémentaire n'était requis.",
          [
            {
              text: "OK",
              onPress: () => {
                if (navType === "club") {
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: "MainTabsClub",
                        params: { screen: "Home" },
                      },
                    ],
                  });
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: "MainTabs",
                        params: { screen: "HomeScreen" },
                      },
                    ],
                  });
                }
              },
            },
          ]
        );
        setLoading(false);
        return;
      }
      if (!clientSecret && !setupIntentClientSecret) {
        throw new Error("Impossible de démarrer le paiement.");
      }

      const planLabel = interval === "year" ? "Annuel" : "Mensuel";
      const priceLabel =
        interval === "year" ? "19,99 EUR / an" : "2,49 EUR / mois";
      const renewalLabel =
        interval === "year" ? "Chaque année" : "Chaque mois";

      const prefillName = await getPrefillName();

      setSubscriptionId(createdSubscriptionId);
      setConfig({
        clientSecret: clientSecret || setupIntentClientSecret,
        intentType: needsInvoicePayment ? "setup" : "payment",
        planLabel,
        priceLabel,
        renewalLabel,
        prefillName,
        prefillEmail: auth.currentUser?.email ?? "",
      });
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Erreur lors du lancement du paiement.");
    }
  };

  useEffect(() => {
    startCheckout();
  }, [interval, flow, startAt]);

  const handleMessage = async (event: WebViewMessageEvent) => {
    if (hasCompletedRef.current) return;

    let data: CheckoutMessage | null = null;
    try {
      data = JSON.parse(event.nativeEvent.data) as CheckoutMessage;
    } catch {
      data = null;
    }

    if (!data) return;

    if (data.type === "go_back") {
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
      } else {
        navigation.navigate("SubscriptionSettings");
      }
      return;
    }

    if (data.type === "debug") {
      console.log("StripeCheckout WebView debug:", data.payload || {});
      return;
    }

    if (data.type === "payment_error") {
      setError(data.message || "Une erreur est survenue.");
      Alert.alert("Erreur paiement", data.message || "Une erreur est survenue.");
      return;
    }


    if (data.type === "payment_success") {
      await finalizePayment({
        intentId: data.intentId ?? null,
        paymentMethodId: data.paymentMethodId ?? null,
        billingEmail: data.billingEmail,
        receiptOptIn: data.receiptOptIn,
      });
    }
  };

  const html = useMemo(() => {
    if (!config || !publishableKey) return "";
    return buildCheckoutHtml(config, publishableKey);
  }, [config, publishableKey]);

  useEffect(() => {
    if (Platform.OS !== "android" || !config) return;
    if (!nativeName && config.prefillName) {
      setNativeName(config.prefillName);
    }
    if (!nativeEmail && config.prefillEmail) {
      setNativeEmail(config.prefillEmail);
      setNativeReceipt(true);
    }
  }, [config, nativeEmail, nativeName]);

  const handleNativeBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.navigate("SubscriptionSettings");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="flex-1">
        {loading && (
          <View className="flex-1 items-center justify-center px-6">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-white mt-4 text-base">
              Chargement du Paiement sécurisé...
            </Text>
          </View>
        )}

        {!loading && error && (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-red-400 text-center mb-4">{error}</Text>
            <Pressable
              onPress={startCheckout}
              className="bg-orange-600 px-5 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Réessayer</Text>
            </Pressable>
            <Pressable onPress={() => navigation.goBack()} className="mt-6">
              <Text className="text-gray-400">Retour</Text>
            </Pressable>
          </View>
        )}

                {!loading && !error && config && (
          Platform.OS === "android" && CardField && confirmPaymentFn && confirmSetupIntentFn ? (
            <ScrollView
              className="flex-1 px-4"
              contentContainerStyle={{ paddingBottom: 28 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="py-3">
                <Pressable
                  onPress={handleNativeBack}
                  className="flex-row items-center self-start"
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                  <Text
                    style={{ lineHeight: 20 }}
                    className="text-white font-semibold text-base ml-1"
                  >
                    Retour
                  </Text>
                </Pressable>
              </View>

              <View className="items-center mb-4">
                <LockIcon />
                <Text className="text-white text-xl font-bold">
                  Paiement sécurisé
                </Text>
                <Text className="text-gray-400 text-sm mt-1 text-center">
                  Finalise ton abonnement Premium en quelques secondes.
                </Text>
                <View className="mt-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
                  <Text className="text-white font-semibold text-sm">
                    {config.priceLabel}
                  </Text>
                </View>
              </View>

              <View className="bg-[#111111] border border-white/10 rounded-2xl p-4 mb-4">
                <Text className="text-white text-base font-semibold mb-2">
                  Résumé
                </Text>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-400">Plan</Text>
                  <Text className="text-white font-semibold">
                    {config.planLabel}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-400">Facturation</Text>
                  <Text className="text-white font-semibold">
                    {config.renewalLabel}
                  </Text>
                </View>
              </View>

              <View className="bg-[#111111] border border-white/10 rounded-2xl p-4">
                <Text className="text-white text-base font-semibold mb-3">
                  Infos de facturation
                </Text>

                <Text className="text-gray-400 text-xs mb-2">Nom complet</Text>
                <TextInput
                  value={nativeName}
                  onChangeText={setNativeName}
                  placeholder="Ex: Jean Dupont"
                  placeholderTextColor="#6b7280"
                  className="text-white border border-white/20 rounded-xl px-3 py-3 mb-4"
                />

                <Text className="text-gray-400 text-xs mb-2">
                  Adresse email
                </Text>
                <TextInput
                  value={nativeEmail}
                  onChangeText={setNativeEmail}
                  placeholder="exemple@email.com"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="text-white border border-white/20 rounded-xl px-3 py-3 mb-4"
                />

                <Pressable
                  onPress={() => setNativeReceipt((prev) => !prev)}
                  className="flex-row items-center mb-4"
                >
                  <View
                    className={`w-5 h-5 rounded border border-white/30 items-center justify-center mr-3 ${
                      nativeReceipt ? "bg-orange-500" : "bg-transparent"
                    }`}
                  >
                    {nativeReceipt && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text className="text-gray-300">
                    Recevoir un reçu par email
                  </Text>
                </Pressable>

                <Text className="text-gray-400 text-xs mb-2">
                  Numéro de carte
                </Text>
                <View className="border border-white/20 rounded-xl px-2 py-2 mb-4">
                  <CardField
                    postalCodeEnabled={false}
                    onCardChange={(card: { complete: boolean }) => setNativeCardComplete(card.complete)}
                    style={{ width: "100%", height: 48 }}
                    cardStyle={{
                      textColor: "#ffffff",
                      placeholderColor: "#6b7280",
                      cursorColor: "#ffffff",
                      textErrorColor: "#fca5a5",
                      backgroundColor: "#00000000",
                      fontSize: 16,
                    }}
                  />
                </View>

                {error && (
                  <Text className="text-red-400 mb-3">{error}</Text>
                )}

                <Pressable
                  onPress={handleNativePayment}
                  disabled={nativeLoading || !nativeCardComplete}
                  className={`rounded-full py-4 ${
                    nativeLoading || !nativeCardComplete
                      ? "bg-orange-400/60"
                      : "bg-orange-500"
                  }`}
                >
                  <Text className="text-white text-center font-semibold">
                    {nativeLoading ? "Paiement en cours..." : "Confirmer et payer"}
                  </Text>
                </Pressable>

                <Text className="text-gray-400 text-xs text-center mt-3">
                  Paiement sécurisé par Stripe. Vos informations ne sont jamais
                  stockées.
                </Text>
              </View>
            </ScrollView>
          ) : (
            <>
              {Platform.OS === "android" && (
                <View className="px-4 py-3">
                  <Pressable
                    onPress={handleNativeBack}
                    className="flex-row items-center self-start"
                  >
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    <Text
                      style={{ lineHeight: 20 }}
                      className="text-white font-semibold text-base ml-1"
                    >
                      Retour
                    </Text>
                  </Pressable>
                </View>
              )}
              <WebView
                keyboardDisplayRequiresUserAction={false}
                originWhitelist={["https://*", "http://*"]}
                source={{ html, baseUrl: "https://stripe.local" }}
                onMessage={handleMessage}
                userAgent="Mozilla/5.0 (Linux; Android 16; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36"
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                showsVerticalScrollIndicator={false}
                mixedContentMode="always"
                thirdPartyCookiesEnabled
                sharedCookiesEnabled
                javaScriptCanOpenWindowsAutomatically
                setSupportMultipleWindows={false}
                forceDarkOn={false}
                androidLayerType="software"
                renderToHardwareTextureAndroid={false}
                textZoom={100}
                style={{ flex: 1, backgroundColor: "#0E0D0D" }}
              />
              {Platform.OS === "android" && !CardField && (
                <View className="px-4 pb-4">
                  <Text className="text-yellow-300 text-xs">
                    Stripe natif non disponible sur cet Android. Utilise un dev build
                    (Expo Dev Client) pour un affichage correct des chiffres.
                  </Text>
                </View>
              )}
            </>
          )
        )}
      </View>
    </SafeAreaView>
  );
}








