import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../types";
import { Ionicons } from "@expo/vector-icons";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStripe } from "@stripe/stripe-react-native";
import { auth, db } from "../../../config/firebaseConfig";

type NavProp = NativeStackNavigationProp<RootStackParamList, "StripeCheckout">;
type RouteProps = RouteProp<RootStackParamList, "StripeCheckout">;
type PremiumNavType = "joueur" | "club";

export default function StripeCheckout() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { interval } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const functions = getFunctions(getApp());
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

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
      throw new Error("Utilisateur non connecté.");
    }

    const target = await resolvePremiumTarget(user.uid);
    await updateDoc(target.ref, {
      premium: true,
      premiumSince: serverTimestamp(),
    });

    return target.navType;
  };

  const startCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const createSubscription = httpsCallable(functions, "createSubscription");
      const res: any = await createSubscription({
        plan: interval === "year" ? "year" : "month",
      });
      const clientSecret = res?.data?.clientSecret;
      const setupIntentClientSecret = res?.data?.setupIntentClientSecret;
      const customerId = res?.data?.customerId;
      const ephemeralKeySecret = res?.data?.ephemeralKeySecret;
      if (
        (!clientSecret && !setupIntentClientSecret) ||
        !customerId ||
        !ephemeralKeySecret
      ) {
        throw new Error("Impossible de creer la subscription.");
      }

      const init = await initPaymentSheet({
        merchantDisplayName: "Hoopsphere",
        customerId,
        customerEphemeralKeySecret: ephemeralKeySecret,
        ...(clientSecret
          ? { paymentIntentClientSecret: clientSecret }
          : { setupIntentClientSecret }),
        allowsDelayedPaymentMethods: true,
      });
      if (init.error) {
        throw new Error(init.error.message);
      }

      const present = await presentPaymentSheet();
      if (present.error) {
        if (present.error.code !== "Canceled") {
          throw new Error(present.error.message);
        }
        setLoading(false);
        return;
      }

      const navType = await markPremium();
      setLoading(false);
      Alert.alert("Succes", "Abonnement active !", [
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
      ]);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Erreur lors du lancement du paiement.");
    }
  };

  useEffect(() => {
    startCheckout();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-orange-600/20 items-center justify-center mb-4">
          <Ionicons name="card-outline" size={28} color="#F97316" />
        </View>

        <Text className="text-white text-xl font-bold mb-2">
          Paiement Stripe
        </Text>
        <Text className="text-gray-400 text-center mb-6">
          Redirection vers la page de paiement securisee...
        </Text>

        {loading && <ActivityIndicator size="large" color="#F97316" />}

        {error && (
          <>
            <Text className="text-red-400 text-center mb-4">{error}</Text>
            <Pressable
              onPress={startCheckout}
              className="bg-orange-600 px-5 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Reessayer</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => navigation.goBack()} className="mt-6">
          <Text className="text-gray-400">Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
