import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEPARTEMENTS } from "../constants/departements";

type Props = {
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
};

export default function DepartmentSelect({ value, onSelect, placeholder }: Props) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets(); // ← clé de la solution

  const topSpacing =
    Platform.OS === "ios"
      ? insets.top || 16 // notch ou fallback
      : StatusBar.currentHeight || 16; // android

  const filtered = DEPARTEMENTS.filter((d) =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* INPUT */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className="bg-[#0F141E] border border-gray-700 rounded-xl px-4 py-3 flex-row justify-between items-center"
      >
        <Text className="text-white text-[15px]">
          {value || placeholder || "Sélectionner un département"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#aaa" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={visible} animationType="slide">
        <View className="flex-1 bg-gray-900">

          {/* ---------- HEADER avec espace auto ---------- */}
          <View style={{ paddingTop: topSpacing }} />

          <View className="flex-row items-center px-5 py-4 border-b border-gray-800 bg-[#0E1117]">
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>

            <Text className="text-white text-xl font-bold ml-3">
              Choisir un département
            </Text>
          </View>

          {/* BARRE DE RECHERCHE */}
          <View className="px-5 mt-4">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher…"
              placeholderTextColor="#6b7280"
              className="bg-[#0F141E] text-white rounded-xl px-4 py-3 border border-gray-700"
            />
          </View>

          {/* LISTE */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
                className="py-3 px-4 mb-2 bg-[#1c2331] rounded-xl border border-gray-700"
              >
                <Text className="text-white text-[16px]">{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}
