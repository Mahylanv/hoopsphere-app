import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [infoVisible, setInfoVisible] = useState(false);
  const [actionStatus, setActionStatus] = useState<{
    type: "loading" | "success" | "error";
    message: string;
  } | null>(null);
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const getLatestInvoicePdf = httpsCallable(
    functions,
    "getLatestInvoicePdf"
  );

  useEffect(() => {
    return () => {
      if (actionTimer.current) {
        clearTimeout(actionTimer.current);
      }
    };
  }, []);

  const showActionStatus = (
    type: "loading" | "success" | "error",
    message: string
  ) => {
    if (actionTimer.current) {
      clearTimeout(actionTimer.current);
    }
    setActionStatus({ type, message });
    if (type !== "loading") {
      actionTimer.current = setTimeout(() => {
        setActionStatus(null);
      }, 1600);
    }
  };

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
    return "Non configuré";
  }, [user?.subscriptionInterval]);
  const switchPlan =
    user?.subscriptionInterval === "year"
      ? "month"
      : user?.subscriptionInterval === "month"
        ? "year"
        : null;
  const switchLabel =
    user?.subscriptionInterval === "year"
      ? "Passer au mensuel"
      : user?.subscriptionInterval === "month"
        ? "Passer à l'annuel"
        : null;

  const handlePortal = async () => {
    try {
      setLoadingAction(true);
      showActionStatus("loading", "Ouverture du portail...");
      const res: any = await createPortalSession({
        returnUrl: Linking.createURL("https://billing.stripe.com/p/login/test_6oU4gyetlaDyeFX7Vi33W00"),
      });
      const url = res?.data?.url;
      if (!url) throw new Error("Lien de portail indisponible.");
      showActionStatus("success", "Portail ouvert.");
      setTimeout(() => {
        navigation.navigate("InAppWebView", {
          title: "Portail Stripe",
          url,
        });
      }, 300);
    } catch (e: any) {
      showActionStatus(
        "error",
        e?.message || "Impossible d'ouvrir le portail."
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handleInvoicePdf = async () => {
    try {
      setLoadingAction(true);
      showActionStatus("loading", "Récupération de la facture...");
      const res: any = await getLatestInvoicePdf();
      const url = res?.data?.hostedUrl || res?.data?.url;
      if (!url) {
        throw new Error("Aucune facture disponible.");
      }
      showActionStatus("success", "Facture ouverte.");
      setTimeout(() => {
        navigation.navigate("InAppWebView", {
          title: "Facture",
          url,
        });
      }, 300);
    } catch (e: any) {
      const message =
        e?.code === "not-found"
          ? "Aucune facture disponible (ou fonction non déployée)."
          : e?.message || "Impossible d'ouvrir la facture.";
      showActionStatus("error", message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoadingAction(true);
      showActionStatus("loading", "Rafraîchissement de l'abonnement...");
      await getSubscriptionInfo();
      showActionStatus("success", "Abonnement mis à jour.");
    } catch (e: any) {
      showActionStatus(
        "error",
        e?.message || "Impossible de rafraîchir l'abonnement."
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelRenewal = async (nextValue: boolean) => {
    try {
      setLoadingAction(true);
      showActionStatus("loading", "Mise à jour du renouvellement...");
      await setCancelAtPeriodEnd({ cancelAtPeriodEnd: nextValue });
      showActionStatus("success", "Renouvellement mis à jour.");
    } catch (e: any) {
      showActionStatus(
        "error",
        e?.message || e?.details || "Action impossible."
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelNow = async () => {
    try {
      setLoadingAction(true);
      showActionStatus("loading", "Annulation de l'abonnement...");
      await cancelSubscriptionNow();
      showActionStatus("success", "Abonnement annulé.");
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "MainTabs",
              params: { screen: "HomeScreen" },
            },
          ],
        });
      }, 600);
    } catch (e: any) {
      showActionStatus(
        "error",
        e?.message || e?.details || "Action impossible."
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const confirmCancelNow = () => {
    Alert.alert(
      "Confirmer l'annulation",
      "Es-tu sûr de vouloir annuler ton abonnement maintenant ?",
      [
        { text: "Retour", style: "cancel" },
        {
          text: "Annuler l'abonnement",
          style: "destructive",
          onPress: handleCancelNow,
        },
      ]
    );
  };

  const handleChangePlan = async (plan: "month" | "year") => {
    try {
      setLoadingAction(true);
      showActionStatus("loading", "Changement d'abonnement...");
      await changeSubscriptionPlan({ plan });
      showActionStatus(
        "success",
        "Changement appliqué au prochain renouvellement."
      );
    } catch (e: any) {
      showActionStatus("error", e?.message || "Action impossible.");
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
            Paramètres abonnement
          </Text>
          <View className="w-8" />
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={18} color="#F97316" />
              <Text className="text-white text-base font-semibold ml-2">
                Infos abonnement
              </Text>
            </View>
            <Pressable onPress={handleRefresh} disabled={loadingAction}>
              {loadingAction ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <Text className="text-orange-300 text-xs">Rafraîchir</Text>
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
              {cancelAtPeriodEnd ? "Arrêté" : "Actif"}
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-white/10">
            <Text className="text-gray-400">Fin de période</Text>
            <Text className="text-white">{periodEnd}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-white/10">
            <Text className="text-gray-400">Période</Text>
            <Text className="text-white">
              {intervalLabel} ({periodStart} - {periodEnd})
            </Text>
          </View>
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="options-outline" size={18} color="#F97316" />
              <Text className="text-white text-base font-semibold ml-2">
                Gérer mon abonnement
              </Text>
            </View>
            <Pressable onPress={() => setInfoVisible(true)} className="p-1">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#9ca3af"
              />
            </Pressable>
          </View>
          <Pressable
            onPress={handlePortal}
            disabled={loadingAction}
            className="bg-orange-500 rounded-xl py-3 items-center mb-3 flex-row justify-center"
          >
            <Ionicons name="card-outline" size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
              Gérer mes paiements
            </Text>
          </Pressable>
          <Pressable
            onPress={handleInvoicePdf}
            disabled={loadingAction}
            className="bg-white/10 border border-white/10 rounded-xl py-3 items-center mb-3 flex-row justify-center"
          >
            <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
              Télécharger mes factures (PDF)
            </Text>
          </Pressable>
          {switchPlan && switchLabel && (
            <Pressable
              onPress={() => handleChangePlan(switchPlan)}
              disabled={loadingAction}
              className="bg-white/10 border border-white/10 rounded-xl py-3 items-center mb-3 flex-row justify-center"
            >
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">{switchLabel}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => handleCancelRenewal(!cancelAtPeriodEnd)}
            disabled={loadingAction}
            className="bg-white/10 border border-white/10 rounded-xl py-3 items-center mb-3 flex-row justify-center"
          >
            <Ionicons name="pause-circle-outline" size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
              {cancelAtPeriodEnd
                ? "Reprendre le renouvellement"
                : "Arrêter le renouvellement"}
            </Text>
          </Pressable>
          <Pressable
            onPress={confirmCancelNow}
            disabled={loadingAction}
            className="bg-red-500/80 rounded-xl py-3 items-center flex-row justify-center"
          >
            <Ionicons name="close-circle-outline" size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
              Annuler l'abonnement
            </Text>
          </Pressable>
        </View>

        {/*
        <View className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4">
          <Text className="text-gray-300 text-sm">
            Les actions sont synchronisées via Stripe + webhooks. Si quelque
            chose ne se met pas à jour, utilise "Rafraîchir" ou le portail
            Stripe.
          </Text>
        </View>
        */}
      </ScrollView>

      {infoVisible && (
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={() => setInfoVisible(false)}
        >
          <View className="flex-1 items-center justify-center px-6">
            <Pressable
              className="w-full bg-[#111] border border-white/10 rounded-2xl p-4"
              onPress={() => {}}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="information-circle"
                  size={18}
                  color="#FDBA74"
                />
                <Text className="text-white font-semibold ml-2">Infos</Text>
              </View>
              <Text className="text-gray-300 text-sm">
                Le bouton "Gérer mes paiements" ouvre le portail Stripe pour
                changer ta carte.
                {"\n"}
                Le bouton "Télécharger mes factures (PDF)" ouvre la dernière
                facture disponible.
              </Text>
              <Pressable
                onPress={() => setInfoVisible(false)}
                className="mt-4 bg-orange-500/15 border border-orange-500/40 rounded-full px-4 py-2 self-start"
              >
                <Text className="text-orange-200 text-xs font-semibold">
                  Compris
                </Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      )}

      {actionStatus && (
        <Pressable
          className="absolute inset-0 bg-black/50 items-center justify-center px-6"
          onPress={() => {
            if (actionStatus.type !== "loading") {
              setActionStatus(null);
            }
          }}
        >
          <View className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-5 items-center">
            {actionStatus.type === "loading" ? (
              <ActivityIndicator size="large" color="#F97316" />
            ) : (
              <Ionicons
                name={
                  actionStatus.type === "success"
                    ? "checkmark-circle-outline"
                    : "close-circle-outline"
                }
                size={34}
                color={actionStatus.type === "success" ? "#FDBA74" : "#FCA5A5"}
              />
            )}
            <Text className="text-white text-center mt-3">
              {actionStatus.message}
            </Text>
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}
