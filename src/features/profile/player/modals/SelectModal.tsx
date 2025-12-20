// src/Profil/Joueur/modals/SelectModal.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  options: string[];
  onClose: () => void;
  onSelect: (value: string) => void;

  // optionnel : champ de recherche
  search?: string;
  setSearch?: (v: string) => void;
};

export default function SelectModal({
  visible,
  title,
  options,
  onClose,
  onSelect,
  search,
  setSearch,
}: Props) {
  const filteredOptions =
    search && setSearch
      ? options.filter((o) =>
          o.toLowerCase().includes(search.toLowerCase())
        )
      : options;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/60 justify-center px-6"
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-[#101418] rounded-xl p-5 max-h-[70%]"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-white text-xl font-bold mb-4">
            {title}
          </Text>

          {setSearch && (
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher..."
              placeholderTextColor="#777"
              className="bg-[#1a1f25] text-white px-4 py-3 rounded-lg mb-3 border border-gray-700"
            />
          )}

          <ScrollView className="max-h-[60%]">
            {filteredOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                className="py-3 border-b border-gray-800"
              >
                <Text className="text-white text-base">{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            className="mt-5 bg-gray-700 rounded-lg py-3 items-center"
          >
            <Text className="text-white">Annuler</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
