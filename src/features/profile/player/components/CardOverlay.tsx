// src/features/profile/player/components/CardOverlay.tsx

import React from "react";
import { View, Text } from "react-native";

type PlayerFields = {
  dob?: string;
  taille?: string;
  poids?: string;
  poste?: string;
  main?: string;
  departement?: string;
  club?: string;
  description?: string;
};

export type PlayerStats = {
  gamesPlayed: number;
  pts: number;
  threes: number;
  twoInt: number;
  twoExt: number;
  lf: number;
  fouls: number;
} | null;

type Props = {
  fields: PlayerFields;
  stats?: PlayerStats; 
  rating?: number;
};

export default function CardOverlay({ fields, stats, rating }: Props) {
  return (
    <>
      {/* 🟠 NOTE — moyenne des points */}
      <View
        className="absolute bg-orange-500/90 rounded-full items-center justify-center"
        style={{
          top: "12.6%",
          left: "24.6%",
          width: 67,
          height: 67,
          zIndex: 5,
        }}
      >
        <Text className="text-white text-2xl font-extrabold">
          {rating ?? "-"}
        </Text>
      </View>

      {/* 🟣 Poste du joueur */}
      <View
        className="absolute bg-[#111827]/90 border border-orange-500 rounded-full items-center justify-center"
        style={{
          top: "25%",
          left: "24.5%",
          width: 67,
          height: 67,
        }}
      >
        <Text className="text-white font-semibold text-xl">
          {fields.poste?.slice(0, 3).toUpperCase() || "N/A"}
        </Text>
      </View>

      {/* 🟦 Bloc statistiques */}
      <View
        className="absolute flex-row justify-between"
        style={{
          top: "50%",
          width: "90%",
          alignSelf: "center",
        }}
      >
        {/* Bloc gauche */}
        <View className="flex-row w-[46%] justify-end">
          <View className="space-y-3.5 items-end pr-3">
            <Text className="text-white text-[25px] py-1 font-extrabold">
              {stats?.gamesPlayed ?? "-"}
            </Text>
            <Text className="text-white text-[25px] py-1 font-extrabold">
              {stats?.twoExt ?? "-"}
            </Text>
            <Text className="text-white text-[25px] py-1 font-extrabold">
              {stats?.threes ?? "-"}
            </Text>
            <Text className="text-white text-[25px] py-1 font-extrabold">
              {stats?.twoInt ?? "-"}
            </Text>
          </View>

          <View className="space-y-6 items-start pl-2">
            <Text className="text-gray-300 text-[13px] py-3 font-semibold">
              MJ
            </Text>
            <Text className="text-gray-300 text-[13px] py-3 font-semibold">
              2EXT
            </Text>
            <Text className="text-gray-300 text-[13px] py-3 font-semibold">
              TR
            </Text>
            <Text className="text-gray-300 text-[13px] py-2 pt-4 font-semibold">
              2INT
            </Text>
          </View>
        </View>

        {/* Bloc droite */}
        <View className="flex-row w-[46%] justify-start">
          <View className="space-y-3.5 items-end pr-3">
            <Text className="text-white text-[25px] py-1 font-extrabold">
              {stats?.pts ?? "-"}
            </Text>
            <Text className="text-white text-[25px] py-1 font-extrabold">
              {stats?.threes ?? "-"}
            </Text>
            <Text className="text-white text-[25px] py-1 font-extrabold">
              {stats?.lf ?? "-"}
            </Text>
            <Text className="text-white text-[25px] py-1 font-extrabold">
              {stats?.fouls ?? "-"}
            </Text>
          </View>

          <View className="space-y-3.5 items-start pl-2">
            <Text className="text-gray-300 text-[13px] py-3 font-semibold">
              PTS
            </Text>
            <Text className="text-gray-300 text-[13px] py-3 font-semibold">
              3PTS
            </Text>
            <Text className="text-gray-300 text-[13px] py-3 font-semibold">
              LF
            </Text>
            <Text className="text-gray-300 text-[13px] py-2 pt-4 font-semibold">
              F
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}
