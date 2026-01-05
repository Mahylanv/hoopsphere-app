// src/legacy/TestPrenium.tsx
// Écran de test pour le mode Premium (développeur)

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
import { updateUserProfile } from "../features/auth/services/userService";
import usePlayerProfile from "../features/profile/player/hooks/usePlayerProfile";

// ✅ composant réutilisable
import AddressAutocomplete from "../shared/components/AddressAutocomplete";

type NavProp = NativeStackNavigationProp<RootStackParamList, "TestPrenium">;

export default function TestPrenium() {
  const { user } = usePlayerProfile();
  const navigation = useNavigation<NavProp>();

  // Premium
  const [premiumToggle, setPremiumToggle] = useState<boolean>(false);

  // Adresse sélectionnée (test)
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

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
              setPremiumToggle(value);
              try {
                await updateUserProfile({ premium: value });
                Alert.alert(
                  "Statut mis à jour",
                  value
                    ? "Le compte est maintenant Premium ✨"
                    : "Le compte n'est plus Premium."
                );
              } catch {
                setPremiumToggle(!value);
              }
            }}
            thumbColor={premiumToggle ? "#F97316" : "#888"}
            trackColor={{ false: "#555", true: "#FBBF24" }}
          />
        </View>

        {/* FEATURES PREMIUM */}
        {premiumToggle && (
          <View className="gap-4 mb-10">
            <Pressable
              onPress={() => navigation.navigate("Visitors")}
              className="bg-blue-600 px-4 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold text-center">
                Voir qui a consulté mon profil
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("LikedPosts")}
              className="bg-pink-600 px-4 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold text-center">
                Voir mes posts likés ❤️
              </Text>
            </Pressable>
          </View>
        )}

        {/* ============================= */}
        {/* 📍 TEST COMPOSANT ADRESSE */}
        {/* ============================= */}
        <View className="mt-10">
          <Text className="text-white text-lg font-semibold mb-3">
            Test composant AddressAutocomplete
          </Text>

          <AddressAutocomplete
            placeholder="Adresse du joueur"
            onSelect={(address) => {
              console.log("Adresse sélectionnée :", address);
              setSelectedAddress(address);
            }}
          />

          {selectedAddress && (
            <View className="mt-4 bg-[#1A1A1A] p-4 rounded-xl">
              <Text className="text-white font-semibold mb-1">
                Adresse sélectionnée :
              </Text>
              <Text className="text-gray-300">
                {selectedAddress.label}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
