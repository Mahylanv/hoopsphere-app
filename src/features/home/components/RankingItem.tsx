// src/Home/components/RankingItem.tsx

import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { RankingFilter } from "../../search/utils/sortPlayers";
import PremiumBadge from "../../../shared/components/PremiumBadge";

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
    premium?: boolean;
  };
  filter: RankingFilter;
  onPress?: () => void;
}

export default function RankingItem({
  player,
  filter,
  onPress,
}: RankingItemProps) {
  const brand = {
    orange: "#F97316",
    blue: "#2563EB",
    surface: "#0E0D0D",
  } as const;

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
      <LinearGradient
        colors={["rgba(37,99,235,0.12)", "rgba(14,14,15,0.9)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 18,
          padding: 1,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "rgba(249,115,22,0.22)",
        }}
      >
        <View className="flex-row items-center rounded-[16px] px-4 py-3 bg-[#0E0D0D]">
          <View className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "rgba(249,115,22,0.14)" }}
          >
            <Text className="text-orange-500 text-xl font-bold">
              {player.rank}
            </Text>
          </View>

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
            <View className="flex-row items-center">
              <Text className="text-white font-semibold text-lg">
                {player.name}
              </Text>
              {player.premium && (
                <View className="ml-2">
                  <PremiumBadge compact />
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-1">
              <Text className="text-gray-300 text-sm">{getStatText()}</Text>
              <View className="flex-row items-center ml-3 px-2 py-1 rounded-full"
                style={{ backgroundColor: "rgba(37,99,235,0.18)" }}
              >
                <Ionicons name="star" size={12} color={brand.orange} />
                <Text className="text-gray-200 text-xs ml-1">
                  {player.rating.toFixed(0)} pts
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name={trendIcon} size={26} color={trendColor} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
