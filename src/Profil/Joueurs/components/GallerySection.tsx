// src/Profil/Joueur/components/GallerySection.tsx

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onAddImage?: () => void; // laissé pour plus tard
  images?: string[]; // futur usage
};

export default function GallerySection({ onAddImage, images }: Props) {
  return (
    <View className="mt-6 px-6">
      {/* Titre */}
      <Text className="text-xl font-bold text-white mb-4">Galerie</Text>

      {/* Pour le moment, simple bloc vide */}
      <View className="flex-row items-center justify-center border border-gray-700 rounded-xl py-10 bg-[#1a1f25]">
        <Text className="text-gray-400 text-base">
          Aucune photo pour le moment
        </Text>
      </View>

      {/* Bouton ajouter (futur fonctionnement) */}
      <TouchableOpacity
        onPress={onAddImage}
        className="mt-4 bg-orange-500 py-3 rounded-xl flex-row items-center justify-center"
      >
        <Ionicons name="add" size={20} color="white" />
        <Text className="text-white text-base font-semibold ml-2">
          Ajouter une photo
        </Text>
      </TouchableOpacity>
    </View>
  );
}
