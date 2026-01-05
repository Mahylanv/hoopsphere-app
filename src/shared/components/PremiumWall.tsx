import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  message: string;
  onPressUpgrade?: () => void;
  ctaLabel?: string;
};

export default function PremiumWall({
  message,
  onPressUpgrade,
  ctaLabel = "Passer Premium",
}: Props) {
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <Ionicons name="lock-closed" size={30} color="#F97316" />
      <Text className="text-white text-center mt-3 text-lg font-semibold">
        Fonctionnalité Premium
      </Text>
      <Text className="text-gray-400 text-center mt-2">{message}</Text>

      {onPressUpgrade && (
        <TouchableOpacity
          onPress={onPressUpgrade}
          className="mt-5 bg-orange-500 px-5 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
