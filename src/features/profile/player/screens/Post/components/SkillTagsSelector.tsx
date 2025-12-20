import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const SKILLS = [
  "3pts",
  "Drive",
  "Defense",
  "Passes",
  "Dunk",
  "Handle",
  "Pick&Roll",
  "Athletic",
];

type Props = {
  selected: string[];
  onChange: (skills: string[]) => void;
};

export default function SkillTagsSelector({ selected, onChange }: Props) {
  const toggleSkill = (skill: string) => {
    if (selected.includes(skill)) {
      onChange(selected.filter((s) => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  return (
    <View className="mt-6 px-4">
      <Text className="text-white mb-2 font-semibold">
        Compétences mises en avant
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {SKILLS.map((skill) => {
          const active = selected.includes(skill);
          return (
            <TouchableOpacity
              key={skill}
              onPress={() => toggleSkill(skill)}
              className={`px-3 py-1.5 rounded-full border ${
                active
                  ? "bg-orange-500 border-orange-500"
                  : "border-gray-600"
              }`}
            >
              <Text className="text-white text-sm">#{skill}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
