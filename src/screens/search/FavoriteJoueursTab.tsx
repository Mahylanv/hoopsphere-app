import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../types";
import { useFavoritePlayers } from "../../hooks/search/useFavoritePlayers";
import { usePlayers } from "../../hooks/search/usePlayers";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type SortKey = "recent" | "name" | "poste" | "club";

export default function FavoriteJoueursTab() {
  const navigation = useNavigation<NavProp>();

  const {
    favoritePlayerIds,
    isFavorite,
    toggleFavorite,
    clearAllFavorites,
  } = useFavoritePlayers();

  const { players, loading } = usePlayers();

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  /* ============================
     FAVORITES + SORT
  ============================ */
  const favoritePlayers = useMemo(() => {
    const favs = players.filter((p) => favoritePlayerIds.has(p.uid));

    switch (sortBy) {
      case "name":
        return [...favs].sort((a, b) =>
          `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
        );

      case "poste":
        return [...favs].sort((a, b) =>
          (a.poste || "").localeCompare(b.poste || "")
        );

      case "club":
        return [...favs].sort((a, b) =>
          (a.club || "").localeCompare(b.club || "")
        );

      case "recent":
      default:
        return favs;
    }
  }, [players, favoritePlayerIds, sortBy]);

  const favoritesCount = favoritePlayerIds.size;

  /* ============================
     LOADING
  ============================ */
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Ionicons name="hourglass-outline" size={32} color="#777" />
        <Text className="text-gray-400 mt-3">Chargement…</Text>
      </SafeAreaView>
    );
  }

  /* ============================
     EMPTY
  ============================ */
  if (favoritePlayers.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Ionicons name="star-outline" size={48} color="#555" />
        <Text className="text-gray-400 mt-3">
          Aucun joueur en favori
        </Text>
      </SafeAreaView>
    );
  }

  /* ============================
     UI
  ============================ */
  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* ===== HEADER ===== */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-white text-2xl font-bold mr-3">
            Joueurs favoris
          </Text>
        </View>

        {/* OPTIONS BUTTON + BADGE */}
        <TouchableOpacity
          onPress={() => setOptionsVisible(true)}
          className="relative"
        >
          <Ionicons
            name="options-outline"
            size={24}
            color="#F97316"
          />

          {favoritesCount > 0 && (
            <View className="absolute -top-2 -right-2 bg-orange-500 w-5 h-5 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {favoritesCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ===== LIST ===== */}
      <FlatList
        data={favoritePlayers}
        keyExtractor={(item) => item.uid}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("JoueurDetail", { uid: item.uid })
            }
            activeOpacity={0.85}
            className="bg-[#1a1b1f] rounded-2xl p-4 mb-3 border border-gray-800"
          >
            <View className="flex-row items-center">
              <Image
                source={{
                  uri:
                    item.avatar ||
                    "https://i.pravatar.cc/150?img=3",
                }}
                className="w-16 h-16 rounded-full mr-4 border border-gray-700"
              />

              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">
                  {item.prenom} {item.nom}
                </Text>

                <Text className="text-gray-400 text-sm">
                  {item.poste || "Poste inconnu"}
                </Text>

                <Text className="text-gray-500 text-sm">
                  {item.club || "Sans club"}
                </Text>
              </View>

              {/* ⭐ REMOVE FAVORITE */}
              <TouchableOpacity
                onPress={() => toggleFavorite(item.uid)}
                hitSlop={10}
              >
                <Ionicons
                  name="star"
                  size={22}
                  color="#FACC15"
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ===== OPTIONS MODAL ===== */}
      <Modal
        visible={optionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <Pressable
          onPress={() => setOptionsVisible(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-[#111] rounded-t-3xl p-5">
            <Text className="text-white text-lg font-bold mb-4">
              Options des favoris
            </Text>

            {/* TRI */}
            <Text className="text-gray-400 mb-2">Trier par</Text>

            {[
              { key: "recent", label: "Récents" },
              { key: "name", label: "A–Z" },
              { key: "poste", label: "Poste" },
              { key: "club", label: "Club" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  setSortBy(opt.key as SortKey);
                  setOptionsVisible(false);
                }}
                className="py-3 flex-row items-center justify-between"
              >
                <Text
                  className={
                    sortBy === opt.key
                      ? "text-orange-500 font-semibold"
                      : "text-white"
                  }
                >
                  {opt.label}
                </Text>

                {sortBy === opt.key && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color="#F97316"
                  />
                )}
              </TouchableOpacity>
            ))}

            <View className="h-px bg-gray-800 my-4" />

            {/* CLEAR ALL */}
            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                clearAllFavorites();
              }}
              className="py-3"
            >
              <Text className="text-red-500 font-semibold text-center">
                Tout retirer des favoris
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
