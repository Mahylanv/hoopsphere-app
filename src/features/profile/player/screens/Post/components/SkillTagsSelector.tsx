import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";

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
  const [custom, setCustom] = useState("");

  const normalize = (s: string) => s.trim();

  const customTags = selected.filter((s) => !SKILLS.includes(s));
  const builtinTags = SKILLS;

  const toggleSkill = (skill: string) => {
    const label = normalize(skill);
    if (!label) return;
    if (selected.includes(label)) {
      onChange(selected.filter((s) => s !== label));
    } else {
      onChange([...selected, label]);
    }
  };

  const addCustom = () => {
    const label = normalize(custom);
    if (!label) return;
    if (selected.includes(label)) {
      setCustom("");
      return;
    }
    onChange([...selected, label]);
    setCustom("");
  };

  return (
    <View className="mt-6 px-4">
      <Text className="text-white mb-2 font-semibold">
        Compétences mises en avant
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {builtinTags.map((skill) => {
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
        {customTags.map((skill) => {
          const active = selected.includes(skill);
          return (
            <TouchableOpacity
              key={`custom-${skill}`}
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

      <View className="mt-4 flex-row items-center">
        <TextInput
          value={custom}
          onChangeText={setCustom}
          placeholder="Ton hashtag perso"
          placeholderTextColor="#6b7280"
          className="flex-1 bg-[#1a1a1a] text-white px-3 py-2 rounded-lg border border-gray-700"
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={addCustom}
          className="ml-3 bg-orange-500 px-3 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Ajouter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
