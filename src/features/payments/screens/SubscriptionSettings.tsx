import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import DateTimePicker from "@react-native-community/datetimepicker";
import usePlayerProfile from "../../profile/player/hooks/usePlayerProfile";

export default function SubscriptionSettings() {
  const navigation = useNavigation<any>();
  const { user } = usePlayerProfile() as any;
  const [loadingAction, setLoadingAction] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [changeVisible, setChangeVisible] = useState(false);
  const [changeMode, setChangeMode] = useState<"period_end" | "custom">(
    "period_end"
  );
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customDateInput, setCustomDateInput] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
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
  const cancelScheduledPlanChange = httpsCallable(
    functions,
    "cancelScheduledPlanChange"
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

  const resolveDate = (value: any): Date | null => {
    if (!value) return null;
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value?.seconds
          ? new Date(value.seconds * 1000)
          : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const formatDate = (value: any) => {
    const date = resolveDate(value);
    if (!date) return "—";
    return date.toLocaleDateString("fr-FR");
  };

  const formatDateInputValue = (date: Date | null) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const formatDateInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    return parts.join("/");
  };

  const isSameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  const parseDateInput = (value: string): Date | null => {
    const [dayRaw, monthRaw, yearRaw] = value.split("/");
    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = Number(yearRaw);
    if (!day || !month || !year) return null;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    if (
      date.getDate() !== day ||
      date.getMonth() + 1 !== month ||
      date.getFullYear() !== year
    ) {
      return null;
    }
    return date;
  };

  const handleCustomDateInput = (text: string) => {
    const formatted = formatDateInput(text);
    setCustomDateInput(formatted);
    const parsed = parseDateInput(formatted);
    setCustomStartDate(parsed);
  };

  const subscriptionStatus = user?.subscriptionStatus ?? "inconnu";
  const cancelAtPeriodEnd = Boolean(user?.subscriptionCancelAtPeriodEnd);
  const periodStart = formatDate(user?.subscriptionCurrentPeriodStart);
  const periodEnd = formatDate(user?.subscriptionCurrentPeriodEnd);
  const periodEndDate = resolveDate(user?.subscriptionCurrentPeriodEnd);
  const minSwitchDate =
    periodEndDate && periodEndDate > new Date()
      ? periodEndDate
      : new Date();
  const intervalLabel = useMemo(() => {
    if (user?.subscriptionInterval === "year") return "Annuel";
    if (user?.subscriptionInterval === "month") return "Mensuel";
    return "Non configuré";
  }, [user?.subscriptionInterval]);
  const scheduledIntervalLabel = useMemo(() => {
    if (user?.subscriptionScheduledInterval === "year") return "Annuel";
    if (user?.subscriptionScheduledInterval === "month") return "Mensuel";
    return null;
  }, [user?.subscriptionScheduledInterval]);
  const scheduledStartLabel = formatDate(user?.subscriptionScheduledAt);
  const scheduledInterval = user?.subscriptionScheduledInterval ?? null;
  const scheduledStartDate = resolveDate(user?.subscriptionScheduledAt);
  const canCancelScheduledChange = scheduledStartDate
    ? scheduledStartDate.getTime() > Date.now()
    : false;
  const switchPlan =
    user?.subscriptionInterval === "month" ? "year" : null;
  const switchLabel =
    user?.subscriptionInterval === "month"
      ? "Passage à l'abonnement annuel"
      : null;

  const openChangeModal = () => {
    if (switchPlan === "year") {
      navigation.navigate("AnnualUpgrade");
      return;
    }
    setChangeMode("period_end");
    if (periodEndDate) {
      setCustomStartDate(periodEndDate);
      setCustomDateInput(formatDateInputValue(periodEndDate));
    } else {
      setCustomStartDate(null);
      setCustomDateInput("");
    }
    setShowDatePicker(false);
    setChangeVisible(true);
  };

  const showSwitchButton =
    !!switchPlan && !!switchLabel && scheduledInterval !== switchPlan;

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
      await getSubscriptionInfo();
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
      await getSubscriptionInfo();
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

  const handleCancelScheduledChange = async () => {
    try {
      setLoadingAction(true);
      showActionStatus("loading", "Annulation du changement...");
      if (!canCancelScheduledChange) {
        showActionStatus(
          "error",
          "Annulation impossible : l'annuel a déjà commencé."
        );
        return;
      }
      await cancelScheduledPlanChange();
      await getSubscriptionInfo();
      showActionStatus("success", "Changement programmé annulé.");
    } catch (e: any) {
      showActionStatus(
        "error",
        e?.message || "Impossible d'annuler le changement."
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const confirmCancelScheduledChange = () => {
    Alert.alert(
      "Annuler le changement",
      "Veux-tu vraiment annuler le changement d'abonnement programmé ?",
      [
        { text: "Retour", style: "cancel" },
        {
          text: "Annuler",
          style: "destructive",
          onPress: handleCancelScheduledChange,
        },
      ]
    );
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

  const handleChangePlan = async (
    plan: "month" | "year",
    startDate?: Date | null
  ) => {
    try {
      setLoadingAction(true);
      showActionStatus("loading", "Changement d'abonnement...");
      const payload: any = { plan };
      if (startDate) {
        payload.startAt = startDate.getTime();
      }
      await changeSubscriptionPlan(payload);
      const scheduledLabel = startDate
        ? formatDate(startDate)
        : periodEnd !== "—"
          ? periodEnd
          : null;
      showActionStatus(
        "success",
        scheduledLabel
          ? `Changement programmé pour le ${scheduledLabel}.`
          : "Changement appliqué au prochain renouvellement."
      );
    } catch (e: any) {
      const rawMessage = e?.message || "Action impossible.";
      const message =
        rawMessage.includes("Changing plan intervals") ||
        rawMessage.includes("billing cycle unchanged")
          ? periodEnd !== "—"
            ? `La date doit être après la fin de la période actuelle (${periodEnd}).`
            : "La date doit être après la fin de la période actuelle."
          : rawMessage;
      showActionStatus("error", message);
    } finally {
      setLoadingAction(false);
    }
  };

  const confirmChangePlan = () => {
    if (!switchPlan) return;
    if (changeMode === "custom") {
      if (!customStartDate) {
        showActionStatus("error", "Sélectionne une date de début.");
        return;
      }
      const effectiveStartDate =
        periodEndDate && isSameDay(customStartDate, periodEndDate)
          ? periodEndDate
          : customStartDate;
      if (effectiveStartDate < minSwitchDate) {
        showActionStatus(
          "error",
          `La date doit être après le ${formatDate(minSwitchDate)}.`
        );
        return;
      }
      setChangeVisible(false);
      setShowDatePicker(false);
      handleChangePlan(switchPlan, effectiveStartDate);
      return;
    }
    setChangeVisible(false);
    setShowDatePicker(false);
    handleChangePlan(switchPlan, null);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View
          className="absolute -top-10 -right-8 h-32 w-32 rounded-full bg-orange-500"
          style={{ opacity: 0.12 }}
        />
        <View
          className="absolute top-24 -left-10 h-28 w-28 rounded-full bg-white"
          style={{ opacity: 0.05 }}
        />
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-2xl font-extrabold">
            Paramètres abonnement
          </Text>
          <View className="w-8" />
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40">
              <Text className="text-orange-200 text-xs font-semibold tracking-widest">
                ABONNEMENT
              </Text>
            </View>
            <Pressable
              onPress={handleRefresh}
              disabled={loadingAction}
              className="px-3 py-1 rounded-full bg-white/10 border border-white/10"
            >
              {loadingAction ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <Text className="text-orange-300 text-xs font-semibold">
                  Rafraîchir
                </Text>
              )}
            </Pressable>
          </View>
          <Text className="text-white text-2xl font-bold mt-3">
            {intervalLabel}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {cancelAtPeriodEnd
              ? "Renouvellement automatique arrêté"
              : "Renouvellement automatique actif"}
          </Text>
          <View className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3">
            <View className="flex-row justify-between py-2 border-b border-white/10">
              <Text className="text-gray-400">Statut</Text>
              <Text className="text-white">{subscriptionStatus}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-white/10">
              <Text className="text-gray-400">Fin de période</Text>
              <Text className="text-white">{periodEnd}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-400">Période</Text>
              <Text className="text-white">
                {intervalLabel} ({periodStart} - {periodEnd})
              </Text>
            </View>
            {scheduledIntervalLabel && scheduledStartLabel !== "—" && (
              <View className="py-2 border-t border-white/10">
                <View className="flex-row justify-between">
                  <Text className="text-gray-400">Changement prévu</Text>
                  <Text className="text-white">
                    {scheduledIntervalLabel} à partir du {scheduledStartLabel}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs mt-4">
                  Annulation possible jusqu'au {scheduledStartLabel}. Après
                  cette date, aucun remboursement.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-5 mb-4">
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
            className="bg-orange-500/15 border border-orange-500/40 rounded-2xl py-3 px-4 items-center mb-3 flex-row"
          >
            <View className="h-9 w-9 rounded-full bg-orange-500/20 border border-orange-500/40 items-center justify-center mr-3">
              <Ionicons name="card-outline" size={18} color="#FDBA74" />
            </View>
            <Text className="text-white font-semibold">
              Gérer mes paiements
            </Text>
          </Pressable>
          <Pressable
            onPress={handleInvoicePdf}
            disabled={loadingAction}
            className="bg-blue-600/15 border border-blue-500/40 rounded-2xl py-3 px-4 items-center mb-3 flex-row"
          >
            <View className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/40 items-center justify-center mr-3">
              <Ionicons name="document-text-outline" size={18} color="#93C5FD" />
            </View>
            <Text className="text-white font-semibold">
              Télécharger mes factures (PDF)
            </Text>
          </Pressable>
          {showSwitchButton && (
            <Pressable
              onPress={openChangeModal}
              disabled={loadingAction}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 items-center mb-3 flex-row"
            >
              <View className="h-9 w-9 rounded-full bg-white/10 border border-white/10 items-center justify-center mr-3">
                <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
              </View>
              <Text className="text-white font-semibold">{switchLabel}</Text>
            </Pressable>
          )}
          {scheduledInterval && scheduledStartLabel !== "—" && (
            <Pressable
              onPress={confirmCancelScheduledChange}
              disabled={loadingAction || !canCancelScheduledChange}
              className={`rounded-2xl py-3 px-4 items-center mb-3 flex-row border ${
                loadingAction || !canCancelScheduledChange
                  ? "bg-white/5 border-white/10 opacity-50"
                  : "bg-red-600 border-red-500"
              }`}
            >
              <View className="h-9 w-9 rounded-full bg-red-500/20 border border-red-500/50 items-center justify-center mr-3">
                <Ionicons name="close-circle-outline" size={18} color="#FEE2E2" />
              </View>
              <Text className="text-white font-semibold">
                Annuler le changement programmé
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => handleCancelRenewal(!cancelAtPeriodEnd)}
            disabled={loadingAction}
            className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 items-center mb-3 flex-row"
          >
            <View className="h-9 w-9 rounded-full bg-white/10 border border-white/10 items-center justify-center mr-3">
              <Ionicons
                name={
                  cancelAtPeriodEnd
                    ? "play-circle-outline"
                    : "pause-circle-outline"
                }
                size={18}
                color="#FFFFFF"
              />
            </View>
            <Text className="text-white font-semibold">
              {cancelAtPeriodEnd
                ? "Reprendre le renouvellement automatique"
                : "Arrêter le renouvellement automatique"}
            </Text>
          </Pressable>
          <Pressable
            onPress={confirmCancelNow}
            disabled={loadingAction}
            className="bg-red-500/15 border border-red-500/40 rounded-2xl py-3 px-4 items-center flex-row"
          >
            <View className="h-9 w-9 rounded-full bg-red-500/20 border border-red-500/40 items-center justify-center mr-3">
              <Ionicons name="close-circle-outline" size={18} color="#FCA5A5" />
            </View>
            <Text className="text-white font-semibold">
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

      {changeVisible && switchPlan && (
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={() => {
            setChangeVisible(false);
            setShowDatePicker(false);
          }}
        >
          <View className="flex-1 items-center justify-center px-6">
            <Pressable
              className="w-full bg-[#111] border border-white/10 rounded-2xl p-4"
              onPress={() => {}}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="swap-horizontal"
                  size={18}
                  color="#FDBA74"
                />
                <Text className="text-white font-semibold ml-2">
                  Changer d'abonnement
                </Text>
              </View>
              <Text className="text-gray-300 text-sm mb-3">
                Choisis la date de début pour le nouvel abonnement.
              </Text>

              <Pressable
                onPress={() => setChangeMode("period_end")}
                className={`border rounded-xl p-3 mb-3 ${
                  changeMode === "period_end"
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-white/10"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-semibold">
                    À la fin de la période actuelle
                  </Text>
                  {changeMode === "period_end" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#FDBA74"
                    />
                  )}
                </View>
                {periodEnd !== "—" && (
                  <Text className="text-gray-400 text-xs mt-1">
                    Début prévu : {periodEnd}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setChangeMode("custom");
                  if (!customStartDate && periodEndDate) {
                    setCustomStartDate(periodEndDate);
                    setCustomDateInput(formatDateInputValue(periodEndDate));
                  }
                }}
                className={`border rounded-xl p-3 ${
                  changeMode === "custom"
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-white/10"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-semibold">
                    Choisir une date de début
                  </Text>
                  {changeMode === "custom" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#FDBA74"
                    />
                  )}
                </View>
                {changeMode === "custom" && (
                  <View className="mt-2">
                    {Platform.OS === "web" ? (
                      <TextInput
                        value={customDateInput}
                        onChangeText={handleCustomDateInput}
                        placeholder="JJ/MM/AAAA"
                        keyboardType="number-pad"
                        placeholderTextColor="#9CA3AF"
                        className="rounded-lg px-3 py-2 text-white text-sm"
                        style={{
                          borderWidth: 1,
                          borderColor: "#2a2a2a",
                          backgroundColor: "#0d0d0d",
                        }}
                      />
                    ) : (
                      <Pressable
                        onPress={() => setShowDatePicker(true)}
                        className="bg-white/10 border border-white/10 rounded-lg px-3 py-2"
                      >
                        <Text
                          className={`text-sm ${
                            customStartDate ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {customStartDate
                            ? formatDate(customStartDate)
                            : "Choisir une date"}
                        </Text>
                      </Pressable>
                    )}
                    <Text className="text-gray-400 text-xs mt-1">
                      Doit être après le {formatDate(minSwitchDate)}.
                    </Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={confirmChangePlan}
                className="mt-4 bg-orange-500/15 border border-orange-500/40 rounded-full px-4 py-2 self-end"
              >
                <Text className="text-orange-200 text-xs font-semibold">
                  Confirmer
                </Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      )}

      {showDatePicker && Platform.OS !== "web" && (
        <Modal transparent animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1E1E1E] rounded-xl p-6 w-[85%]">
              <DateTimePicker
                value={customStartDate ?? minSwitchDate}
                mode="date"
                minimumDate={minSwitchDate}
                locale="fr-FR"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event, selectedDate) => {
                  if (selectedDate) {
                    setCustomStartDate(selectedDate);
                    setCustomDateInput(formatDateInputValue(selectedDate));
                  }
                  if (Platform.OS !== "ios") setShowDatePicker(false);
                }}
              />
              <Pressable
                className="bg-orange-500 rounded-xl py-3 mt-4"
                onPress={() => setShowDatePicker(false)}
              >
                <Text className="text-center text-white font-bold">
                  Valider
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

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
                className="mt-4 bg-orange-500/15 border border-orange-500/40 rounded-full px-4 py-2 self-end"
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
