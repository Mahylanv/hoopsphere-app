// src/Profil/Joueur/modals/ClubModal.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
} from "react-native";

export type ClubItem = {
  name: string;
  logo: any; // require("...") ou URI
};

type Props = {
  visible: boolean;
  clubs: ClubItem[];
  search: string;
  setSearch: (text: string) => void;
  onSelect: (clubName: string) => void;
  onClose: () => void;
};

export default function ClubModal({
  visible,
  clubs,
  search,
  setSearch,
  onSelect,
  onClose,
}: Props) {
  const filteredClubs = clubs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/60 justify-center px-6"
      >
        {/* PANEL */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="bg-[#101418] rounded-xl p-5 max-h-[70%]"
        >
          <Text className="text-white text-xl font-bold mb-4">
            Sélectionne ton club
          </Text>

          {/* Recherche */}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher..."
            placeholderTextColor="#777"
            className="bg-[#1a1f25] text-white px-4 py-3 rounded-lg mb-4 border border-gray-700"
          />

          {/* Liste */}
          <ScrollView className="max-h-[60%]">
            {filteredClubs.map((club) => (
              <TouchableOpacity
                key={club.name}
                onPress={() => {
                  onSelect(club.name);
                  onClose();
                }}
                className="flex-row items-center py-3 border-b border-gray-800"
              >
                <Image
                  source={club.logo}
                  className="w-8 h-8 rounded-full mr-4"
                />
                <Text className="text-white text-base">{club.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bouton annuler */}
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
