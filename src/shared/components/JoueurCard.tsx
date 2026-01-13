// src/Components/JoueurCard.tsx

import React from "react";
import { View, Text, Image, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Joueur } from "../../types";
import { PlayerAverages } from "../../utils/player/computePlayerStats";
import PremiumBadge from "./PremiumBadge";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;

type Props = {
  joueur: Joueur;
  stats?: PlayerAverages | null;
  rating?: number;
  onPressActions?: () => void;
  showActionsButton?: boolean;
};

export default function JoueurCard({
  joueur,
  stats,
  onPressActions,
  rating,
  showActionsButton = true,
}: Props) {
  // 🔥 Valeurs sécurisées
  const MJ = stats?.gamesPlayed ?? 0;
  const twoInt = stats?.twoInt ?? 0;
  const twoExt = stats?.twoExt ?? 0;
  const threes = stats?.threes ?? 0;
  const pts = stats?.pts ?? 0;
  const lf = stats?.lf ?? 0;
  const fouls = stats?.fouls ?? 0;

  // ⭐ Total Réussites
  const TR = twoInt + twoExt + threes;
  const cardSource =
    joueur.premium && joueur.cardStyle === "premium"
      ? require("../../../assets/CARD-PRENIUM.png")
      : require("../../../assets/CARD-NORMAL-FOND.png");

  return (
    <View className="flex-1 items-center pt-4">
      <View
        className="relative"
        style={{
          width: CARD_WIDTH,
          aspectRatio: 0.68,
        }}
      >
        {/* 🌌 Fond */}
        <Image
          source={cardSource}
          className="absolute w-full h-full"
          resizeMode="contain"
        />

        {/* 🟠 NOTE */}
        <View className="absolute top-[12.5%] left-[21%] bg-orange-500/90 w-[58px] h-[58px] rounded-full items-center justify-center">
          <Text className="text-white text-xl font-bold">{rating ?? "-"}</Text>
        </View>

        {/* Poste */}
        <View className="absolute top-[25%] left-[21%] bg-[#111827]/90 border border-orange-500 w-[60px] h-[60px] rounded-full items-center justify-center">
          <Text className="text-white font-semibold text-xl">
            {joueur.poste?.slice(0, 3).toUpperCase() || "N/A"}
          </Text>
        </View>

        {/* Avatar */}
        <View className="absolute top-[12%] right-[19%] w-[125px] h-[125px] rounded-full overflow-hidden bg-[#0e0e10]">
          <Image
            source={{
              uri:
                joueur.avatar && joueur.avatar.trim() !== ""
                  ? joueur.avatar
                  : "https://via.placeholder.com/200.png",
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Nom */}
        <View className="absolute top-[42%] w-full items-center">
          <View className="flex-row items-center justify-center">
            <Text className="text-white text-[20px] font-bold">
              {joueur.prenom} {joueur.nom}
            </Text>
            {joueur.premium && (
              <View className="ml-2">
                <PremiumBadge compact />
              </View>
            )}
          </View>
        </View>

        {/* 📊 STATISTIQUES — NOUVELLE VERSION */}
        <View className="absolute top-[50%] w-[90%] self-center flex-row justify-between">

          {/* Bloc Gauche */}
          <View className="flex-row w-[46%] justify-end">
            <View className="space-y-3.5 items-end pr-3">

              {/* MJ */}
              <Text className="text-white text-[20px] py-2 font-extrabold">
                {MJ}
              </Text>

              {/* TR - Total Réussites */}
              <Text className="text-white text-[20px] font-extrabold">
                {TR}
              </Text>

              {/* 2EXT */}
              <Text className="text-white text-[20px] py-2 font-extrabold">
                {twoExt}
              </Text>

              {/* LF */}
              <Text className="text-white text-[20px] font-extrabold">
                {lf}
              </Text>
            </View>

            <View className="space-y-6 items-start pl-2">

              <Text className="text-gray-300 text-[13px] py-2 font-semibold">
                MJ
              </Text>

              <Text className="text-gray-300 text-[13px] py-3 font-semibold">
                TR
              </Text>

              <Text className="text-gray-300 text-[13px] py-2 font-semibold">
                2EXT
              </Text>

              <Text className="text-gray-300 text-[13px] py-2 font-semibold">
                LF
              </Text>
            </View>
          </View>

          {/* Bloc Droite */}
          <View className="flex-row w-[46%] justify-start">
            <View className="space-y-3.5 items-end pr-3">

              {/* PTS */}
              <Text className="text-white text-[20px] py-2 font-extrabold">
                {pts}
              </Text>

              {/* 2INT */}
              <Text className="text-white text-[20px] font-extrabold">
                {twoInt}
              </Text>

              {/* 3PTS */}
              <Text className="text-white text-[20px] py-2 font-extrabold">
                {threes}
              </Text>

              {/* F */}
              <Text className="text-white text-[20px] font-extrabold">
                {fouls}
              </Text>
            </View>

            <View className="space-y-6 items-start pl-2">

              <Text className="text-gray-300 text-[13px] py-2 font-semibold">
                PTS
              </Text>

              <Text className="text-gray-300 text-[13px] py-3 font-semibold">
                2INT
              </Text>

              <Text className="text-gray-300 text-[13px] py-2 font-semibold">
                3PTS
              </Text>

              <Text className="text-gray-300 text-[13px] py-2 font-semibold">
                F
              </Text>
            </View>
          </View>
        </View>

        {/* Share */}
        {showActionsButton && (
          <TouchableOpacity
            onPress={onPressActions}
            className="absolute bottom-[6%] right-[8%]"
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255, 102, 0, 0.85)" }}
            >
              <Ionicons name="share-social-outline" size={26} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
