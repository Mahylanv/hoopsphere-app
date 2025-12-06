// src/Home/components/WeeklyRanking.tsx

import React from "react";
import { View, Text, FlatList } from "react-native";
import RankingItem from "./RankingItem";

interface WeeklyRankingProps {
  players: {
    uid: string;
    prenom: string;
    nom: string;
    avatar: string;
    stats: { pts: number };
    rating: number;
  }[];
}

export default function WeeklyRanking({ players }: WeeklyRankingProps) {
  return (
    <View className="w-full mt-6 px-5">
      <Text className="text-white text-2xl font-bold mb-4">
        Classement de la semaine
      </Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.uid}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <RankingItem
            player={{
              uid: item.uid,
              rank: index + 1, // classement automatique
              name: `${item.prenom} ${item.nom}`,
              avatar: item.avatar,
              average: item.stats.pts, // moyenne de points
              rating: item.rating,
              trend: "same", 
              // 🟠 FUTUR :
              // trend viendra d'une comparaison entre le classement semaine dernière et maintenant
            }}
          />
        )}
      />
    </View>
  );
}
