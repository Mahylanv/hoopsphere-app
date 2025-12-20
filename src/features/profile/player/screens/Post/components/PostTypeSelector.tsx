import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

type PostType = "highlight" | "match" | "training";

type Props = {
  value: PostType;
  onChange: (type: PostType) => void;
};

const OPTIONS: { label: string; value: PostType }[] = [
  { label: "🎬 Highlight", value: "highlight" },
  { label: "🏀 Match", value: "match" },
  { label: "🧪 Entraînement", value: "training" },
];

export default function PostTypeSelector({ value, onChange }: Props) {
  return (
    <View className="mt-6 px-4">
      <Text className="text-white mb-2 font-semibold">
        Type de publication
      </Text>

      <View className="flex-row gap-3">
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full border ${
              value === opt.value
                ? "bg-orange-500 border-orange-500"
                : "border-gray-600"
            }`}
          >
            <Text className="text-white">{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
