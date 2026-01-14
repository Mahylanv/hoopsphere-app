// src/Home/components/RankingFilterModal.tsx

import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { RankingFilter } from "../../search/utils/sortPlayers";

const FILTERS: { key: RankingFilter; label: string }[] = [
  { key: "rating", label: "Meilleure note (Rating)" },
  { key: "points", label: "Meilleurs scoreurs (Points)" },
  { key: "threes", label: "Meilleurs tireurs 3pts" },
  { key: "twoInt", label: "Meilleurs 2pts intérieurs" },
  { key: "twoExt", label: "Meilleurs 2pts extérieurs" },
  { key: "lf", label: "Meilleurs aux lancers francs" },
  { key: "discipline", label: "Moins de fautes" },
];

const FILTER_ICONS: Record<RankingFilter, keyof typeof Ionicons.glyphMap> = {
  rating: "star-outline",
  points: "basketball-outline",
  threes: "flash-outline",
  twoInt: "stats-chart-outline",
  twoExt: "trending-up-outline",
  lf: "hand-left-outline",
  discipline: "shield-checkmark-outline",
};

export default function RankingFilterModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (filter: RankingFilter) => void;
}) {
  // Animation du fond noir
  const opacity = useSharedValue(0);

  // Animation du bloc modal (slide)
  const translateY = useSharedValue(40);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withSpring(0, { damping: 170 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(40, { duration: 180 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Fond noir animé */}
      <Animated.View
        style={backdropStyle}
        className="absolute inset-0 bg-black/60"
      />

      {/* Conteneur */}
      <View className="flex-1 justify-center items-center">
        <Animated.View
          style={modalStyle}
          className="w-11/12"
        >
          <LinearGradient
            colors={["#F97316", "#0E0D0D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 1.5 }}
          >
            <View className="bg-[#0E0D0D] rounded-[18px] p-5 overflow-hidden shadow-xl shadow-black/70">
              <View
                className="absolute -right-8 -top-6 w-24 h-24 rounded-full"
                style={{ backgroundColor: "rgba(249,115,22,0.14)" }}
              />
              <View
                className="absolute -left-10 bottom-0 w-24 h-24 rounded-full"
                style={{ backgroundColor: "rgba(37,99,235,0.14)" }}
              />

              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-orange-600/20 items-center justify-center mr-3">
                  <Ionicons name="options-outline" size={18} color="#F97316" />
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">
                    Trier le classement
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    Choisis le critere a mettre en avant
                  </Text>
                </View>
              </View>

              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => {
                    onSelect(f.key);
                    onClose();
                  }}
                  className="flex-row items-center px-3 py-3 rounded-xl mb-2 bg-white/5 border border-white/10"
                  activeOpacity={0.9}
                >
                  <View className="w-8 h-8 rounded-full bg-blue-600/20 items-center justify-center mr-3">
                    <Ionicons
                      name={FILTER_ICONS[f.key]}
                      size={16}
                      color="#93c5fd"
                    />
                  </View>
                  <Text className="text-white text-base flex-1">
                    {f.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={onClose}
                className="mt-2 py-3 bg-neutral-800 rounded-xl"
              >
                <Text className="text-white text-center font-medium">
                  Fermer
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}
