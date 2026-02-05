import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void; // 👈 plus de curseur ici
  placeholder?: string;
  keyboardType?: any;
  error?: string;
};

export default function ClearableInput({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  error,
}: Props) {
  const [touched, setTouched] = useState(false);

  const getBorderColor = () => {
    if (!touched) return "";
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
          placeholder={placeholder}
          placeholderTextColor="#777"
          keyboardType={keyboardType}
          onBlur={() => setTouched(true)}
          selectionColor="#ff8800"
          onChangeText={(text) => {
            onChange(text);
          }}
          className={`bg-[#222] text-white p-3 rounded-lg pr-10 ${getBorderColor()}`}
        />

        {/* Effacer */}
        {value !== "" && (
          <TouchableOpacity
            onPress={() => {
              onChange("");
              setTouched(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Text className="text-gray-400 text-lg">×</Text>
          </TouchableOpacity>
        )}
      </View>

      {touched && error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
