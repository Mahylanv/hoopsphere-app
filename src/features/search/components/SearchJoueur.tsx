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
} from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { Joueur } from "../../../types";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JoueurFilter, { JoueurFiltre } from "../components/JoueurFilter";
import { useFavoritePlayers } from "../hooks/useFavoritePlayers";
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";
import PremiumBadge from "../../../shared/components/PremiumBadge";

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

  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-[#0e0e10] px-4"
      style={{ paddingTop: insets.top + 22 }}
    >
      <View className="flex-row items-center justify-between mb-5">
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
      <View className="relative mb-6">
        <Ionicons
          name="person-outline"
          size={20}
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

      {/* Liste */}
      {loading ? (
        <ActivityIndicator size="large" color="#F97316" className="mt-10" />
      ) : (
        <FlatList
          data={filtered.slice(0, visibleCount)}
          keyExtractor={(item) => item.uid}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-10">
              Aucun joueur trouvé
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("JoueurDetail", { uid: item.uid })
              }
              activeOpacity={0.85}
              className="relative flex-row items-center bg-[#1a1b1f] rounded-2xl p-4 mb-4 border border-gray-800"
            >
              {/* ⭐ FAVORI — coin haut droit */}
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
                className="absolute top-2 right-2 z-10"
              >
                <Ionicons
                  name={isFavorite(item.uid) ? "star" : "star-outline"}
                  size={22}
                  color={isFavorite(item.uid) ? "#FACC15" : "#9ca3af"}
                />
              </TouchableOpacity>

              {/* AVATAR */}
              <Image
                source={{
                  uri: item.avatar || "https://i.pravatar.cc/150?img=3",
                }}
                className="w-20 h-20 rounded-full mr-4 border border-gray-700"
              />

              {/* INFOS JOUEUR */}
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-white font-bold text-lg">
                    {item.prenom} {item.nom}
                  </Text>
                  {item.premium && (
                    <View className="ml-2">
                      <PremiumBadge compact />
                    </View>
                  )}
                </View>

                <View className="flex-row items-center mb-1">
                  <Ionicons name="home-outline" size={14} color="#9ca3af" />
                  <Text className="text-gray-400 ml-1 text-sm">
                    {item?.club ?? "Sans club"}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons
                    name="basketball-outline"
                    size={14}
                    color="#9ca3af"
                  />
                  <Text className="text-gray-400 ml-1 text-sm">
                    {item?.poste ?? "Poste inconnu"}
                  </Text>

                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="#9ca3af"
                    style={{ marginLeft: 10 }}
                  />
                  <Text className="text-gray-400 ml-1 text-sm">
                    {item?.departement ?? "Département inconnu"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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
    </View>
  );
}
