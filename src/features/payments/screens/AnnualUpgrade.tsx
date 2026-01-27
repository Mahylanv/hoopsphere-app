import React, { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import usePlayerProfile from "../../profile/player/hooks/usePlayerProfile";

type ChangeMode = "period_end" | "custom";

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

const formatDate = (value: Date | null) => {
  if (!value) return "—";
  return value.toLocaleDateString("fr-FR");
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

export default function AnnualUpgrade() {
  const navigation = useNavigation<any>();
  const { user } = usePlayerProfile() as any;
  const periodEndDate = resolveDate(user?.subscriptionCurrentPeriodEnd);
  const minSwitchDate =
    periodEndDate && periodEndDate > new Date()
      ? periodEndDate
      : new Date();

  const [mode, setMode] = useState<ChangeMode>("period_end");
  const [priceLabel, setPriceLabel] = useState("—");
  const [amountLabel, setAmountLabel] = useState("—");
  const [monthlyLabel, setMonthlyLabel] = useState("—");
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(
    minSwitchDate
  );
  const [customDateInput, setCustomDateInput] = useState(
    formatDateInputValue(minSwitchDate)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const startDate = useMemo(() => {
    if (mode === "period_end") return minSwitchDate;
    return customStartDate;
  }, [mode, minSwitchDate, customStartDate]);

  const handleCustomDateInput = (text: string) => {
    const formatted = formatDateInput(text);
    setCustomDateInput(formatted);
    setCustomStartDate(parseDateInput(formatted));
  };

  const handleProceed = () => {
    if (!startDate) {
      Alert.alert("Date manquante", "Choisis une date de début.");
      return;
    }
    if (startDate < minSwitchDate) {
      Alert.alert(
        "Date invalide",
        `La date doit être après le ${formatDate(minSwitchDate)}.`
      );
      return;
    }
    navigation.navigate("StripeCheckout", {
      interval: "year",
      flow: "upgrade",
      startAt: startDate.getTime(),
    });
  };

  const formatAmountLabel = (amount?: number | null, currency?: string | null) => {
    if (typeof amount !== "number") return null;
    const safeCurrency = currency ? currency.toUpperCase() : "EUR";
    return `${(amount / 100).toFixed(2)} ${safeCurrency}`;
  };

  const refreshPrice = async () => {
    try {
      setLoadingPrice(true);
      const functions = getFunctions(getApp());
      const createUpgradePaymentIntent = httpsCallable(
        functions,
        "createUpgradePaymentIntent"
      );
      const res: any = await createUpgradePaymentIntent({
        plan: "year",
        startAt: startDate?.getTime(),
      });
      const amount = res?.data?.amount as number | null | undefined;
      const currency = res?.data?.currency as string | null | undefined;
      const label = formatAmountLabel(amount, currency);
      setAmountLabel(label || "—");
      setPriceLabel(label ? `${label}` : "—");

      const monthlyAmount = res?.data?.monthlyAmount as
        | number
        | null
        | undefined;
      const monthlyCurrency = res?.data?.monthlyCurrency as
        | string
        | null
        | undefined;
      const monthly = formatAmountLabel(monthlyAmount, monthlyCurrency);
      setMonthlyLabel(monthly ? `${monthly} / mois` : "—");
    } catch {
      setPriceLabel("—");
      setAmountLabel("—");
      setMonthlyLabel("—");
    } finally {
      setLoadingPrice(false);
    }
  };

  useEffect(() => {
    refreshPrice();
  }, [startDate?.getTime()]);

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
            Passage à l'abonnement annuel
          </Text>
          <View className="w-8" />
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-5 mb-6">
          <View className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 self-start">
            <Text className="text-orange-200 text-xs font-semibold tracking-widest">
              PREPAIEMENT
            </Text>
          </View>
          <Text className="text-white text-xl font-bold mt-3">
            Tu passes à l'abonnement annuel
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            Paiement immédiat, activation à la date choisie.
          </Text>
          <View className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3">
            <View className="flex-row justify-between py-2 border-b border-white/10">
              <Text className="text-gray-400">Prix mensuel actuel</Text>
              <Text className="text-white">
                {loadingPrice ? "…" : monthlyLabel}
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-white/10">
              <Text className="text-gray-400">Prix abonnement annuel</Text>
              <Text className="text-white">
                {loadingPrice ? "…" : priceLabel}
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-white/10">
              <Text className="text-gray-400">Début annuel</Text>
              <Text className="text-white">{formatDate(startDate)}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-400">Fin annuelle</Text>
              <Text className="text-white">
                {startDate
                  ? formatDate(
                      new Date(
                        startDate.getFullYear() + 1,
                        startDate.getMonth(),
                        startDate.getDate()
                      )
                    )
                  : "—"}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-5 mb-6">
          <Text className="text-white text-base font-semibold mb-3">
            Date de début
          </Text>
          <Pressable
            onPress={() => setMode("period_end")}
            className={`border rounded-xl p-3 mb-3 ${
              mode === "period_end"
                ? "border-orange-500/50 bg-orange-500/10"
                : "border-white/10"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-semibold">
                À la fin de la période actuelle
              </Text>
              {mode === "period_end" && (
                <Ionicons name="checkmark-circle" size={16} color="#FDBA74" />
              )}
            </View>
            <Text className="text-gray-400 text-xs mt-1">
              Début prévu : {formatDate(minSwitchDate)}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("custom")}
            className={`border rounded-xl p-3 ${
              mode === "custom"
                ? "border-orange-500/50 bg-orange-500/10"
                : "border-white/10"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-semibold">
                Choisir une date précise
              </Text>
              {mode === "custom" && (
                <Ionicons name="checkmark-circle" size={16} color="#FDBA74" />
              )}
            </View>
            {mode === "custom" && (
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
        </View>

        <View className="bg-[#111] border border-white/10 rounded-2xl p-5 mb-6">
          <Text className="text-white text-base font-semibold mb-3">
            Comment ça marche
          </Text>
          <View className="flex-row items-start mb-3">
            <View className="h-9 w-9 rounded-full bg-orange-500/20 border border-orange-500/40 items-center justify-center mr-3">
              <Ionicons name="card-outline" size={18} color="#FDBA74" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">
                Paiement immédiat
              </Text>
              <Text className="text-gray-400 text-sm">
                Tu sécurises l'annuel maintenant, sans perdre ton mois en cours.
              </Text>
            </View>
          </View>
          <View className="flex-row items-start mb-3">
            <View className="h-9 w-9 rounded-full bg-white/10 border border-white/10 items-center justify-center mr-3">
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">
                Activation automatique
              </Text>
              <Text className="text-gray-400 text-sm">
                L'abonnement annuel démarre à la date choisie.
              </Text>
            </View>
          </View>
          <View className="flex-row items-start">
            <View className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/40 items-center justify-center mr-3">
              <Ionicons name="infinite-outline" size={18} color="#93C5FD" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">
                Tranquillité annuelle
              </Text>
              <Text className="text-gray-400 text-sm">
                Ensuite, le renouvellement annuel est automatique et annulable.
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleProceed}
          disabled={loadingPrice}
          className={`rounded-full py-4 items-center shadow-lg shadow-black/50 ${
            loadingPrice ? "bg-gray-700" : "bg-orange-500"
          }`}
        >
          <Text className="text-white text-lg font-bold">
            {amountLabel !== "—"
              ? `Payer ${amountLabel}`
              : "Payer l'abonnement annuel"}
          </Text>
        </Pressable>
      </ScrollView>

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
    </SafeAreaView>
  );
}
