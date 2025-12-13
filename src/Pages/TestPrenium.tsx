import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types";
import { updateUserProfile } from "../services/userService";
import usePlayerProfile from "../Profil/Joueurs/hooks/usePlayerProfile";

type NavProp = NativeStackNavigationProp<RootStackParamList, "TestPrenium">;

export default function TestPrenium() {
  const { user } = usePlayerProfile();
  const navigation = useNavigation<NavProp>();

  // ⚠️ premiumToggle doit piloter l'affichage du bouton
  const [premiumToggle, setPremiumToggle] = useState<boolean>(false);

  // Sync local toggle with Firestore user value when screen loads
  useEffect(() => {
    if (user?.premium !== undefined) {
      setPremiumToggle(user.premium);
    }
  }, [user]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <Text className="text-2xl font-bold text-white">Test Premium</Text>

        {/* BOUTON HOME */}
        <Pressable
          onPress={() => navigation.navigate("Home")}
          className="bg-orange-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-bold">Home</Text>
        </Pressable>
      </View>

      {/* CONTENU */}
      <View className="flex-1 px-5 mt-8">

        {/* TOGGLE PREMIUM */}
        <Text className="text-white text-lg font-semibold mb-3">
          Mode Premium (test développeur)
        </Text>

        <View className="flex-row items-center justify-between bg-[#1A1A1A] px-4 py-3 rounded-xl mb-8">
          <Text className="text-white">Activer Premium</Text>

          <Switch
            value={premiumToggle}
            onValueChange={async (value) => {
              // UI immédiate
              setPremiumToggle(value);

              try {
                await updateUserProfile({ premium: value });

                Alert.alert(
                  "Statut mis à jour",
                  value
                    ? "Le compte est maintenant Premium ✨"
                    : "Le compte n'est plus Premium."
                );
              } catch (e) {
                console.log("Erreur mise à jour Premium:", e);
                setPremiumToggle(!value); // revert si erreur
              }
            }}
            thumbColor={premiumToggle ? "#F97316" : "#888"}
            trackColor={{ false: "#555", true: "#FBBF24" }}
          />
        </View>

        {/* BOUTON VISITEURS (Piloté par premiumToggle) */}
        {premiumToggle === true && (
          <Pressable
            onPress={() => navigation.navigate("Visitors")}
            className="bg-blue-600 px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold text-center">
              Voir qui a consulté mon profil
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
