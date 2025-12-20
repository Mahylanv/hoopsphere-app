// src/Components/DepartmentSelect.tsx
import React, { useState, useMemo } from "react";
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
import { DEPARTEMENTS } from "../../constants/departements";

type Props = {
  value?: string[]; // ← peut être undefined
  onSelect: (value: string[]) => void; // ← toujours un tableau à la sortie
  placeholder?: string;
  single?: boolean;
};

export default function DepartmentSelect({
  value,
  onSelect,
  placeholder,
  single, 
}: Props) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  // valeur sûre pour toutes les opérations
  const safeValue = Array.isArray(value)
    ? value
    : value
      ? [value] // ← IMPORTANT !
      : [];

  const insets = useSafeAreaInsets();
  const topSpacing =
    Platform.OS === "ios" ? insets.top || 16 : StatusBar.currentHeight || 16;

  const filtered = useMemo(
    () =>
      DEPARTEMENTS.filter((d) =>
        d.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const toggleDepartment = (item: string) => {
    if (single) {
      // mode sélection unique
      onSelect([item]);
      setVisible(false);
    } else {
      // mode multi-select classique
      if (safeValue.includes(item)) {
        onSelect(safeValue.filter((v) => v !== item));
      } else {
        onSelect([...safeValue, item]);
      }
    }
  };

  return (
    <>
      {/* INPUT */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className="bg-[#0F141E] border border-gray-700 rounded-xl px-4 py-3 flex-row justify-between items-center"
      >
        <Text className="text-white text-[15px]">
          {safeValue.length > 0
            ? safeValue.join(", ")
            : placeholder || "Sélectionner un ou plusieurs départements"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#aaa" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={visible} animationType="slide">
        <View className="flex-1 bg-gray-900">
          <View style={{ paddingTop: topSpacing }} />

          <View className="flex-row items-center px-5 py-4 border-b border-gray-800 bg-[#0E1117]">
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>

            <Text className="text-white text-xl font-bold ml-3">
              Choisir des départements
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
            renderItem={({ item }) => {
              const selected = safeValue.includes(item);

              return (
                <TouchableOpacity
                  onPress={() => toggleDepartment(item)}
                  className={`py-3 px-4 mb-2 rounded-xl border ${
                    selected
                      ? "bg-orange-600 border-orange-400"
                      : "bg-[#1c2331] border-gray-700"
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white text-[16px]">{item}</Text>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#fff"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}
