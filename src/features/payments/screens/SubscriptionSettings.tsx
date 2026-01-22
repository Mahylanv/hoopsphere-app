import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import usePlayerProfile from "../../profile/player/hooks/usePlayerProfile";

export default function SubscriptionSettings() {
  const navigation = useNavigation<any>();
  const { user } = usePlayerProfile() as any;
  const [loadingAction, setLoadingAction] = useState(false);

  const functions = getFunctions(getApp());
  const createPortalSession = httpsCallable(
    functions,
    "createBillingPortalSession"
  );
  const setCancelAtPeriodEnd = httpsCallable(
    functions,
    "setCancelAtPeriodEnd"
  );
  const cancelSubscriptionNow = httpsCallable(
    functions,
    "cancelSubscriptionNow"
  );
  const changeSubscriptionPlan = httpsCallable(
    functions,
    "changeSubscriptionPlan"
  );
  const getSubscriptionInfo = httpsCallable(
    functions,
    "getSubscriptionInfo"
  );

  const formatDate = (value: any) => {
    if (!value) return "—";
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value?.seconds
          ? new Date(value.seconds * 1000)
          : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("fr-FR");
  };

  const subscriptionStatus = user?.subscriptionStatus ?? "inconnu";
  const cancelAtPeriodEnd = Boolean(user?.subscriptionCancelAtPeriodEnd);
  const periodStart = formatDate(user?.subscriptionCurrentPeriodStart);
  const periodEnd = formatDate(user?.subscriptionCurrentPeriodEnd);
  const intervalLabel = useMemo(() => {
    if (user?.subscriptionInterval === "year") return "Annuel";
    if (user?.subscriptionInterval === "month") return "Mensuel";
    return "Non configure";
  }, [user?.subscriptionInterval]);

  const handlePortal = async () => {
    try {
      setLoadingAction(true);
      const res: any = await createPortalSession({
        returnUrl: Linking.createURL("https://billing.stripe.com/p/login/test_6oU4gyetlaDyeFX7Vi33W00"),
      });
      const url = res?.data?.url;
      if (!url) throw new Error("Lien de portail indisponible.");
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Impossible d'ouvrir le portail.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoadingAction(true);
      await getSubscriptionInfo();
    } catch (e: any) {
      Alert.alert(
        "Erreur",
        e?.message || "Impossible de rafraichir l'abonnement."
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelRenewal = async (nextValue: boolean) => {
    try {
      setLoadingAction(true);
      await setCancelAtPeriodEnd({ cancelAtPeriodEnd: nextValue });
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Action impossible.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelNow = async () => {
    try {
      setLoadingAction(true);
      await cancelSubscriptionNow();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Action impossible.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleChangePlan = async (plan: "month" | "year") => {
    try {
      setLoadingAction(true);
      await changeSubscriptionPlan({ plan });
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Action impossible.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-xl font-bold">
            Parametres abonnement
          </Text>
          <View className="w-8" />
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-base font-semibold">
              Infos abonnement
            </Text>
            <Pressable onPress={handleRefresh} disabled={loadingAction}>
              {loadingAction ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <Text className="text-orange-300 text-xs">Rafraichir</Text>
              )}
            </Pressable>
          </View>
          <View className="flex-row justify-between py-2 border-b border-white/10">
            <Text className="text-gray-400">Statut</Text>
            <Text className="text-white">{subscriptionStatus}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-white/10">
            <Text className="text-gray-400">Renouvellement</Text>
            <Text className="text-white">
              {cancelAtPeriodEnd ? "Arrete" : "Actif"}
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-white/10">
            <Text className="text-gray-400">Fin de periode</Text>
            <Text className="text-white">{periodEnd}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-white/10">
            <Text className="text-gray-400">Periode</Text>
            <Text className="text-white">
              {intervalLabel} ({periodStart} - {periodEnd})
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-400">Customer</Text>
            <Text className="text-white">
              {user?.stripeCustomerId ? "OK" : "Non lie"}
            </Text>
          </View>
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-4 mb-4">
          <Text className="text-white text-base font-semibold mb-3">
            Gerer mon abonnement
          </Text>
          <Pressable
            onPress={handlePortal}
            disabled={loadingAction}
            className="bg-orange-500 rounded-xl py-3 items-center mb-3"
          >
            <Text className="text-white font-semibold">
              Ouvrir le portail Stripe
            </Text>
          </Pressable>
          <View className="flex-row gap-3 mb-3">
            <Pressable
              onPress={() => handleChangePlan("month")}
              disabled={loadingAction}
              className="flex-1 bg-white/10 border border-white/10 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold">
                Passer au mensuel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleChangePlan("year")}
              disabled={loadingAction}
              className="flex-1 bg-white/10 border border-white/10 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold">
                Passer a l'annuel
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => handleCancelRenewal(!cancelAtPeriodEnd)}
            disabled={loadingAction}
            className="bg-white/10 border border-white/10 rounded-xl py-3 items-center mb-3"
          >
            <Text className="text-white font-semibold">
              {cancelAtPeriodEnd
                ? "Reprendre le renouvellement"
                : "Arreter le renouvellement"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCancelNow}
            disabled={loadingAction}
            className="bg-red-500/80 rounded-xl py-3 items-center"
          >
            <Text className="text-white font-semibold">
              Annuler l'abonnement
            </Text>
          </Pressable>
        </View>

        <View className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4">
          <Text className="text-gray-300 text-sm">
            Les actions sont synchronisees via Stripe + webhooks. Si quelque
            chose ne se met pas a jour, utilise "Rafraichir" ou le portail
            Stripe.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
