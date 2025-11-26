// src/Profil/Joueur/components/GallerySection.tsx

import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  images: string[];
  onAddImage: () => void;
};

export default function GallerySection({ images, onAddImage }: Props) {
  return (
    <View className="mt-6 px-6">
      {/* Titre */}
      <Text className="text-xl font-bold text-white mb-4">Galerie</Text>

      {/* Galerie */}
      {images.length === 0 ? (
        <View className="flex-row items-center justify-center border border-gray-700 rounded-xl py-10 bg-[#1a1f25]">
          <Text className="text-gray-400 text-base">Aucune photo pour le moment</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
        >
          <View className="flex-row gap-4">
            {images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                className="w-32 h-32 rounded-xl border border-gray-800"
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Bouton ajouter */}
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
