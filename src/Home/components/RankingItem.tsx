// src/Home/components/RankingItem.tsx

import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RankingFilter } from "../../utils/sortPlayers";

interface RankingItemProps {
  player: {
    uid: string;
    rank: number;
    name: string;
    avatar: string;
    average: number;
    rating: number;
    trend: "up" | "down" | "same";
    stats: any;
  };
  filter: RankingFilter;
  onPress?: () => void;
}

export default function RankingItem({
  player,
  filter,
  onPress,
}: RankingItemProps) {
  const trendColor =
    player.trend === "up"
      ? "#22c55e"
      : player.trend === "down"
        ? "#ef4444"
        : "#9ca3af";

  const trendIcon =
    player.trend === "up"
      ? "arrow-up"
      : player.trend === "down"
        ? "arrow-down"
        : "remove";

  const getStatText = () => {
    switch (filter) {
      case "rating":
        return `Rating : ${player.rating}/100`;
      case "points":
        return `PTS : ${player.average}`;
      case "threes":
        return `3PTS : ${player.stats?.threes ?? 0}`;
      case "twoInt":
        return `2INT : ${player.stats?.twoInt ?? 0}`;
      case "twoExt":
        return `2EXT : ${player.stats?.twoExt ?? 0}`;
      case "lf":
        return `LF : ${player.stats?.lf ?? 0}`;
      case "discipline":
        return `Fautes : ${player.stats?.fouls ?? 0}`;
      default:
        return `PTS : ${player.average}`;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View className="flex-row items-center bg-[#1a1c22] rounded-2xl px-4 py-3 mb-3">
        <Text className="text-orange-500 text-xl font-bold w-10 text-center">
          {player.rank}
        </Text>

        <Image
          source={{
            uri:
              player.avatar && player.avatar.trim() !== ""
                ? player.avatar
                : "https://via.placeholder.com/200.png",
          }}
          className="w-12 h-12 rounded-full mr-4 bg-gray-700"
          resizeMode="cover"
        />

        <View className="flex-1">
          <Text className="text-white font-semibold text-lg">
            {player.name}
          </Text>
          <Text className="text-gray-400 text-sm">{getStatText()}</Text>
        </View>

        <Ionicons name={trendIcon} size={26} color={trendColor} />
      </View>
    </TouchableOpacity>
  );
}
