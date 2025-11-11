// src/Profil/Clubs/ClubPresentation.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import { auth, db } from "../../config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

type ClubProfileRouteProp = RouteProp<RootStackParamList, "ProfilClub">;

export default function ClubPresentation() {
  const { params } = useRoute<ClubProfileRouteProp>();
  const [club, setClub] = useState<any>(params?.club || null);
  const [loading, setLoading] = useState(!params?.club);
  const [modalVisible, setModalVisible] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<"description" | "categories" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  // 🔹 Charger les infos du club connecté depuis Firestore
  useEffect(() => {
    const fetchClub = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, "clubs", uid));
      if (snap.exists()) setClub({ id: snap.id, ...snap.data() });
    };
  
    fetchClub();
  }, []);
  

  // 🔹 Mise à jour Firestore
  const updateClubField = async (field: string, value: any) => {
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const refClub = doc(db, "clubs", uid);

      await updateDoc(refClub, { [field]: value });
      setClub((prev: any) => ({ ...prev, [field]: value }));

      Alert.alert("✅ Succès", "Informations mises à jour !");
    } catch (err) {
      console.error("Erreur update club :", err);
      Alert.alert("Erreur", "Impossible de mettre à jour les informations.");
    } finally {
      setSaving(false);
      setModalVisible(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-300 mt-3">Chargement du profil...</Text>
      </View>
    );
  }

  if (!club) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-gray-300 text-center px-4">
          Aucune donnée trouvée.
        </Text>
      </View>
    );
  }

  // 🔹 Gestion des catégories
  const categoriesList = Array.isArray(club.categories)
    ? club.categories
    : typeof club.categories === "string"
    ? club.categories.split(",").map((c: string) => c.trim())
    : [];

  return (
    <ScrollView className="flex-1 bg-gray-900 p-4">
      <StatusBar barStyle="light-content" />
      {/* === DESCRIPTION === */}
      <View className="mb-6">
        <Text className="text-white font-semibold mb-2">Présentation</Text>
        {club.description ? (
          <Text className="text-gray-300 leading-6">{club.description}</Text>
        ) : (
          <Pressable
            onPress={() => {
              setFieldToEdit("description");
              setInputValue("");
              setModalVisible(true);
            }}
            className="bg-orange-600 py-2 px-4 rounded-lg mt-2 self-start"
          >
            <Text className="text-white font-semibold">+ Ajouter une description</Text>
          </Pressable>
        )}
      </View>

      {/* === CATÉGORIES === */}
      <View className="mb-6">
        <Text className="text-white font-semibold mb-2">Catégories</Text>
        {categoriesList.length > 0 ? (
          <View className="flex-row flex-wrap">
            {categoriesList.map((cat: string, index: number) => (
              <View
                key={index}
                className="px-3 py-1 mr-2 mb-2 bg-gray-800 rounded-full border border-gray-700"
              >
                <Text className="text-sm text-gray-300">{cat}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setFieldToEdit("categories");
              setInputValue("");
              setModalVisible(true);
            }}
            className="bg-orange-600 py-2 px-4 rounded-lg mt-2 self-start"
          >
            <Text className="text-white font-semibold">
              + Ajouter des catégories (ex : U15, U17, Seniors)
            </Text>
          </Pressable>
        )}
      </View>

      {/* === MODAL D'ÉDITION === */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-gray-900 p-6 rounded-xl w-full max-w-md border border-gray-700">
            <Text className="text-lg text-white font-semibold mb-3">
              {fieldToEdit === "description" && "Ajouter une description"}
              {fieldToEdit === "categories" && "Ajouter des catégories (séparées par des virgules)"}
            </Text>

            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Saisir ici..."
              placeholderTextColor="#999"
              className="bg-gray-800 text-white rounded-lg px-4 py-3 mb-4"
              multiline={fieldToEdit === "description"}
            />

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-2 bg-gray-700 rounded-lg"
              >
                <Text className="text-white">Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!inputValue || saving}
                onPress={() => {
                  let val: any = inputValue.trim();
                  if (fieldToEdit === "categories") {
                    val = val.split(",").map((v: string) => v.trim());
                  }
                  updateClubField(fieldToEdit!, val);
                }}
                className="px-4 py-2 bg-orange-600 rounded-lg"
              >
                <Text className="text-white font-semibold">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
