// src/Home/components/RankingFilterModal.tsx

import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

import { RankingFilter } from "../../utils/sortPlayers";

const FILTERS: { key: RankingFilter; label: string }[] = [
  { key: "rating", label: "Meilleure note (Rating)" },
  { key: "points", label: "Meilleurs scoreurs (Points)" },
  { key: "threes", label: "Meilleurs tireurs 3pts" },
  { key: "twoInt", label: "Meilleurs 2pts intérieurs" },
  { key: "twoExt", label: "Meilleurs 2pts extérieurs" },
  { key: "lf", label: "Meilleurs aux lancers francs" },
  { key: "discipline", label: "Moins de fautes" },
];

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
          className="bg-neutral-900 w-11/12 p-5 rounded-2xl shadow-xl shadow-black/70"
        >
          <Text className="text-white text-xl font-bold mb-4">
            Trier le classement
          </Text>

          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => {
                onSelect(f.key);
                onClose();
              }}
              className="py-3 border-b border-neutral-700 active:bg-neutral-800 rounded-md px-1"
            >
              <Text className="text-white text-lg">{f.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={onClose}
            className="mt-4 py-3 bg-neutral-800 rounded-xl"
          >
            <Text className="text-white text-center font-medium">Fermer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
