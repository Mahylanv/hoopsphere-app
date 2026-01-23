import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  Text,
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
  | { type: "payment_success" }
  | { type: "payment_error"; message?: string }
  | { type: "go_back" };

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
  };

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        gap: 8px;
        margin-bottom: 16px;
        cursor: pointer;
        max-width: fit-content;
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
        padding: 12px 14px;
      }

      .stripe-field.is-focused {
        border-color: rgba(249, 115, 22, 0.6);
        box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.12);
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
  <body>
    <div class="orb orange"></div>
    <div class="orb blue"></div>

    <div class="container">
      <button id="back-button" class="back-link" type="button">
        ← Retour
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
          <label for="receipt">Recevoir un recu par email</label>
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
        const stripe = Stripe(config.publishableKey);
        const elements = stripe.elements({ locale: "fr" });

        const style = {
          base: {
            color: "#ffffff",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "16px",
            "::placeholder": { color: "#6b7280" },
          },
          invalid: { color: "#fca5a5" },
        };

        const cardNumber = elements.create("cardNumber", { style, showIcon: true });
        const cardExpiry = elements.create("cardExpiry", { style });
        const cardCvc = elements.create("cardCvc", { style });

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

        if (backButton) {
          backButton.addEventListener("click", () => {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: "go_back" })
              );
            }
          });
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

        document.addEventListener("touchstart", (event) => {
          const target = event.target;
          if (!target.closest("input") && !target.closest(".stripe-field")) {
            blurAll();
          }
        });

        document.addEventListener("mousedown", (event) => {
          const target = event.target;
          if (!target.closest("input") && !target.closest(".stripe-field")) {
            blurAll();
          }
        });

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
              const shouldSendReceipt = receiptInput.checked && emailValue;
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
          if (
            status === "succeeded" ||
            status === "processing" ||
            status === "requires_capture"
          ) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: "payment_success" })
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
  const { interval } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
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
      const createSubscription = httpsCallable(functions, "createSubscription");
      const res: any = await createSubscription({
        plan: interval === "year" ? "year" : "month",
      });

      const clientSecret = res?.data?.clientSecret;
      const setupIntentClientSecret = res?.data?.setupIntentClientSecret;

      if (!clientSecret && !setupIntentClientSecret) {
        throw new Error("Impossible de démarrer le paiement.");
      }

      const planLabel = interval === "year" ? "Annuel" : "Mensuel";
      const priceLabel =
        interval === "year" ? "19,99 EUR / an" : "2,49 EUR / mois";
      const renewalLabel =
        interval === "year" ? "Chaque annee" : "Chaque mois";

      const prefillName = await getPrefillName();

      setConfig({
        clientSecret: clientSecret || setupIntentClientSecret,
        intentType: clientSecret ? "payment" : "setup",
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
  }, [interval]);

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
      navigation.goBack();
      return;
    }

    if (data.type === "payment_error") {
      setError(data.message || "Une erreur est survenue.");
      return;
    }

    if (data.type === "payment_success") {
      hasCompletedRef.current = true;
      try {
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
        setError(err?.message || "Erreur lors de la mise à jour du compte.");
      }
    }
  };

  const html = useMemo(() => {
    if (!config || !publishableKey) return "";
    return buildCheckoutHtml(config, publishableKey);
  }, [config, publishableKey]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="flex-1">
        {loading && (
          <View className="flex-1 items-center justify-center px-6">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-white mt-4 text-base">
              Chargement du paiement sécurisé...
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
          <WebView
            originWhitelist={["*"]}
            source={{ html }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: "#0E0D0D" }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
