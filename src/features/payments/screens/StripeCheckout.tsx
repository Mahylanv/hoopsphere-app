import React, { useEffect, useState } from "react";
import { View, Text, StatusBar, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../types";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { auth } from "../../../config/firebaseConfig";

type NavProp = NativeStackNavigationProp<RootStackParamList, "StripeCheckout">;
type RouteProps = RouteProp<RootStackParamList, "StripeCheckout">;

export default function StripeCheckout() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { priceId, interval } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";

  const startCheckout = async () => {
    setLoading(true);
    setError(null);

    if (!apiBaseUrl) {
      setLoading(false);
      setError("API_BASE_URL manquant.");
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${apiBaseUrl}/createCheckoutSession`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          priceId,
          interval,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Impossible de creer la session Stripe.");
      }

      await Linking.openURL(data.url);
      setLoading(false);
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

        <Pressable
          onPress={() => navigation.goBack()}
          className="mt-6"
        >
          <Text className="text-gray-400">Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
