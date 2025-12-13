import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db, auth } from "../../../config/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp
} from "firebase/firestore";

type Visitor = {
  id: string;
  viewerUid: string;
  viewerType: string;
  viewedAt: Timestamp;
  prenom?: string;
  nom?: string;
};

export default function VisitorsScreen() {
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchVisitors = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        // 📌 Aujourd'hui à minuit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
          collection(db, "joueurs", uid, "views"),
          where("viewedAt", ">=", Timestamp.fromDate(today)) // 🔥 UNIQUEMENT VISITES DU JOUR
        );

        const snaps = await getDocs(q);

        const rawVisitors: Visitor[] = snaps.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        // 🔥 On retire les doublons pour garder 1 visite / personne / jour
        const uniqueVisitors = Object.values(
          rawVisitors.reduce((acc: any, v: Visitor) => {
            acc[v.viewerUid] = v;
            return acc;
          }, {})
        ) as Visitor[];

        // 🔥 On charge nom + prénom pour chaque visiteur
        const enriched = [];
        for (let v of uniqueVisitors) {
          const snap = await getDocs(
            collection(db, "joueurs")
          );

          let name = { prenom: "Inconnu", nom: "" };

          const userDoc = snap.docs.find((d) => d.id === v.viewerUid);

          if (userDoc) {
            const data = userDoc.data() as any;
            name = {
              prenom: data.prenom || "Inconnu",
              nom: data.nom || "",
            };
          }

          enriched.push({
            ...v,
            ...name,
          });
        }

        setVisitors(enriched);
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
          Visiteurs (aujourd’hui)
        </Text>
      </View>

      <View className="px-4 mt-2 flex-1">
        {visitors.length === 0 ? (
          <Text className="text-gray-400 mt-10 text-center">
            Aucun visiteur aujourd’hui.
          </Text>
        ) : (
          <FlatList
            data={visitors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-gray-900 p-4 rounded-lg mb-3">
                <Text className="text-white font-semibold">
                  {item.prenom} {item.nom}
                </Text>
                <Text className="text-gray-400">
                  Type : {item.viewerType || "inconnu"}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  {item.viewedAt?.toDate
                    ? item.viewedAt.toDate().toLocaleTimeString()
                    : "Heure inconnue"}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
