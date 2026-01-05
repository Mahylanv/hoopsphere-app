// src/Profil/Joueur/components/LogoutButton.tsx

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

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
    <View className="mt-10 px-6 mb-10">
      <View
      >
        <TouchableOpacity
          onPress={handleLogout}
          className="py-3 px-6 rounded-lg bg-orange-500 shadow-md shadow-black"
        >
          <Text className="text-white text-base font-semibold text-center">Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
