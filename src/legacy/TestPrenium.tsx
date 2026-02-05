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
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types";
import { updateUserProfile } from "../features/auth/services/userService";
import usePlayerProfile from "../features/profile/player/hooks/usePlayerProfile";

//  composant réutilisable
import AddressAutocomplete from "../shared/components/AddressAutocomplete";

type NavProp = NativeStackNavigationProp<RootStackParamList, "TestPrenium">;
const { width } = Dimensions.get("window");
const CARD_PREVIEW_WIDTH = width * 0.42;

export default function TestPrenium() {
  const { user } = usePlayerProfile();
  const navigation = useNavigation<NavProp>();

  // Premium
  const [premiumToggle, setPremiumToggle] = useState<boolean>(false);
  const [cardStyle, setCardStyle] = useState<"normal" | "premium">("normal");
  const [showCardChooser, setShowCardChooser] = useState<boolean>(false);
  const cardOptions: Array<{
    id: "normal" | "premium";
    label: string;
    image: ReturnType<typeof require>;
  }> = [
    {
      id: "normal",
      label: "Card normale",
      image: require("../../assets/CARD-NORMAL-FOND.png"),
    },
    {
      id: "premium",
      label: "Card premium",
      image: require("../../assets/CARD-PREMIUM.png"),
    },
  ];

  // Adresse sélectionnée (test)
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  useEffect(() => {
    if (user?.premium !== undefined) {
      setPremiumToggle(user.premium);
    }
    if (user?.cardStyle) {
      setCardStyle(user.cardStyle);
    }
  }, [user]);

  const updateCardStyle = async (nextStyle: "normal" | "premium") => {
    try {
      await updateUserProfile({ cardStyle: nextStyle });
      setCardStyle(nextStyle);
      Alert.alert(
        "Carte mise a jour",
        nextStyle === "premium"
          ? "La card premium sera affichee sur ton profil."
          : "La card normale sera affichee sur ton profil."
      );
    } catch {
      Alert.alert("Erreur", "Impossible de mettre a jour la card.");
    }
  };

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
      <ScrollView
        className="flex-1 px-5 mt-8"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
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
              onPress={() =>
                updateCardStyle(cardStyle === "premium" ? "normal" : "premium")
              }
              className="bg-orange-600 px-4 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold text-center">
                Card actuelle : {cardStyle === "premium" ? "Premium" : "Normale"}
              </Text>
            </Pressable>
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
                Voir mes posts aimés
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("PostLikes")}
              className="bg-purple-600 px-4 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold text-center">
                Voir qui a aimé mes posts
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
              // console.log("Adresse sélectionnée :", address);
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

        {/* CHOIX STYLE CARD (PREMIUM ONLY) */}
        <View className="mt-10">
          <Text className="text-white text-lg font-semibold mb-3">
            Choisir sa card
          </Text>

          {premiumToggle ? (
            <>
              <Pressable
                onPress={() => setShowCardChooser((current) => !current)}
                className="bg-orange-600 px-4 py-3 rounded-xl mb-4"
              >
                <Text className="text-white font-semibold text-center">
                  {showCardChooser ? "Masquer" : "Afficher"} le choix de la card
                </Text>
              </Pressable>

              {showCardChooser && (
                <>
                  <Text className="text-gray-300 mb-4">
                    Slide et clique sur une card pour l'appliquer.
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={CARD_PREVIEW_WIDTH + 16}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingRight: 16 }}
                  >
                    {cardOptions.map((option) => {
                      const isActive = cardStyle === option.id;

                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => updateCardStyle(option.id)}
                          className="mr-4"
                        >
                          <View
                            className={`rounded-2xl overflow-hidden border bg-[#0b0b0b] shadow-lg shadow-black/40 ${
                              isActive ? "border-orange-500" : "border-gray-800"
                            }`}
                            style={{
                              width: CARD_PREVIEW_WIDTH,
                              aspectRatio: 0.68,
                              padding: 6,
                            }}
                          >
                            <Image
                              source={option.image}
                              className="w-full h-full"
                              resizeMode="contain"
                            />
                            {isActive && (
                              <View className="absolute top-3 right-3 bg-orange-500 px-2 py-1 rounded-full">
                                <Text className="text-white text-xs font-bold">
                                  Activee
                                </Text>
                              </View>
                            )}
                          </View>
                          <View
                            className={`mt-2 self-center px-3 py-1 rounded-full border ${
                              isActive
                                ? "bg-orange-500/15 border-orange-500/40"
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                isActive ? "text-orange-200" : "text-gray-200"
                              }`}
                            >
                              {option.label}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </>
          ) : (
            <Text className="text-gray-400">
              Active Premium pour debloquer le choix de la card.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
