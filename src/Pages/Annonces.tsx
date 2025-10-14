// src/pages/Annonces.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";

export default function Annonces() {
  // 🔸 Exemple d'annonces mockées (à remplacer plus tard par Firestore)
  const annonces = [
    {
      id: "1",
      titre: "Recherche meneur U18",
      description: "Nous cherchons un meneur motivé pour la saison prochaine.",
      club: "AS Lille Métropole",
    },
    {
      id: "2",
      titre: "Recrutement équipe féminine",
      description: "Le club recrute des joueuses pour compléter son effectif senior.",
      club: "CSP Limoges",
    },
  ];

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <Text className="text-white text-2xl font-bold mb-4">📢 Annonces du club</Text>

      <FlatList
        data={annonces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-gray-800 p-4 mb-3 rounded-2xl">
            <Text className="text-orange-500 font-bold text-lg">{item.titre}</Text>
            <Text className="text-gray-300 mt-1">{item.description}</Text>
            <Text className="text-gray-400 text-sm mt-2 italic">🏀 {item.club}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
