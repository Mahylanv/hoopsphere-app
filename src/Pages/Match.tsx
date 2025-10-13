import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import * as Animatable from "react-native-animatable";

export default function Match() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCreateMatch = () => {
    // 👉 Ici, on ajoutera la logique ou la redirection vers la page de création
    console.log("Créer un match");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0E0D0D" }}>
      <StatusBar barStyle="light-content" />

      <View className="flex-1 justify-center items-center px-6">
        {/* Titre */}
        <Text className="text-white text-2xl font-bold mb-8">Gestion des matchs</Text>

        {/* Bouton Créer un match */}
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          easing="ease-in-out"
          duration={2000}
        >
          <TouchableOpacity
            onPress={handleCreateMatch}
            className="py-4 px-10 rounded-2xl bg-blue-600 shadow-md shadow-black"
          >
            <Text className="text-white text-lg font-bold">Créer un match</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </SafeAreaView>
  );
}
