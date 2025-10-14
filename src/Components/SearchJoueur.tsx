// src/components/SearchJoueur.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Image, ActivityIndicator, Dimensions } from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Joueur } from "../types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function SearchJoueur() {
  const [search, setSearch] = useState("");
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [filtered, setFiltered] = useState<Joueur[]>([]);
  const [visibleCount, setVisibleCount] = useState(5); // 👈 Limite stricte
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJoueurs = async () => {
      try {
        const q = query(collection(db, "joueurs"), orderBy("nom"));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() })) as Joueur[];
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
    setVisibleCount(5);
  }, [search, joueurs]);

  const handleLoadMore = () => {
    if (visibleCount < filtered.length) {
      setVisibleCount((prev) => prev + 5);
    }
  };

  const visibleData = filtered.slice(0, visibleCount);

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <Text className="text-white text-2xl font-bold mb-4">
        🔍 Rechercher un joueur
      </Text>

      <TextInput
        className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-6"
        placeholder="Nom, club ou département..."
        placeholderTextColor="#9ca3af"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#F97316" className="mt-10" />
      ) : (
        <FlatList
          data={visibleData}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View
              className="flex-row items-center bg-gray-800 rounded-2xl p-4 mb-5"
              style={{
                minHeight: SCREEN_HEIGHT / 7.5, // 👈 rend les cartes plus grandes, ≈ 5 visibles max
              }}
            >
              <Image
                source={{
                  uri: item.avatar || "https://via.placeholder.com/100x100.png?text=Joueur",
                }}
                className="w-20 h-20 rounded-full mr-4"
              />
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">
                  {item.prenom} {item.nom}
                </Text>
                <Text className="text-gray-400">{item?.club ?? "Sans club"}</Text>
                <Text className="text-gray-500 text-sm">
                  {item?.poste ?? "Poste inconnu"} • {item?.departement ?? "Département inconnu"}
                </Text>
              </View>
            </View>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            visibleCount < filtered.length ? (
              <Text className="text-center text-gray-400 mt-3">⬇️ Charger plus...</Text>
            ) : (
              <Text className="text-center text-gray-600 mt-3">Fin de la liste</Text>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
