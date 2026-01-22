import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, StatusBar, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PaymentNavProp = NativeStackNavigationProp<RootStackParamList, "Payment">;

const FEATURES = [
  { id: "badge_verifie", label: "Badge vérifié" },
  { id: "who_views", label: "Savoir qui consulte mon profil" },
  { id: "advanced_filters", label: "Filtres avancés" },
  { id: "favorites", label: "Ajout en favoris" },
  { id: "advanced_stats", label: "Statistiques avancées" },
  { id: "unlimited_videos", label: "Nombre illimité de vidéos" },
  { id: "profile_card", label: "Personnalisation de sa carte profil" },
  { id: "ranking_boost", label: "Mise en avant dans un classement" },
  { id: "auto_followup", label: "Relance automatique de candidature" },
  { id: "see_video_likes", label: "Voir qui aime mes vidéos" },
  { id: "referral_boost", label: "Mise en avant dans le référencement" },
];

const CLUB_HIDDEN_FEATURES = new Set<string>([
  "advanced_stats",
  "unlimited_videos",
  "profile_card",
  "ranking_boost",
  "auto_followup",
  "see_video_likes",
]);

const CLUB_ONLY_FEATURES = new Set<string>(["referral_boost"]);

export default function Payment() {
  const navigation = useNavigation<PaymentNavProp>();
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [userType, setUserType] = useState<"joueur" | "club" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userType")
      .then((value) => {
        if (value === "joueur" || value === "club") setUserType(value);
      })
      .catch(() => null);
  }, []);

  const visibleFeatures = useMemo(() => {
    if (userType === "club") {
      return FEATURES.filter((feat) => !CLUB_HIDDEN_FEATURES.has(feat.id));
    }
    return FEATURES.filter((feat) => !CLUB_ONLY_FEATURES.has(feat.id));
  }, [userType]);

  const handleSubscribe = () => {
    navigation.navigate("StripeCheckout", { interval });
  };

  return (
    <View className="flex-1 pt-5 bg-black">
      <StatusBar barStyle="light-content" translucent />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 40, paddingBottom: 40 }}>
        <View className="absolute -top-12 -right-6 h-36 w-36 rounded-full bg-orange-500" style={{ opacity: 0.12 }} />
        <View className="absolute top-24 -left-10 h-28 w-28 rounded-full bg-white" style={{ opacity: 0.06 }} />

        <View className="mb-6 items-center">
          <View className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40">
            <Text className="text-orange-200 text-xs font-semibold tracking-widest">
              PREMIUM
            </Text>
          </View>
          <Text className="text-3xl text-white font-extrabold mt-3">
            Pass Pro
          </Text>
          <Text className="text-gray-300 mt-2 text-center">
            Boostez votre visibilite et vos performances.
          </Text>
          <View className="mt-3 px-4 py-1 rounded-full bg-white/10 border border-white/10">
            <Text className="text-white font-semibold">
              {interval === "year" ? "19,99 EUR / an" : "2,49 EUR / mois"}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-center mb-6 bg-white/5 border border-white/10 rounded-full p-1">
          <Pressable
            onPress={() => setInterval("month")}
            className={`flex-1 py-2 rounded-full ${
              interval === "month" ? "bg-orange-500" : ""
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                interval === "month" ? "text-white" : "text-gray-300"
              }`}
            >
              Mensuel
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setInterval("year")}
            className={`flex-1 py-2 rounded-full ${
              interval === "year" ? "bg-orange-500" : ""
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                interval === "year" ? "text-white" : "text-gray-300"
              }`}
            >
              Annuel
            </Text>
          </Pressable>
        </View>

        <View className="mb-8 bg-[#111] border border-white/10 rounded-2xl p-4">
          {visibleFeatures.map((feat) => (
            <View
              key={feat.id}
              className="flex-row items-center py-3 border-b border-white/10 last:border-b-0"
            >
              <View className="h-7 w-7 rounded-full bg-orange-500/20 border border-orange-500/40 items-center justify-center mr-3">
                <Ionicons name="checkmark" size={16} color="#FDBA74" />
              </View>
              <Text className="flex-1 text-white text-base">{feat.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleSubscribe}
          className="bg-orange-500 rounded-full py-4 items-center shadow-lg shadow-black/50"
        >
          <Text className="text-white text-lg font-bold">Je m'abonne</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          className="mt-4 items-center flex-row justify-center gap-2"
        >
          <Ionicons name="arrow-back" size={18} color="#D1D5DB" />
          <Text className="text-gray-300 underline">Retour</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
