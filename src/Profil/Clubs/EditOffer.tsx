import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

type EditOfferScreenRouteProp = RouteProp<RootStackParamList, "EditOffer">;
type NavProp = NativeStackNavigationProp<RootStackParamList, "EditOffer">;

export default function EditOffer() {
  const route = useRoute<EditOfferScreenRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { offer } = route.params;

  const [title, setTitle] = useState(offer.title);
  const [description, setDescription] = useState(offer.description);
  const [position, setPosition] = useState(offer.position);
  const [team, setTeam] = useState(offer.team);
  const [gender, setGender] = useState(offer.gender);
  const [ageRange, setAgeRange] = useState(offer.ageRange);
  const [category, setCategory] = useState(offer.category);
  const [location, setLocation] = useState(offer.location);
  const [saving, setSaving] = useState(false);

  const handleUpdateOffer = async () => {
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid || !offer.id) return;

      const ref = doc(db, "clubs", uid, "offres", offer.id);
      await updateDoc(ref, {
        title,
        description,
        position,
        team,
        gender,
        ageRange,
        category,
        location,
      });

      Alert.alert("✅ Succès", "L’offre a bien été mise à jour.");
      navigation.goBack();
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      Alert.alert("❌ Erreur", "Impossible de modifier l’offre.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
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
          {/* Poste */}
          <View className="flex-1">
            <Text className="text-gray-400 mb-2 text-[15px]">
              Poste recherché
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert("Choisir un poste", "", [
                  { text: "Meneur", onPress: () => setPosition("Meneur") },
                  { text: "Arrière", onPress: () => setPosition("Arrière") },
                  { text: "Ailier", onPress: () => setPosition("Ailier") },
                  {
                    text: "Ailier fort",
                    onPress: () => setPosition("Ailier fort"),
                  },
                  { text: "Pivot", onPress: () => setPosition("Pivot") },
                  { text: "Annuler", style: "cancel" },
                ])
              }
              className="bg-[#0e1320] border border-gray-700 rounded-2xl px-4 py-3 flex-row justify-between items-center"
            >
              <Text className="text-white text-[15px]">
                {position || "Sélectionner"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#F97316" />
            </TouchableOpacity>
          </View>

          {/* Genre */}
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
              <Ionicons name="chevron-down" size={18} color="#F97316" />
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
      </ScrollView>
    </SafeAreaView>
  );
}
