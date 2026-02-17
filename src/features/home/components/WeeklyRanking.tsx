// src/Home/components/WeeklyRanking.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const { width } = useWindowDimensions();
  const isSmallDevice = width <= 360;
  const isIOS = Platform.OS === "ios";

  const accent = {
    orange: "#F97316",
    blue: "#2563EB",
    surface: "#0E0D0D",
  } as const;

  const [filter, setFilter] = useState<RankingFilter>("rating");
  const [modalVisible, setModalVisible] = useState(false);
  const [trendByUid, setTrendByUid] = useState<
    Record<string, "up" | "down" | "same">
  >({});
  const [visibleCount, setVisibleCount] = useState(5);

  const TREND_KEY = "weekly_ranking_prev_ranks_v1";
  const MAX_VISIBLE = 10;

  // Animation bouton filtrer
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Tri dynamique → Top 5
  const sortedPlayers = useMemo(
    () => sortPlayers(players, filter),
    [players, filter]
  );
  const visiblePlayers = useMemo(
    () => sortedPlayers.slice(0, Math.min(visibleCount, MAX_VISIBLE)),
    [sortedPlayers, visibleCount]
  );

  useEffect(() => {
    let cancelled = false;

    const syncTrends = async () => {
      try {
        const raw = await AsyncStorage.getItem(TREND_KEY);
        const prevRanks = raw ? (JSON.parse(raw) as Record<string, number>) : {};

        const nextRanks: Record<string, number> = {};
        const nextTrends: Record<string, "up" | "down" | "same"> = {};

        sortedPlayers.forEach((player, index) => {
          const rank = index + 1;
          nextRanks[player.uid] = rank;
          const prev = prevRanks[player.uid];
          if (typeof prev === "number") {
            if (rank < prev) nextTrends[player.uid] = "up";
            else if (rank > prev) nextTrends[player.uid] = "down";
            else nextTrends[player.uid] = "same";
          } else {
            nextTrends[player.uid] = "same";
          }
        });

        if (!cancelled) {
          setTrendByUid(nextTrends);
        }

        await AsyncStorage.setItem(TREND_KEY, JSON.stringify(nextRanks));
      } catch {
        if (!cancelled) {
          setTrendByUid({});
        }
      }
    };

    if (visiblePlayers.length > 0) {
      syncTrends();
    }

    return () => {
      cancelled = true;
    };
  }, [visiblePlayers.map((p) => p.uid).join("|")]);

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
        <View
          className="bg-[#0E0D0D] rounded-[18px] shadow-lg shadow-black/40 overflow-hidden border border-gray-800"
          style={{ padding: isSmallDevice ? 12 : 16 }}
        >
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
              <Text
                className="text-white font-bold"
                style={{
                  fontSize: isSmallDevice ? 20 : isIOS ? 22 : 24,
                  flexShrink: 1,
                  marginRight: 10,
                }}
                numberOfLines={isIOS ? 2 : 1}
              >
                Classement de la semaine
              </Text>
              <View className="flex-row items-center mt-2 space-x-2">
                <Ionicons
                  name="trophy-outline"
                  className="mr-2"
                  size={16}
                  color={accent.orange}
                />
                <Text
                  className="text-gray-400"
                  style={{ fontSize: isSmallDevice ? 12 : 14 }}
                >
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
                className="rounded-full flex-row items-center"
                style={[
                  animatedStyle,
                  {
                    paddingHorizontal: isSmallDevice ? 10 : 16,
                    paddingVertical: 8,
                    backgroundColor: "rgba(37,99,235,0.16)",
                    borderWidth: 1,
                    borderColor: "rgba(37,99,235,0.35)",
                  },
                ]}
              >
                <Ionicons name="options-outline" size={16} color="#e5e7eb" />
                {!isSmallDevice && (
                  <Text className="text-white font-medium ml-2">Filtrer</Text>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* LISTE */}
          <FlatList
            data={visiblePlayers}
            keyExtractor={(item) => item.uid}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View className="h-0.5" />}
            renderItem={({ item, index }) => (
              <RankingItem
                player={{
                  uid: item.uid,
                  rank: index + 1,
                  name: `${item.prenom} ${item.nom}`,
                  avatar: item.avatar,
                  average: item.stats.pts,
                  rating: item.rating,
                  trend: trendByUid[item.uid] ?? "same",
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
          {sortedPlayers.length > 5 && visibleCount < MAX_VISIBLE && (
            <TouchableOpacity
              onPress={() => setVisibleCount(10)}
              className="mt-3 items-center"
            >
              <Text className="text-orange-400 font-semibold">
                Charger plus
              </Text>
            </TouchableOpacity>
          )}
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
