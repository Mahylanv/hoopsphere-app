// src/Profil/Joueurs/screens/VisitorsScreen.tsx

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../../config/firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth } from "../../../config/firebaseConfig";

export default function VisitorsScreen() {
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<any[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchVisitors = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const q = query(
          collection(db, "joueurs", uid, "views"),
          orderBy("viewedAt", "desc")
        );

        const snaps = await getDocs(q);

        const list = snaps.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVisitors(list);
      } catch (e) {
        console.log("Erreur chargement visiteurs :", e);
      }

      setLoading(false);
    };

    fetchVisitors();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-white mt-3">Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 mb-2">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full bg-gray-800 mr-3"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-white">
          Visiteurs du profil
        </Text>
      </View>

      {/* CONTENT */}
      <View className="px-4 mt-2 flex-1">
        {/* AUCUN VISITEUR */}
        {visitors.length === 0 ? (
          <Text className="text-gray-400 mt-10 text-center">
            Aucun visiteur pour le moment.
          </Text>
        ) : (
          <FlatList
            data={visitors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-gray-900 p-4 rounded-lg mb-3">
                <Text className="text-white font-semibold">
                  UID : {item.viewerUid}
                </Text>
                <Text className="text-gray-400">
                  Type : {item.viewerType || "inconnu"}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  {item.viewedAt?.toDate
                    ? item.viewedAt.toDate().toLocaleString()
                    : "Date inconnue"}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
