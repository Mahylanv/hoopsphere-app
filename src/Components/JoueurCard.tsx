import React, { useMemo } from "react";
import { View, Text, Image, Dimensions } from "react-native";
import { Joueur } from "../types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;

type Props = {
  joueur: Joueur;
};

export default function JoueurCard({ joueur }: Props) {
  const note = useMemo(() => Math.floor(Math.random() * 20) + 80, []);

  return (
    <View className="flex-1 items-center pt-4">
      {/* 🏀 Fond de la carte */}
      <View
        className="relative"
        style={{
          width: CARD_WIDTH,
          aspectRatio: 0.68,
        }}
      >
        <Image
          source={require("../../assets/CARD-NORMAL-FOND.png")}
          className="absolute w-full h-full"
          resizeMode="contain"
        />

        {/* ⭐ Note */}
        <View className="absolute top-[12.5%] left-[21%] bg-orange-500/90 w-[58px] h-[58px] rounded-full items-center justify-center">
          <Text className="text-white text-xl font-bold">{note}</Text>
        </View>

        {/* 🏀 Poste */}
        <View className="absolute top-[25%] left-[21%] bg-[#111827]/90 border border-orange-500 w-[60px] h-[60px] rounded-full items-center justify-center">
          <Text className="text-white font-semibold text-xl">
            {joueur.poste?.slice(0, 3).toUpperCase() || "N/A"}
          </Text>
        </View>

        {/* 🧍‍♂️ Photo */}
        <View className="absolute top-[12%] right-[19%] w-[125px] h-[125px] rounded-full overflow-hidden bg-[#0e0e10]">
          <Image
            source={{
              uri:
                joueur.avatar ||
                "https://via.placeholder.com/200x200.png?text=Joueur",
            }}
            className="w-full h-full"
          />
        </View>

        {/* 🏷️ Nom */}
        <View className="absolute top-[42%] w-full items-center">
          <Text className="text-white text-[20px] font-bold drop-shadow">
            {joueur.prenom} {joueur.nom}
          </Text>
        </View>

        {/* 📊 Stats parfaitement alignées et centrées */}
        <View className="absolute top-[58%] w-[70%] self-center flex-row justify-between">
          {/* 🟧 Bloc gauche */}
          <View className="flex-row w-[46%] justify-end">
            {/* Valeurs */}
            <View className="space-y-3.5 items-end pr-2">
              <Text className="text-white text-[20px] font-extrabold">90</Text>
              <Text className="text-white text-[20px] font-extrabold">300</Text>
              <Text className="text-white text-[20px] font-extrabold">75</Text>
              <Text className="text-white text-[20px] font-extrabold">42</Text>
            </View>

            {/* Labels */}
            <View className="space-y-3.5 items-start pl-1">
              <Text className="text-gray-300 text-[13px] font-semibold tracking-wide">
                MJ
              </Text>
              <Text className="text-gray-300 text-[13px] font-semibold tracking-wide">
                PTS
              </Text>
              <Text className="text-gray-300 text-[13px] font-semibold tracking-wide">
                TR
              </Text>
              <Text className="text-gray-300 text-[13px] font-semibold tracking-wide">
                2INT
              </Text>
            </View>
          </View>

          {/* 🟦 Bloc droit */}
          <View className="flex-row w-[46%] justify-start">
            {/* Valeurs */}
            <View className="space-y-3.5 items-end pr-2">
              <Text className="text-white text-[20px] font-extrabold">18</Text>
              <Text className="text-white text-[20px] font-extrabold">9</Text>
              <Text className="text-white text-[20px] font-extrabold">22</Text>
              <Text className="text-white text-[20px] font-extrabold">7</Text>
            </View>

            {/* Labels */}
            <View className="space-y-3.5 items-start pl-1">
              <Text className="text-gray-300 text-[13px] font-semibold tracking-wide">
                2EXT
              </Text>
              <Text className="text-gray-300 text-[13px] font-semibold tracking-wide">
                3PTS
              </Text>
              <Text className="text-gray-300 text-[13px] font-semibold tracking-wide">
                LF
              </Text>
              <Text className="text-gray-300 text-[13px] font-semibold tracking-wide">
                F
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
