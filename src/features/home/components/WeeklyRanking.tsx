// src/Home/components/WeeklyRanking.tsx

import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import RankingItem from "./RankingItem";
import RankingFilterModal from "./RankingFilterModal";
import { sortPlayers, RankingFilter } from "../../search/utils/sortPlayers";
import { RankingPlayer } from "../hooks/usePlayerRanking";

interface WeeklyRankingProps {
  players: RankingPlayer[];

  // 🔥 CALLBACKS venant du HomeScreen
  onSelectPlayer: (player: RankingPlayer) => void;
  onOpenPanel: () => void;
}

export default function WeeklyRanking({
  players,
  onSelectPlayer,
  onOpenPanel,
}: WeeklyRankingProps) {
  const accent = {
    orange: "#F97316",
    blue: "#2563EB",
    surface: "#0E0D0D",
  } as const;

  const [filter, setFilter] = useState<RankingFilter>("rating");
  const [modalVisible, setModalVisible] = useState(false);

  // Animation bouton filtrer
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Tri dynamique → Top 5
  const sortedPlayers = sortPlayers(players, filter).slice(0, 5);

  return (
    <View className="w-full mt-6 px-5">
      <LinearGradient
        colors={["#F97316", "#0E0D0D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 1.5,
        }}
      >
        <View className="bg-[#0E0D0D] rounded-[18px] p-4 shadow-lg shadow-black/40 overflow-hidden border border-gray-800">
          <View
            pointerEvents="none"
            className="absolute -right-8 -top-6 w-28 h-28 rounded-full"
            style={{ backgroundColor: "rgba(249,115,22,0.14)" }}
          />
          <View
            pointerEvents="none"
            className="absolute -left-10 bottom-2 w-24 h-24 rounded-full"
            style={{ backgroundColor: "rgba(37,99,235,0.16)" }}
          />
          <View
            pointerEvents="none"
            className="absolute right-6 bottom-6 w-16 h-16 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          />
          {/* HEADER */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">
                Classement de la semaine
              </Text>
              <View className="flex-row items-center mt-2 space-x-2">
                <Ionicons name="trophy-outline" className="mr-2" size={18} color={accent.orange} />
                <Text className="text-gray-400 text-sm">
                  Top 5 des performances Premium
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => (scale.value = withSpring(0.9))}
              onPressOut={() => (scale.value = withSpring(1))}
              onPress={() => setModalVisible(true)}
            >
              <Animated.View
                className="px-4 py-2 rounded-full flex-row items-center"
                style={[
                  animatedStyle,
                  {
                    backgroundColor: "rgba(37,99,235,0.16)",
                    borderWidth: 1,
                    borderColor: "rgba(37,99,235,0.35)",
                  },
                ]}
              >
                <Ionicons name="options-outline" size={16} color="#e5e7eb" />
                <Text className="text-white font-medium ml-2">Filtrer</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* LISTE */}
          <FlatList
            data={sortedPlayers}
            keyExtractor={(item) => item.uid}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item, index }) => (
              <RankingItem
                player={{
                  uid: item.uid,
                  rank: index + 1,
                  name: `${item.prenom} ${item.nom}`,
                  avatar: item.avatar,
                  average: item.stats.pts,
                  rating: item.rating,
                  trend: "same",
                  stats: item.stats,
                  premium: item.premium,
                }}
                filter={filter}
                onPress={() => {
                  onSelectPlayer(item);
                  onOpenPanel();
                }}
              />
            )}
          />
        </View>
      </LinearGradient>

      {/* MODAL FILTRE */}
      <RankingFilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={setFilter}
      />
    </View>
  );
}
