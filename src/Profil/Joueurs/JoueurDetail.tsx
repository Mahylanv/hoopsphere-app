import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import JoueurCard from "../../Components/JoueurCard"; // 🧩 notre nouvelle carte

type JoueurDetailRouteProp = RouteProp<RootStackParamList, "JoueurDetail">;
type NavProp = NativeStackNavigationProp<RootStackParamList, "JoueurDetail">;

export default function JoueurDetail() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<JoueurDetailRouteProp>();
  const { joueur } = route.params;

  return (
    <SafeAreaView className="flex-1 bg-[#0d0d0f]">
      <StatusBar barStyle="light-content" />

      {/* 🔹 Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full bg-gray-800"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">
          Détails du joueur
        </Text>
        <View style={{ width: 40 }} /> {/* équilibre visuel */}
      </View>

      {/* 🔹 Carte du joueur */}
      <View className="flex-1 items-center justify-center">
        <JoueurCard joueur={joueur} />
      </View>
    </SafeAreaView>
  );
}
