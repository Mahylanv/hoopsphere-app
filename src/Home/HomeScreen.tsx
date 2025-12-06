// src/Home/HomeScreen.tsx

import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import usePlayerRanking from "../hooks/usePlayerRanking";
import WeeklyRanking from "./components/WeeklyRanking";

export default function HomeScreen() {
  const { ranking, loading } = usePlayerRanking();

  return (
    <ScrollView className="flex-1 bg-[#0E0D0D]">
      {/* HEADER */}
      <View className="px-5 pt-10 pb-5">
        <Text className="text-3xl font-bold text-white">
          Bienvenue sur HoopSphere 👋
        </Text>
        <Text className="text-gray-400 mt-1">
          Découvre les meilleurs performances de la semaine
        </Text>
      </View>

      {/* LOADING */}
      {loading && (
        <View className="mt-10 items-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-white mt-3">Chargement du classement...</Text>
        </View>
      )}

      {/* CLASSEMENT */}
      {!loading && ranking.length > 0 && (
        <WeeklyRanking players={ranking} />
      )}

      {/* CAS : aucun joueur */}
      {!loading && ranking.length === 0 && (
        <View className="items-center mt-10">
          <Text className="text-gray-400">Aucun joueur n’a encore été enregistré.</Text>
        </View>
      )}
    </ScrollView>
  );
}
