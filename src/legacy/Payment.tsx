import React, { useState } from "react";
import { ScrollView, View, Text, StatusBar, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

type PaymentNavProp = NativeStackNavigationProp<RootStackParamList, "Payment">;

const FEATURES = [
  "Badge certifie",
  "Trophees de recompenses speciaux",
  "Filtres avances",
  "Meilleur referencement & apparition dans le classement de la semaine",
  "Suppression des publicites",
  "Nombre illimite de publication de videos",
  "Suivi des statistiques ameliore",
  "Alertes personnalisees",
  "Savoir qui me consulte",
];

export default function Payment() {
  const navigation = useNavigation<PaymentNavProp>();
  const [interval, setInterval] = useState<"month" | "year">("year");

  const handleSubscribe = () => {
    navigation.navigate("StripeCheckout", { interval });
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="mb-6 items-center">
          <Text className="text-3xl text-gray-200 font-bold">
            Pass Pro
          </Text>
          <Text className="text-gray-200 mt-1">
            {interval === "year" ? "19,99 EUR / an" : "2,49 EUR / mois"}
          </Text>
        </View>

        <View className="flex-row justify-center gap-3 mb-6">
          <Pressable
            onPress={() => setInterval("month")}
            className={`px-4 py-2 rounded-full border ${
              interval === "month"
                ? "bg-orange-600 border-orange-500"
                : "border-gray-700"
            }`}
          >
            <Text className="text-white font-semibold">Mensuel</Text>
          </Pressable>
          <Pressable
            onPress={() => setInterval("year")}
            className={`px-4 py-2 rounded-full border ${
              interval === "year"
                ? "bg-orange-600 border-orange-500"
                : "border-gray-700"
            }`}
          >
            <Text className="text-white font-semibold">Annuel</Text>
          </Pressable>
        </View>

        <View className="mb-8">
          {FEATURES.map((feat) => (
            <View
              key={feat}
              className="flex-row items-center mb-4 bg-gray-800 rounded-lg px-4 py-3"
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#10B981"
                className="mr-3"
              />
              <Text className="flex-1 text-white text-base">{feat}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleSubscribe}
          className="bg-green-600 rounded-full py-4 items-center shadow-lg"
        >
          <Text className="text-white text-lg font-bold">Je m'abonne</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} className="mt-4 items-center">
          <Text className="text-blue-600">Retour</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
