// src/features/profile/player/components/AvatarSection.tsx

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
import PremiumBadge from "../../../../shared/components/PremiumBadge";
import {
  CARD_PREMIUM,
  CARD_NORMAL,
  PROFILE_PLACEHOLDER,
} from "../../../../constants/images";

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
    premium?: boolean;
    cardStyle?: "normal" | "premium";
  };
  onEditAvatar: (uri: string) => Promise<void>;
  avatarLoading: boolean;
  stats?: PlayerStats; 
  rating?: number;
  editable?: boolean;
};

export default function AvatarSection({
  user,
  onEditAvatar,
  avatarLoading,
  stats,
  rating,
  editable = true,
}: Props) {
  const avatarSize = 147;
  const avatarUri =
    typeof user.avatar === "string" &&
    user.avatar.trim() !== "" &&
    user.avatar !== "null" &&
    user.avatar !== "undefined"
      ? user.avatar
      : null;
  const cardSource =
  user.premium && user.cardStyle === "premium"
    ? CARD_PREMIUM
    : CARD_NORMAL;

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
        source={cardSource}
        resizeMode="contain"
        style={{
          width: 460,
          height: 600,
          alignItems: "center",
        }}
      >
        {/* 🟦 Avatar dans le rond */}
        <View
          className="absolute overflow-hidden"
          style={{
            top: 73.3,
            right: 103.8,
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            zIndex: 20,
          }}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              className="w-full h-full"
            />
          ) : (
            <Image
              source={PROFILE_PLACEHOLDER}
              className="w-full h-full"
              resizeMode="cover"
            />
          )}

          {/* ✏️ Bouton modifier avatar */}
          {editable && (
            <TouchableOpacity
              onPress={pickImage}
              disabled={avatarLoading}
              className="absolute bottom-1 right-1 bg-black/60 p-1.5 rounded-full"
            >
              <Feather name="edit-2" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* 🟣 Nom */}
        <View
          className="absolute w-full items-center"
          style={{
            top: 240,
          }}
        >
          <View className="flex-row items-center justify-center">
            <Text
              className="text-white font-bold text-2xl"
              style={{
                textShadowColor: "black",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 4,
              }}
            >
              {user.prenom} {user.nom}
            </Text>
            {user.premium && (
              <View className="ml-2">
                <PremiumBadge compact />
              </View>
            )}
          </View>
        </View>

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
