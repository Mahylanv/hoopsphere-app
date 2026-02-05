// src/Profil/Joueurs/components/FloatingShareButton.tsx

import React from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

type Props = {
  cardRef: React.RefObject<ViewShot | null>;
};

export default function FloatingShareButton({ cardRef }: Props) {
  /* -----------------------------------------------------
      📸 Capture + Partage direct
  ----------------------------------------------------- */
  const shareCard = async () => {
    try {
      const uri = await cardRef.current?.capture?.();
      if (!uri) {
        Alert.alert("Erreur", "Impossible de capturer la carte.");
        return;
      }

      await Sharing.shareAsync(uri);
    } catch (e) {
      console.log("Erreur partage :", e);
      Alert.alert("Erreur", "Impossible de partager la carte.");
    }
  };

  return (
    <View className="w-full items-end pr-5 -mt-5 mb-3">
      <TouchableOpacity
        onPress={shareCard}
        className="
          w-[60px] h-[60px] rounded-full bg-[#ff6600]
          justify-center items-center
          shadow-lg shadow-black/40
        "
      >
        <Ionicons name="share-social-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
