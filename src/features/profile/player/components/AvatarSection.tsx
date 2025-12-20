// src/Profil/Joueurs/components/AvatarSection.tsx

import React from "react";
import {
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  Text,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import CardOverlay from "./CardOverlay";

type PlayerStats = {
  gamesPlayed: number;
  pts: number;
  threes: number;
  twoInt: number;
  twoExt: number;
  lf: number;
  fouls: number;
} | null;

type Props = {
  user: {
    avatar: string | null;
    prenom: string;
    nom: string;
    dob?: string;
    taille?: string;
    poids?: string;
    poste?: string;
    main?: string;
    departement?: string;
    club?: string;
    description?: string;
  };
  onEditAvatar: (uri: string) => Promise<void>;
  avatarLoading: boolean;
  stats?: PlayerStats; 
  rating?: number;
};

export default function AvatarSection({
  user,
  onEditAvatar,
  avatarLoading,
  stats,
  rating,
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
        quality: 0.9,
      });

      if (!result.canceled && result.assets.length > 0) {
        await onEditAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.error("Erreur lors du choix de l'image >", e);
    }
  };

  return (
    <View className="items-center mt-8">
      {/* 🟧 Carte background */}
      <ImageBackground
        source={require("../../../../../assets/CARD-NORMAL-FOND.png")}
        resizeMode="contain"
        style={{
          width: 460,
          height: 600,
          alignItems: "center",
        }}
      >
        {/* 🟦 Avatar dans le rond */}
        <View
          className="absolute bg-[#111] overflow-hidden"
          style={{
            top: 76,
            right: 106,
            width: 141,
            height: 141,
            borderRadius: 134 / 2,
          }}
        >
          <Image
            source={{
              uri: user.avatar || "https://i.pravatar.cc/300?img=12",
            }}
            className="w-full h-full"
          />

          {/* ✏️ Bouton modifier avatar */}
          <TouchableOpacity
            onPress={pickImage}
            disabled={avatarLoading}
            className="absolute bottom-1 right-1 bg-black/60 p-1.5 rounded-full"
          >
            <Feather name="edit-2" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* 🟣 Nom */}
        <Text
          className="absolute text-white font-bold text-2xl"
          style={{
            top: 247,
            width: "100%",
            textAlign: "center",
            textShadowColor: "black",
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 4,
          }}
        >
          {user.prenom} {user.nom}
        </Text>

        {/* 🆕 Surcouche d'informations + stats */}
        <CardOverlay
          fields={{
            dob: user.dob,
            taille: user.taille,
            poids: user.poids,
            poste: user.poste,
            main: user.main,
            departement: user.departement,
            club: user.club,
            description: user.description,
          }}
          stats={stats} // 🆕 on passe bien les stats ici
          rating={rating}     // 👈 AJOUT
          />
      </ImageBackground>
    </View>
  );
}
