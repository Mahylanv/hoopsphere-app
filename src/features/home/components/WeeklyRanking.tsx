// src/Home/components/WeeklyRanking.tsx

import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
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

      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-2xl font-bold">
          Classement de la semaine
        </Text>

        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => (scale.value = withSpring(0.9))}
          onPressOut={() => (scale.value = withSpring(1))}
          onPress={() => setModalVisible(true)}
        >
          <Animated.View
            style={animatedStyle}
            className="bg-neutral-800 px-4 py-2 rounded-xl shadow-md shadow-black/40"
          >
            <Text className="text-white font-medium">Filtrer</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* LISTE */}
      <FlatList
        data={sortedPlayers}
        keyExtractor={(item) => item.uid}
        scrollEnabled={false}
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

      {/* MODAL FILTRE */}
      <RankingFilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={setFilter}
      />
    </View>
  );
}
