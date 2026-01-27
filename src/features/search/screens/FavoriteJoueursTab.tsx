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
import { LinearGradient } from "expo-linear-gradient";

import type { RootStackParamList } from "../../../types";
import { useFavoritePlayers } from "../hooks/useFavoritePlayers";
import { usePlayers } from "../hooks/usePlayers";
import PremiumWall from "../../../shared/components/PremiumWall";
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";
import PremiumBadge from "../../../shared/components/PremiumBadge";
import { PROFILE_PLACEHOLDER } from "../../../constants/images";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type SortKey = "recent" | "name" | "poste" | "club";

export default function FavoriteJoueursTab() {
  const navigation = useNavigation<NavProp>();

  const { isPremium, loading: premiumLoading } = usePremiumStatus();

  const {
    favoritePlayerIds,
    toggleFavorite,
    clearAllFavorites,
  } = useFavoritePlayers(isPremium);

  const { players, loading } = usePlayers();

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const brand = {
    orange: "#F97316",
    blue: "#2563EB",
    surface: "#0E0D0D",
  } as const;

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
  if (premiumLoading || loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-black items-center justify-center"
        edges={["left", "right"]}
      >
        <Ionicons name="hourglass-outline" size={32} color="#777" />
        <Text className="text-gray-400 mt-3">Chargement…</Text>
      </SafeAreaView>
    );
  }

  if (!isPremium) {
    return (
      <PremiumWall
        message="Les favoris joueurs sont réservés aux comptes Premium."
        onPressUpgrade={() => navigation.navigate("Payment")}
      />
    );
  }

  /* ============================
     EMPTY
  ============================ */
  if (favoritePlayers.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-black items-center justify-center"
        edges={["left", "right"]}
      >
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
    <SafeAreaView className="flex-1 bg-black" edges={["left", "right"]}>
      {/* ===== HEADER ===== */}
      <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-white text-2xl font-bold mr-3">
            Joueurs favoris
          </Text>
          <View className="bg-orange-500 px-2 py-0.5 rounded-full">
            <Text className="text-white font-bold text-sm">
              {favoritesCount}
            </Text>
          </View>
        </View>

        {/* OPTIONS BUTTON + BADGE */}
        <TouchableOpacity
          onPress={() => setOptionsVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={26}
            color="#F97316"
          />
        </TouchableOpacity>
      </View>

      {/* ===== LIST ===== */}
      <FlatList
        data={favoritePlayers}
        keyExtractor={(item) => item.uid}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const avatarUri =
            typeof item.avatar === "string" ? item.avatar.trim() : "";
          const avatarSource =
            avatarUri && avatarUri !== "null" && avatarUri !== "undefined"
              ? { uri: avatarUri }
              : PROFILE_PLACEHOLDER;

          return (
            <LinearGradient
              colors={[brand.blue, brand.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 1.5, marginBottom: 12 }}
            >
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("JoueurDetail", { uid: item.uid })
                }
                activeOpacity={0.85}
                className="bg-[#0E0D0D] rounded-[16px] p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Image
                      source={avatarSource}
                      className="w-16 h-16 rounded-full mr-4 border border-gray-700"
                    />

                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-semibold text-lg">
                        {item.prenom} {item.nom}
                      </Text>
                      {item.premium && (
                        <View className="ml-2">
                          <PremiumBadge compact />
                        </View>
                      )}
                    </View>

                    <Text className="text-gray-400 text-sm">
                      {item.poste || "Poste inconnu"}
                    </Text>

                    <Text className="text-gray-500 text-sm">
                      {item.club || "Sans club"}
                    </Text>
                  </View>
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
            </LinearGradient>
          );
        }}
      />

      {/* ===== OPTIONS MODAL ===== */}
      <Modal
        visible={optionsVisible}
        transparent
        animationType="fade"
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
