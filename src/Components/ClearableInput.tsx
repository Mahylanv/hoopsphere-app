// src/Components/ClearableInput.tsx

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  error?: string; // message d’erreur éventuel
};

export default function ClearableInput({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  error,
}: Props) {
  // 👉 NEW : savoir si l’input a été touché / quitté
  const [touched, setTouched] = useState(false);

  // 👉 Déterminer la bordure finale
  const getBorderColor = () => {
    if (!touched) return ""; // aucune bordure tant que pas touché

    if (error) return "border border-red-500";
    if (!error && value !== "") return "border border-green-500";

    return "";
  };

  return (
    <View className="mb-4">
      {label && <Text className="text-gray-400 mb-1">{label}</Text>}

      <View className="relative">
        <TextInput
          value={value}
          onChangeText={(v) => {
            onChange(v);
          }}
          placeholder={placeholder}
          placeholderTextColor="#777"
          keyboardType={keyboardType}
          onBlur={() => setTouched(true)} // 👉 devient vert seulement après sortie
          className={`bg-[#222] text-white p-3 rounded-lg pr-10 ${getBorderColor()}`}
        />

        {/* ❌ Croix pour effacer */}
        {value !== "" && (
          <TouchableOpacity
            onPress={() => {
              onChange("");
              // reset validation si on efface tout
              setTouched(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Text className="text-gray-400 text-lg">×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Erreur affichée UNIQUEMENT si touched */}
      {touched && error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
