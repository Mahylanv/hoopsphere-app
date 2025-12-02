import React from "react";
import { View, Image, ImageBackground, TouchableOpacity, Text } from "react-native";
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

export default function AvatarSection({ user, onEditAvatar, avatarLoading }: Props) {
  
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert("Permission refusée !");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
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
    <View className="items-center mt-8">
      
      {/* 🟧 Carte background */}
      <ImageBackground
        source={require("../../../../assets/CARD-NORMAL-FOND.png")}
        style={{
          width: 470,
          height: 570,
          alignItems: "center",
        }}
        resizeMode="contain"
      >

        {/* 🟦 Avatar dans le grand rond */}
        <View
          style={{
            position: "absolute",
            top: 72,         // ajusté pour placer dans le cercle
            right: 117,
            width: 134,
            height: 134,
            borderRadius: 125 / 2,
            overflow: "hidden",
            backgroundColor: "#222",
          }}
        >
          <Image
            source={{
              uri: user.avatar || "https://i.pravatar.cc/300?img=12",
            }}
            style={{ width: "100%", height: "100%" }}
          />

          {/* ✏️ Bouton modifier avatar */}
          <TouchableOpacity
            onPress={pickImage}
            disabled={avatarLoading}
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              backgroundColor: "rgba(0,0,0,0.6)",
              padding: 6,
              borderRadius: 100,
            }}
          >
            <Feather name="edit-2" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* 🟣 Nom + prénom au centre bas */}
        <Text
          style={{
            position: "absolute",
            top: 240,
            textAlign: "center",
            width: "100%",
            color: "white",
            fontWeight: "bold",
            fontSize: 22,
            textShadowColor: "black",
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 4,
          }}
        >
          {user.prenom} {user.nom}
        </Text>

      </ImageBackground>
    </View>
  );
}
