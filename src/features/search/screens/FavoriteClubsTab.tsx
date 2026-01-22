import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  Pressable,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useFavoriteClubs } from "../hooks/useFavoriteClubs";
import { useClubs } from "../hooks/useClubs";
import type { RootStackParamList } from "../../../types";
import PremiumWall from "../../../shared/components/PremiumWall";
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";
import PremiumBadge from "../../../shared/components/PremiumBadge";

type FirestoreClub = {
  id: string;
  name: string;
  logo?: string;
  city?: string;
  categories?: string[];
  premium?: boolean;
  isPremium?: boolean;
};

type FavoriteSort = "recent" | "name_asc" | "categories_count";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const brand = {
  orange: "#F97316",
  orangeLight: "#fb923c",
  blue: "#2563EB",
  surface: "#0E0D0D",
} as const;

export default function FavoriteClubsTab() {
  const navigation = useNavigation<NavProp>();

  const { isPremium, loading: premiumLoading } = usePremiumStatus();

  const { favoriteClubIds, toggleFavorite, clearAllFavorites } =
    useFavoriteClubs(isPremium);

  const { clubs, loading } = useClubs();

  const [sortBy, setSortBy] = useState<FavoriteSort>("recent");
  const [optionsVisible, setOptionsVisible] = useState(false);

  /* ============================
     DATA
  ============================ */
  const favoriteClubs = useMemo(() => {
    const favs = clubs.filter((c) => favoriteClubIds.has(c.id));

    switch (sortBy) {
      case "name_asc":
        return [...favs].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

      case "categories_count":
        return [...favs].sort(
          (a, b) => (b.categories?.length ?? 0) - (a.categories?.length ?? 0)
        );

      case "recent":
      default:
        return favs;
    }
  }, [clubs, favoriteClubIds, sortBy]);

  const favoritesCount = favoriteClubIds.size;

  /* ============================
     LOADING / EMPTY
  ============================ */
  if (premiumLoading || loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-black items-center justify-center"
        edges={["left", "right"]}
      >
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  if (!isPremium) {
    return (
      <PremiumWall
        message="Les favoris clubs sont réservés aux membres Premium."
        onPressUpgrade={() => navigation.navigate("Payment")}
      />
    );
  }

  if (favoriteClubs.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-black items-center justify-center"
        edges={["left", "right"]}
      >
        <Ionicons name="star-outline" size={48} color="#555" />
        <Text className="text-gray-400 mt-3">Aucun club en favori</Text>
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
            Clubs favoris
          </Text>

          <View className="bg-orange-500 px-2 py-0.5 rounded-full">
            <Text className="text-white font-bold text-sm">
              {favoritesCount}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setOptionsVisible(true)}>
          <Ionicons name="options-outline" size={26} color="#F97316" />
        </TouchableOpacity>
      </View>

      {/* ===== LIST ===== */}
      <FlatList
        data={favoriteClubs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const cats = (item.categories ?? []).slice(0, 6);

          return (
            <LinearGradient
              colors={[brand.blue, brand.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 1.5, marginBottom: 12 }}
            >
              <Pressable
                onPress={() =>
                  navigation.navigate("ProfilClub", { club: item as any })
                }
                className="bg-[#0E0D0D] rounded-[16px] p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    {item.logo ? (
                      <Image
                        source={{ uri: item.logo }}
                        className="w-16 h-16 rounded-lg mr-4"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-lg mr-4 bg-gray-700 items-center justify-center">
                        <Ionicons name="image" size={20} color="#bbb" />
                      </View>
                    )}

                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap">
                        <Text className="text-white text-lg font-semibold">
                          {item.name || "Club sans nom"}
                        </Text>
                        {(item.premium || item.isPremium) && (
                          <View className="ml-2">
                            <PremiumBadge compact />
                          </View>
                        )}
                      </View>

                      <Text className="text-gray-400">{item.city || "—"}</Text>

                      <View className="flex-row flex-wrap mt-1">
                        {cats.map((c) => (
                          <View
                            key={`${item.id}-${c}`}
                            className="px-2 py-0.5 mr-2 mb-1 bg-gray-700 rounded-full"
                          >
                            <Text className="text-xs text-gray-300">{c}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* ⭐ REMOVE FAVORI */}
                  <TouchableOpacity
                    onPress={() => toggleFavorite(item.id)}
                    hitSlop={10}
                  >
                    <Ionicons name="star" size={22} color="#FACC15" />
                  </TouchableOpacity>
                </View>
              </Pressable>
            </LinearGradient>
          );
        }}
      />

      {/* ===== OPTIONS MODAL ===== */}
      <Modal visible={optionsVisible} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/60 justify-end pb-4"
          onPress={() => setOptionsVisible(false)}
        >
          <View className="bg-[#1a1b1f] p-5 pb-8 rounded-t-3xl border-t border-gray-800">
            <Text className="text-white text-xl font-bold mb-4">Options</Text>

            <Text className="text-gray-400 mb-2">Trier par</Text>

            {[
              { key: "recent", label: "Récent" },
              { key: "name_asc", label: "Nom (A–Z)" },
              { key: "categories_count", label: "Nombre de catégories" },
            ].map((o) => (
              <TouchableOpacity
                key={o.key}
                onPress={() => {
                  setSortBy(o.key as FavoriteSort);
                  setOptionsVisible(false);
                }}
                className="py-3 flex-row items-center justify-between"
              >
                <Text
                  className={
                    sortBy === o.key
                      ? "text-orange-500 font-semibold"
                      : "text-white"
                  }
                >
                  {o.label}
                </Text>

                {sortBy === o.key && (
                  <Ionicons name="checkmark" size={20} color="#F97316" />
                )}
              </TouchableOpacity>
            ))}

            <View className="h-px bg-gray-700 my-4" />

            {/* 🔥 CLEAR ALL — EXACTEMENT COMME JOUEURS */}
            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                clearAllFavorites();
              }}
              className="py-3"
            >
              <Text className="text-red-500 font-semibold text-center">
                Retirer tous les favoris
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
