// src/Home/components/RankingItem.tsx

import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { RankingFilter } from "../../search/utils/sortPlayers";
import PremiumBadge from "../../../shared/components/PremiumBadge";
import { PROFILE_PLACEHOLDER } from "../../../constants/images";

interface RankingItemProps {
  player: {
    uid: string;
    rank: number;
    name: string;
    avatar: string | null;
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
  const { width } = useWindowDimensions();
  const isSmallDevice = width <= 360;
  const isIOS = Platform.OS === "ios";

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
  const avatarUri =
    typeof player.avatar === "string" &&
    player.avatar.trim() !== "" &&
    player.avatar !== "null" &&
    player.avatar !== "undefined"
      ? player.avatar
      : null;

  const getStatText = () => {
    switch (filter) {
      case "rating":
        return isIOS ? "" : `${player.rating}/100`;
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
        colors={["#2563EB", "#0E0D0D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 18,
          padding: isIOS ? 0.8 : 1.5,
          marginBottom: isSmallDevice ? 10 : 12,
        }}
      >
        <View
          className="flex-row items-center rounded-[16px] bg-[#0E0D0D] border border-gray-800"
          style={{
            paddingHorizontal: isSmallDevice ? 10 : 16,
            paddingVertical: isSmallDevice ? 8 : 12,
            borderWidth: isIOS ? 0.5 : 1,
          }}
        >
          <View
            className="rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "rgba(249,115,22,0.14)" }}
          >
            <View
              style={{
                width: isSmallDevice ? 24 : 30,
                height: isSmallDevice ? 24 : 30,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                className="text-orange-500 font-bold"
                style={{ fontSize: isSmallDevice ? 12 : 16 }}
              >
                {player.rank}
              </Text>
            </View>
          </View>

          <Image
            source={avatarUri ? { uri: avatarUri } : PROFILE_PLACEHOLDER}
            className="rounded-full mr-3 bg-gray-700"
            style={{
              width: isSmallDevice ? 36 : 44,
              height: isSmallDevice ? 36 : 44,
            }}
            resizeMode="cover"
          />

          <View className="flex-1">
            <View className="flex-row items-center flex-wrap">
              <Text
                className="text-white font-semibold"
                style={{ fontSize: isSmallDevice ? 15 : 18 }}
                numberOfLines={1}
              >
                {player.name}
              </Text>
              {player.premium && (
                <View className="ml-2">
                  <PremiumBadge compact />
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-1 flex-wrap">
              <Text
                className="text-gray-300"
                style={{ fontSize: isSmallDevice ? 12 : 14 }}
                numberOfLines={1}
              >
                {getStatText()}
              </Text>
                <View
                  className="flex-row items-center px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(37,99,235,0.18)",
                    marginLeft: 0,
                  }}
                >
                <Ionicons
                  name="star"
                  size={isSmallDevice ? 10 : 12}
                  color={brand.orange}
                />
                <Text
                  className="text-gray-200 ml-1"
                  style={{ fontSize: isSmallDevice ? 10 : 12 }}
                  numberOfLines={1}
                >
                  {player.rating.toFixed(0)} pts
                </Text>
              </View>
            </View>
          </View>

          <Ionicons
            name={trendIcon}
            size={isSmallDevice ? 20 : 26}
            color={trendColor}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
