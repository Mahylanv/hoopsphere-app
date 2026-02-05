// src/Profil/Clubs/EditOffer.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../types";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../../config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

type EditOfferScreenRouteProp = RouteProp<RootStackParamList, "EditOffer">;
type NavProp = NativeStackNavigationProp<RootStackParamList, "EditOffer">;

export default function EditOffer() {
  const route = useRoute<EditOfferScreenRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { offer } = route.params;

  const [title, setTitle] = useState(offer.title);
  const [description, setDescription] = useState(offer.description);
  const [positions, setPositions] = useState<string[]>(offer.position || []);
  const [gender, setGender] = useState<"Homme" | "Femme" | "Mixte">(
    offer.gender
  );
  const [team, setTeam] = useState(offer.team);
  const [ageRange, setAgeRange] = useState(offer.ageRange);
  const [category, setCategory] = useState(offer.category);
  const [location, setLocation] = useState(offer.location);
  const [saving, setSaving] = useState(false);

  const POSTES = ["Meneur", "Arrière", "Ailier", "Ailier fort", "Pivot"];
  const GENRES: ("Homme" | "Femme" | "Mixte")[] = ["Homme", "Femme", "Mixte"];

  const togglePoste = (poste: string) => {
    setPositions((prev) =>
      prev.includes(poste) ? prev.filter((p) => p !== poste) : [...prev, poste]
    );
  };

  const [showPosteSelect, setShowPosteSelect] = useState(false);
  const [showGenreSelect, setShowGenreSelect] = useState(false);

  const handleUpdateOffer = async () => {
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid || !offer.id) return;

      const ref = doc(db, "clubs", uid, "offres", offer.id);
      await updateDoc(ref, {
        title,
        description,
        position: positions,
        team,
        gender,
        ageRange,
        category,
        location,
      });

      Alert.alert("Succès", "L’offre a bien été mise à jour.");
      navigation.goBack();
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      Alert.alert("Erreur", "Impossible de modifier l’offre.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <StatusBar barStyle="light-content" />

      {/* 🔹 Header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full bg-gray-800"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">
          Modifier l’offre
        </Text>
        <View style={{ width: 40 }} /> {/* équilibre visuel */}
      </View>

      {/* 🔹 Formulaire */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Champ Titre */}
        <View className="mb-4">
          <Text className="text-gray-400 mb-2 text-[15px]">Titre</Text>
          <TextInput
            placeholder="Ex: Recrutement U18"
            placeholderTextColor="#6b7280"
            value={title}
            onChangeText={setTitle}
            className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 border border-gray-700 focus:border-orange-500"
          />
        </View>

        {/* Ligne Poste + Genre */}
        <View className="flex-row gap-3 mb-4">
          {/* Postes */}
          <View className="flex-1">
            <Text className="text-gray-400 mb-2 text-[15px]">Postes</Text>
            <TouchableOpacity
              onPress={() => setShowPosteSelect(true)}
              className="bg-[#0e1320] border border-gray-700 rounded-2xl px-4 py-3"
            >
              <Text className="text-white text-[15px]" numberOfLines={1}>
                {positions.length > 0 ? positions.join(", ") : "Choisir"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Genres */}
          <View className="flex-1">
            <Text className="text-gray-400 mb-2 text-[15px]">Genres</Text>
            <TouchableOpacity
              onPress={() => setShowGenreSelect(true)}
              className="bg-[#0e1320] border border-gray-700 rounded-2xl px-4 py-3"
            >
              <Text className="text-white text-[15px]">{gender}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-gray-400 mb-2 text-[15px]">Description</Text>
          <TextInput
            placeholder="Décris ton offre ici..."
            placeholderTextColor="#6b7280"
            value={description}
            onChangeText={setDescription}
            className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 border border-gray-700 focus:border-orange-500 min-h-[110px]"
            multiline
          />
        </View>

        {/* Équipe + Tranche d’âge */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-gray-400 mb-2 text-[15px]">Équipe</Text>
            <TextInput
              placeholder="Ex: U18"
              placeholderTextColor="#6b7280"
              value={team}
              onChangeText={setTeam}
              className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 border border-gray-700 focus:border-orange-500"
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
              className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 border border-gray-700 focus:border-orange-500"
            />
          </View>
        </View>

        {/* Catégorie + Lieu */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <Text className="text-gray-400 mb-2 text-[15px]">Catégorie</Text>
            <TextInput
              placeholder="Ex: Régional 2"
              placeholderTextColor="#6b7280"
              value={category}
              onChangeText={setCategory}
              className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 border border-gray-700 focus:border-orange-500"
            />
          </View>

          <View className="flex-1">
            <Text className="text-gray-400 mb-2 text-[15px]">Lieu</Text>
            <TextInput
              placeholder="Ex: Bastia"
              placeholderTextColor="#6b7280"
              value={location}
              onChangeText={setLocation}
              className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 border border-gray-700 focus:border-orange-500"
            />
          </View>
        </View>

        {/* Bouton de sauvegarde */}
        <TouchableOpacity
          disabled={saving}
          onPress={handleUpdateOffer}
          className="bg-orange-600 py-3 rounded-2xl items-center active:bg-orange-700"
        >
          <Text className="text-white font-semibold text-[16px]">
            {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
          </Text>
        </TouchableOpacity>
        {/* ===== MODAL POSTES ===== */}
        {showPosteSelect && (
          <Modal visible transparent animationType="fade">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowPosteSelect(false)}
              className="flex-1 bg-black/60 justify-center px-6"
            >
              <View className="bg-[#1b1f2a] rounded-3xl p-6">
                <Text className="text-white text-xl font-bold mb-4">Postes</Text>
                <Text className="text-gray-400 text-sm mb-4">
                  Tu peux selectionner plusieurs postes.
                </Text>

                {POSTES.map((poste) => {
                  const selected = positions.includes(poste);
                  return (
                    <TouchableOpacity
                      key={poste}
                      onPress={() => togglePoste(poste)}
                      className={`py-3 px-4 rounded-xl mb-2 ${
                        selected ? "bg-orange-600" : "bg-[#0e1320]"
                      }`}
                    >
                      <Text className="text-white">{poste}</Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  disabled={positions.length === 0}
                  onPress={() => setShowPosteSelect(false)}
                  className={`mt-4 py-3 rounded-xl items-center ${
                    positions.length > 0 ? "bg-orange-600" : "bg-gray-700"
                  }`}
                >
                  <Text className="text-white font-semibold">Valider</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* ===== MODAL GENRES ===== */}
        {showGenreSelect && (
          <Modal visible transparent animationType="fade">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowGenreSelect(false)}
              className="flex-1 bg-black/60 justify-center px-6"
            >
              <View className="bg-[#1b1f2a] rounded-3xl p-6">
                <Text className="text-white text-xl font-bold mb-4">Genres</Text>

                {GENRES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      setGender(g);
                      setShowGenreSelect(false);
                    }}
                    className={`py-3 px-4 rounded-xl mb-2 ${
                      gender === g ? "bg-orange-600" : "bg-[#0e1320]"
                    }`}
                  >
                    <Text className="text-white">{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
