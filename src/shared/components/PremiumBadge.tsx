import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  label?: string;
  compact?: boolean;
};

export default function PremiumBadge({ label = "Vérifié", compact }: Props) {
  return (
    <View
      className={`flex-row items-center ${
        compact ? "" : "bg-blue-500/15 px-2 py-1 rounded-full"
      }`}
    >
      <Ionicons
        name="checkmark-circle"
        size={compact ? 16 : 18}
        color="#60a5fa"
      />
      {!compact && (
        <Text className="text-blue-300 text-xs font-semibold ml-1">
          {label}
        </Text>
      )}
    </View>
  );
}
