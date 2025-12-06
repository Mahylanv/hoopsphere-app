// src/Home/components/RankingItem.tsx

import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RankingItemProps {
  player: {
    uid: string;
    rank: number;
    name: string;
    avatar: string;
    average: number; // moyenne de points
    rating: number;  // note sur 100
    trend: "up" | "down" | "same";
  };
}

export default function RankingItem({ player }: RankingItemProps) {
  // Couleur selon la tendance
  const trendColor =
    player.trend === "up" ? "#22c55e" : player.trend === "down" ? "#ef4444" : "#9ca3af";

  // Icône selon la tendance
  const trendIcon =
    player.trend === "up"
      ? "arrow-up"
      : player.trend === "down"
      ? "arrow-down"
      : "remove";

  return (
    <View className="flex-row items-center bg-[#1a1c22] rounded-2xl px-4 py-3 mb-3">
      
      {/* RANK */}
      <Text className="text-orange-500 text-xl font-bold w-10 text-center">
        {player.rank}
      </Text>

      {/* AVATAR */}
      <Image
        source={{ uri: player.avatar }}
        className="w-12 h-12 rounded-full mr-4 bg-gray-700"
      />

      {/* INFORMATIONS JOUEUR */}
      <View className="flex-1">
        <Text className="text-white font-semibold text-lg">{player.name}</Text>
        <Text className="text-gray-400 text-sm">
          Moyenne : {player.average} pts — Note : {player.rating}/100
        </Text>
      </View>

      {/* TENDANCE */}
      <Ionicons name={trendIcon} size={26} color={trendColor} />
    </View>
  );
}
