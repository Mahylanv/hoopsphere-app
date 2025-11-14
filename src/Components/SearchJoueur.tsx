// src/components/SearchJoueur.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Joueur } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

type NavProp = NativeStackNavigationProp<RootStackParamList, "SearchJoueur">;

const SCREEN_HEIGHT = Dimensions.get("window").height;


export default function SearchJoueur() {
  const [search, setSearch] = useState("");
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [filtered, setFiltered] = useState<Joueur[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const lower = search.toLowerCase();
    const results = joueurs.filter(
      (j) =>
        j.nom?.toLowerCase().includes(lower) ||
        j.prenom?.toLowerCase().includes(lower) ||
        j.club?.toLowerCase().includes(lower) ||
        j.departement?.toLowerCase().includes(lower)
    );
    setFiltered(results);
    setVisibleCount(6);
  }, [search, joueurs]);

  const handleLoadMore = () => {
    if (visibleCount < filtered.length) {
      setVisibleCount((prev) => prev + 6);
    }
  };

  const visibleData = filtered.slice(0, visibleCount);

  const navigation = useNavigation<NavProp>();
  return (
    <SafeAreaView className="flex-1 bg-[#0e0e10] px-4 pt-2">
      {/* 🔹 En-tête */}
      <View className="flex-row items-center mb-5">
        <Ionicons name="search-outline" size={22} color="#F97316" />
        <Text className="text-white text-2xl font-bold ml-2">
          Rechercher un joueur
        </Text>
      </View>

      {/* 🔸 Barre de recherche */}
      <View className="relative mb-6">
        <Ionicons
          name="person-outline"
          size={20}
          color="#9ca3af"
          style={{ position: "absolute", left: 14, top: 15 }}
        />
        <TextInput
          className="bg-gray-900 text-white rounded-2xl pl-10 pr-4 py-3 border border-gray-800 focus:border-orange-500"
          placeholder="Nom, club ou département..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* 🔸 Liste des joueurs */}
      {loading ? (
        <ActivityIndicator size="large" color="#F97316" className="mt-10" />
      ) : (
        <FlatList
          data={visibleData}
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
            onPress={() => navigation.navigate("JoueurDetail", { joueur: item })}
            activeOpacity={0.8}
            className="flex-row items-center bg-[#1a1b1f] rounded-2xl p-4 mb-4 border border-gray-800 shadow-md"
          >
          
              {/* Avatar */}
              <Image
                source={{
                  uri:
                    item.avatar ||
                    "https://via.placeholder.com/100x100.png?text=Joueur",
                }}
                className="w-20 h-20 rounded-full mr-4 border border-gray-700"
              />

              {/* Infos */}
              <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">
                  {item.prenom} {item.nom}
                </Text>

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
    </SafeAreaView>
  );
}
