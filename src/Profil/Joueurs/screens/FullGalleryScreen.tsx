// src/Profil/Joueurs/screens/FullGalleryScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const SIZE = width / 3 - 8;

export default function FullGalleryScreen({ route, navigation }: any) {
  const { images, onDeleteImage } = route.params;

  // 🎯 On initialise un STATE LOCAL basé sur les images envoyées
  const [localImages, setLocalImages] = useState<string[]>(images);

  // 🎯 Si jamais la liste change depuis la page précédente
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const handleDelete = (url: string) => {
    // ➜ 1. Supprimer dans Firebase via la callback
    onDeleteImage(url);

    // ➜ 2. Supprimer localement pour mise à jour instantanée
    setLocalImages((prev) => prev.filter((img) => img !== url));
  };

  return (
    <View className="flex-1 bg-black px-3 pt-10">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-xl font-bold">Toutes les photos</Text>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        numColumns={3}
        data={localImages}
        keyExtractor={(item) => item}
        columnWrapperStyle={{ gap: 6 }}
        contentContainerStyle={{ gap: 6 }}
        renderItem={({ item }) => (
          <View>
            <Image
              source={{ uri: item }}
              style={{
                width: SIZE,
                height: SIZE,
                borderRadius: 10,
                backgroundColor: "#111",
              }}
            />

            {/* Bouton supprimer */}
            {onDeleteImage && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 6,
                  borderRadius: 20,
                }}
                onPress={() => handleDelete(item)} // 👈 Mise à jour instant
              >
                <Ionicons name="trash-outline" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}
