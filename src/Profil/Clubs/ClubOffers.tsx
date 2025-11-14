// src/Profil/Clubs/ClubOffers.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StatusBar,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { auth, db } from "../../config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ProfilClub">;

type Offer = {
  id?: string;
  title: string;
  description: string;
  position: string;
  team: string;
  publishedAt: string;
  gender: "Homme" | "Femme" | "Mixte";
  ageRange: string;
  category: string;
  location: string;
};

export default function ClubOffers() {
  const navigation = useNavigation<NavProp>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Champs du formulaire d’ajout
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState("Meneur"); // ✅ valeur par défaut
  const [team, setTeam] = useState("");
  const [gender, setGender] = useState<"Homme" | "Femme" | "Mixte">("Mixte");
  const [ageRange, setAgeRange] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // 📡 Écoute temps réel de la collection "offres"
    const ref = collection(db, "clubs", uid, "offres");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Offer[];
      setOffers(data);
      setLoading(false);
    });

    // 🧹 Nettoyage de l'écoute quand le composant est démonté
    return () => unsubscribe();
  }, []);

  const addOffer = async () => {
    if (!title.trim() || !description.trim()) return;
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const ref = collection(db, "clubs", uid, "offres");

      const newOffer: Offer = {
        title,
        description,
        position,
        team,
        gender,
        ageRange,
        category,
        location,
        publishedAt: new Date().toISOString().split("T")[0],
      };

      const docRef = await addDoc(ref, newOffer);
      setOffers((prev) => [...prev, { ...newOffer, id: docRef.id }]);
      setModalVisible(false);
      setTitle("");
      setDescription("");
      setTeam("");
      setAgeRange("");
      setCategory("");
      setLocation("");
    } catch (err) {
      console.error("Erreur ajout offre :", err);
      Alert.alert("Erreur", "Impossible d’ajouter l’offre.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id?: string) => {
    if (!id) return;
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await deleteDoc(doc(db, "clubs", uid, "offres", id));
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Erreur suppression offre :", err);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-400 mt-3">Chargement des offres...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" />
      {/* Bouton ajouter */}
      <Pressable
        onPress={() => setModalVisible(true)}
        className="m-4 py-3 bg-orange-600 rounded-xl items-center"
      >
        <Text className="text-white font-semibold">+ Créer une offre</Text>
      </Pressable>

      {/* Liste des offres */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        data={offers}
        keyExtractor={(o) => o.id || Math.random().toString()}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-10 text-base">
            Aucune offre publiée pour le moment.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="mb-5">
            <Pressable
              onPress={() => navigation.navigate("EditOffer", { offer: item })}
              android_ripple={{ color: "#333" }}
              className="bg-[#1b1f2a] rounded-2xl p-5 border border-gray-800 shadow-sm"
            >
              {/* 🔹 En-tête : titre + date */}
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white font-bold text-lg flex-1">
                  {item.title}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {item.publishedAt}
                </Text>
              </View>

              {/* 🔹 Lieu */}
              {item.location ? (
                <View className="flex-row items-center mb-3">
                  <Ionicons name="location-outline" size={14} color="#9ca3af" />
                  <Text className="text-gray-400 text-sm ml-1">
                    {item.location}
                  </Text>
                </View>
              ) : null}

              {/* 🔹 Description */}
              <Text
                className="text-gray-300 text-[14px] mb-4"
                numberOfLines={3}
              >
                {item.description}
              </Text>

              {/* 🔹 Badges d’infos */}
              <View className="flex-row flex-wrap gap-2">
                {item.position ? (
                  <View className="bg-orange-600/80 px-3 py-1 rounded-full flex-row items-center">
                    <Ionicons name="person-outline" size={12} color="white" />
                    <Text className="text-white text-xs ml-1">
                      {item.position}
                    </Text>
                  </View>
                ) : null}

                {item.gender ? (
                  <View className="bg-purple-600/80 px-3 py-1 rounded-full flex-row items-center">
                    <Ionicons
                      name="male-female-outline"
                      size={12}
                      color="white"
                    />
                    <Text className="text-white text-xs ml-1">
                      {item.gender}
                    </Text>
                  </View>
                ) : null}

                {item.team ? (
                  <View className="bg-green-600/80 px-3 py-1 rounded-full flex-row items-center">
                    <Ionicons name="people-outline" size={12} color="white" />
                    <Text className="text-white text-xs ml-1">{item.team}</Text>
                  </View>
                ) : null}

                {item.category ? (
                  <View className="bg-blue-600/80 px-3 py-1 rounded-full flex-row items-center">
                    <Ionicons name="trophy-outline" size={12} color="white" />
                    <Text className="text-white text-xs ml-1">
                      {item.category}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* 🔹 Ligne séparatrice */}
              <View className="border-t border-gray-700 mt-4 mb-3" />

              {/* 🔹 Boutons d’action */}
              <View className="flex-row justify-end">
                <TouchableOpacity
                  onPress={() => deleteOffer(item.id)}
                  className="flex-row items-center gap-1 px-4 py-2 bg-red-600 rounded-xl active:bg-red-700"
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                  <Text className="text-white font-semibold text-sm">
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        )}
      />

      {/* 🧾 Modal ajout offre */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <BlurView
          intensity={45}
          tint="dark"
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 16,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center", // ✅ ajoute ceci
              width: "100%", // ✅ force le scrollView à occuper toute la largeur
            }}
            style={{ width: "100%" }} // ✅ ajoute aussi cette ligne
          >
            <View className="bg-[#1b1f2a] w-[90%] rounded-3xl p-6 border border-gray-800 shadow-2xl">
              <Text className="text-white text-2xl font-bold text-center mb-6">
                Nouvelle offre
              </Text>

              {/* 🔸 Ligne : Titre */}
              <View className="mb-4">
                <Text className="text-gray-400 mb-2 text-[15px]">Titre</Text>
                <TextInput
                  placeholder="Ex: Recrutement U18"
                  placeholderTextColor="#6b7280"
                  value={title}
                  onChangeText={setTitle}
                  className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 focus:border-orange-500"
                />
              </View>

              {/* 🔸 Ligne : Poste recherché + Genre */}
              <View className="flex-row gap-3 mb-4">
                {/* Sélecteur de poste */}
                <View className="flex-1">
                  <Text className="text-gray-400 mb-2 text-[15px]">
                    Poste recherché
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      Alert.alert("Choisir un poste", "", [
                        {
                          text: "Meneur",
                          onPress: () => setPosition("Meneur"),
                        },
                        {
                          text: "Arrière",
                          onPress: () => setPosition("Arrière"),
                        },
                        {
                          text: "Ailier",
                          onPress: () => setPosition("Ailier"),
                        },
                        {
                          text: "Ailier fort",
                          onPress: () => setPosition("Ailier fort"),
                        },
                        {
                          text: "Pivot",
                          onPress: () => setPosition("Pivot"),
                        },
                        { text: "Annuler", style: "cancel" },
                      ])
                    }
                    className="bg-[#0e1320] border border-gray-700 rounded-2xl px-4 py-3 flex-row justify-between items-center"
                  >
                    <Text className="text-white text-[15px]">
                      {position || "Sélectionner"}
                    </Text>
                    <Text className="text-orange-500 text-[16px]">▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Sélecteur de genre */}
                <View className="flex-1">
                  <Text className="text-gray-400 mb-2 text-[15px]">Genre</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      Alert.alert("Sélection du genre", "", [
                        { text: "Homme", onPress: () => setGender("Homme") },
                        { text: "Femme", onPress: () => setGender("Femme") },
                        { text: "Mixte", onPress: () => setGender("Mixte") },
                        { text: "Annuler", style: "cancel" },
                      ])
                    }
                    className="bg-[#0e1320] border border-gray-700 rounded-2xl px-4 py-3 flex-row justify-between items-center"
                  >
                    <Text className="text-white text-[15px]">
                      {gender || "Sélectionner"}
                    </Text>
                    <Text className="text-orange-500 text-[16px]">▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🔸 Description */}
              <View className="mb-4">
                <Text className="text-gray-400 mb-2 text-[15px]">
                  Description
                </Text>
                <TextInput
                  placeholder="Décris ton offre ici..."
                  placeholderTextColor="#6b7280"
                  value={description}
                  onChangeText={setDescription}
                  className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 focus:border-orange-500 min-h-[110px]"
                  multiline
                />
              </View>

              {/* 🔸 Équipe + Tranche d’âge */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-400 mb-2 text-[15px]">Équipe</Text>
                  <TextInput
                    placeholder="Ex: U18"
                    placeholderTextColor="#6b7280"
                    value={team}
                    onChangeText={setTeam}
                    className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 focus:border-orange-500"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-gray-400 mb-2 text-[15px]">
                    Tranche d’âge
                  </Text>
                  <TextInput
                    placeholder="Ex: 18–22 ans"
                    placeholderTextColor="#6b7280"
                    value={ageRange}
                    onChangeText={setAgeRange}
                    className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 focus:border-orange-500"
                  />
                </View>
              </View>

              {/* 🔸 Catégorie + Lieu */}
              <View className="flex-row gap-3 mb-6">
                <View className="flex-1">
                  <Text className="text-gray-400 mb-2 text-[15px]">
                    Catégorie
                  </Text>
                  <TextInput
                    placeholder="Ex: Régional 2"
                    placeholderTextColor="#6b7280"
                    value={category}
                    onChangeText={setCategory}
                    className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 focus:border-orange-500"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-gray-400 mb-2 text-[15px]">Lieu</Text>
                  <TextInput
                    placeholder="Ex: Bastia"
                    placeholderTextColor="#6b7280"
                    value={location}
                    onChangeText={setLocation}
                    className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 focus:border-orange-500"
                  />
                </View>
              </View>

              {/* 🔸 Boutons */}
              <View className="flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="px-5 py-2.5 bg-gray-700 rounded-xl active:bg-gray-600"
                >
                  <Text className="text-white text-[15px]">Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!title || saving}
                  onPress={addOffer}
                  className="px-5 py-2.5 bg-orange-600 rounded-xl active:bg-orange-700"
                >
                  <Text className="text-white font-semibold text-[15px]">
                    {saving ? "Création..." : "Créer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </BlurView>
      </Modal>
    </View>
  );
}
