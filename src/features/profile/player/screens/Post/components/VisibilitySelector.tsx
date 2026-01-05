import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Visibility = "public" | "private" | "clubs";

type Props = {
  value: Visibility;
  onChange: (v: Visibility) => void;
};

export default function VisibilitySelector({ value, onChange }: Props) {
  return (
    <View className="mt-6 px-4">
      <Text className="text-white mb-2 font-semibold">
        Visibilité
      </Text>

      <View className="flex-row gap-3 flex-wrap">
        {/* PUBLIC */}
        <TouchableOpacity
          onPress={() => onChange("public")}
          className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
            value === "public"
              ? "bg-orange-500 border-orange-500"
              : "border-gray-600"
          }`}
        >
          <Ionicons name="earth-outline" size={18} color="white" />
          <Text className="text-white">Public</Text>
        </TouchableOpacity>

        {/* PRIVATE */}
        <TouchableOpacity
          onPress={() => onChange("private")}
          className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
            value === "private"
              ? "bg-orange-500 border-orange-500"
              : "border-gray-600"
          }`}
        >
          <Ionicons name="lock-closed-outline" size={18} color="white" />
          <Text className="text-white">Privé</Text>
        </TouchableOpacity>

        {/* CLUBS */}
        <TouchableOpacity
          onPress={() => onChange("clubs")}
          className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
            value === "clubs"
              ? "bg-orange-500 border-orange-500"
              : "border-gray-600"
          }`}
        >
          <Ionicons name="business-outline" size={18} color="white" />
          <Text className="text-white">Clubs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
