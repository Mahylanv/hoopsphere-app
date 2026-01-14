// src/Profil/Joueur/components/LogoutButton.tsx

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../../../../types";
import { getAuth, signOut } from "firebase/auth";

export default function LogoutButton() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (e) {
      console.error("Erreur logout :", e);
    }
  };

  return (
    <View className="mt-8 px-6 mb-10">
      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.9}
        className="flex-row items-center justify-center py-3.5 px-6 rounded-2xl bg-[#1A1A1A] border border-orange-400/60 shadow-lg shadow-black/40"
      >
        <Ionicons name="log-out-outline" size={18} color="#F97316" />
        <Text className="text-white text-base font-semibold text-center ml-2">
          Déconnexion
        </Text>
      </TouchableOpacity>
    </View>
  );
}
