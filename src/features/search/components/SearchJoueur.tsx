// src/components/SearchJoueur.tsx — Version corrigée avec filtres complets

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { Joueur } from "../../../types";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../types";
import { SafeAreaView } from "react-native-safe-area-context";
import JoueurFilter, { JoueurFiltre } from "../components/JoueurFilter";
import { useFavoritePlayers } from "../hooks/useFavoritePlayers";
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";
import PremiumBadge from "../../../shared/components/PremiumBadge";
import { LinearGradient } from "expo-linear-gradient";

type NavProp = NativeStackNavigationProp<RootStackParamList, "SearchJoueur">;

const parseTaille = (t?: string) => {
  if (!t) return 0;
  return parseInt(t.replace("cm", "").replace(" ", ""));
};

const parsePoids = (p?: string) => {
  if (!p) return 0;
  return parseInt(p.replace("kg", "").replace(" ", ""));
};

export default function SearchJoueur() {
  const navigation = useNavigation<NavProp>();

  const { isPremium } = usePremiumStatus();

  const { favoritePlayerIds, isFavorite, toggleFavorite } =
    useFavoritePlayers(isPremium);

  const [search, setSearch] = useState("");
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [filtered, setFiltered] = useState<Joueur[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);

  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<JoueurFiltre>({});

  // Charger les joueurs
  useEffect(() => {
    const fetchJoueurs = async () => {
      try {
        const q = query(collection(db, "joueurs"), orderBy("nom"));
        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as Joueur[];

        setJoueurs(data);
        setFiltered(data);
      } catch (error) {
        console.error("Erreur lors du chargement des joueurs :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJoueurs();
  }, []);

  // Filtrage complet
  useEffect(() => {
    let results = joueurs;

    // Recherche textuelle
    if (search) {
      const lower = search.toLowerCase();
      results = results.filter(
        (j) =>
          j.nom?.toLowerCase().includes(lower) ||
          j.prenom?.toLowerCase().includes(lower) ||
          j.club?.toLowerCase().includes(lower) ||
          j.departement?.toLowerCase().includes(lower)
      );
    }

    // Poste
    if (filters.poste && filters.poste.length > 0) {
      results = results.filter(
        (j) => j.poste && filters.poste!.includes(j.poste)
      );
    }

    // Département
    if (filters.departement && filters.departement.length > 0) {
      results = results.filter(
        (j) => j.departement && filters.departement!.includes(j.departement)
      );
    }

    // Genre
    if (filters.genre && filters.genre.length > 0) {
      results = results.filter(
        (j) => j.genre && filters.genre!.includes(j.genre)
      );
    }

    // Main forte
    if (filters.main && filters.main.length > 0) {
      results = results.filter(
        (j) => j.main && filters.main!.includes(j.main.trim())
      );
    }

    // Taille
    if (filters.tailleMin != null) {
      results = results.filter(
        (j) => parseTaille(j.taille) >= filters.tailleMin!
      );
    }

    if (filters.tailleMax != null) {
      results = results.filter(
        (j) => parseTaille(j.taille) <= filters.tailleMax!
      );
    }

    // Poids
    if (filters.poidsMin != null) {
      results = results.filter((j) => parsePoids(j.poids) >= filters.poidsMin!);
    }

    if (filters.poidsMax != null) {
      results = results.filter((j) => parsePoids(j.poids) <= filters.poidsMax!);
    }

    setFiltered(results);
    setVisibleCount(6);
  }, [search, joueurs, filters]);

  const handleLoadMore = () => {
    if (visibleCount < filtered.length) {
      setVisibleCount((prev) => prev + 6);
    }
  };

  const brand = {
    orange: "#F97316",
    blue: "#2563EB",
    surface: "#0E0D0D",
  } as const;

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["left", "right"]}>
      <StatusBar barStyle="light-content" />
      <View className="px-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="search-outline" size={22} color="#F97316" />
            <Text className="text-white text-2xl font-bold ml-2">
              Rechercher un joueur
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!isPremium) {
                Alert.alert(
                  "Réservé aux membres Premium",
                  "Active le Premium pour utiliser les filtres de recherche avancés."
                );
                return;
              }
              setFilterVisible(true);
            }}
            className="p-2 rounded-xl"
          >
            <Ionicons name="filter-outline" size={26} color="#F97316" />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View className="relative mb-4">
          <Ionicons
            name="person-outline"
            size={18}
            color="#9ca3af"
            style={{ position: "absolute", left: 14, top: 15 }}
          />

          <TextInput
            className="bg-gray-900 text-white rounded-2xl pl-10 pr-4 py-3 border border-gray-800"
            placeholder="Nom, club ou département..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Liste */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-gray-400 mt-3">Chargement des joueurs…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered.slice(0, visibleCount)}
          keyExtractor={(item) => item.uid}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-10">
              Aucun joueur trouvé
            </Text>
          }
          renderItem={({ item }) => (
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
                      source={{
                        uri: item.avatar || "https://i.pravatar.cc/150?img=3",
                      }}
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

                      <Text className="text-gray-400">
                        {item?.club ?? "Sans club"}
                      </Text>

                      <View className="flex-row flex-wrap mt-1">
                        {!!item.poste && (
                          <View className="px-2 py-0.5 mr-2 mb-1 bg-gray-700 rounded-full">
                            <Text className="text-xs text-gray-300">
                              {item.poste}
                            </Text>
                          </View>
                        )}
                        {!!item.departement && (
                          <View className="px-2 py-0.5 mr-2 mb-1 bg-gray-700 rounded-full">
                            <Text className="text-xs text-gray-300">
                              {item.departement}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* ⭐ FAVORI */}
                  <TouchableOpacity
                    onPress={() => {
                      if (!isPremium) {
                        Alert.alert(
                          "Favoris Premium",
                          "Ajoute des joueurs en favori en passant en Premium."
                        );
                        return;
                      }
                      toggleFavorite(item.uid);
                    }}
                    hitSlop={10}
                    className="ml-3"
                  >
                    <Ionicons
                      name={isFavorite(item.uid) ? "star" : "star-outline"}
                      size={22}
                      color={isFavorite(item.uid) ? "#FACC15" : "#9ca3af"}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          )}
          ListFooterComponent={
            visibleCount < filtered.length ? (
              <TouchableOpacity onPress={handleLoadMore} className="mt-3">
                <Text className="text-center text-orange-500 font-semibold">
                  Charger plus
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-center text-gray-600 mt-3">
                Fin de la liste
              </Text>
            )
          }
        />
      )}

      {/* Modal filtres */}
      <JoueurFilter
        visible={filterVisible && isPremium}
        onClose={() => setFilterVisible(false)}
        onApply={(f) => setFilters(f)}
      />
    </SafeAreaView>
  );
}
