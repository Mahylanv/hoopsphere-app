// src/Profil/Joueur/components/DeleteAccountSection.tsx

import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { deleteUserAccount } from "../services/userService";
import { RootStackParamList } from "../../../types";

export default function DeleteAccountSection() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Suppression du compte
  const handleDelete = () => {
    Alert.alert(
      "Supprimer mon compte",
      "Cette action est irréversible. Es-tu sûr de vouloir supprimer ton compte ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserAccount();
              Alert.alert("Compte supprimé", "Ton compte a été supprimé 👋");
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
              });
            } catch (e) {
              Alert.alert(
                "Erreur",
                "Impossible de supprimer ton compte. Réessaie plus tard."
              );
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="px-6 mb-10">
      <TouchableOpacity
        onPress={handleDelete}
        activeOpacity={0.9}
        className="flex-row items-center justify-center py-3.5 px-6 rounded-2xl bg-[#1A0F0F] border border-red-500/70 shadow-lg shadow-black/40"
      >
        <Ionicons name="trash-outline" size={18} color="#F87171" />
        <Text className="text-white text-base font-semibold text-center ml-2">
          Supprimer mon compte
        </Text>
      </TouchableOpacity>
    </View>
  );
}
