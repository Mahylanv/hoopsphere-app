// src/Profil/Joueur/components/AvatarSection.tsx

import React from "react";
import { View, Image, TouchableOpacity, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

type Props = {
  user: {
    avatar: string | null;
    prenom: string;
    nom: string;
  };
  onEditAvatar: (uri: string) => Promise<void>;
  avatarLoading: boolean;
};

export default function AvatarSection({
  user,
  onEditAvatar,
  avatarLoading,
}: Props) {
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert("Permission refusée !");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        await onEditAvatar(uri);
      }
    } catch (e) {
      console.error("Erreur lors du choix de l'image >", e);
    }
  };

  return (
    <View className="items-center mt-12">
      <View className="relative">
        {/* Avatar */}
        <Image
          source={{
            uri:
              user.avatar ||
              "https://i.pravatar.cc/300?img=12",
          }}
          className="w-32 h-32 rounded-full border border-gray-700"
        />

        {/* Bouton modifier */}
        <TouchableOpacity
          onPress={pickImage}
          disabled={avatarLoading}
          className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
        >
          <Feather name="edit-2" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <Text className="mt-4 text-xl font-semibold text-white">
        {user.prenom} {user.nom}
      </Text>
    </View>
  );
}
