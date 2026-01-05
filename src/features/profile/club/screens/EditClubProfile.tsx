// src/Profil/Clubs/EditClubProfile.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../../../config/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import DepartmentSelect from "../../../../shared/components/DepartmentSelect";

export default function EditClubProfile() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [department, setDepartment] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const loadClub = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const snap = await getDoc(doc(db, "clubs", uid));
        if (!snap.exists()) {
          Alert.alert("Erreur", "Impossible de charger le club.");
          return;
        }

        const data = snap.data();

        setName(data.nom || data.name || "");
        setCity(data.ville || data.city || "");
        setDepartment(data.department || "");
        setDescription(data.description || "");
        setCategories(data.categories || []);
      } catch (err) {
        console.error(err);
        Alert.alert("Erreur", "Impossible de charger les informations.");
      } finally {
        setLoading(false);
      }
    };

    loadClub();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await updateDoc(doc(db, "clubs", uid), {
        name,
        city,
        department,
        description,
        categories,
      });

      Alert.alert("Succès 🎉", "Informations mises à jour !");
      navigation.navigate("ProfilClub" as never);
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible d’enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Supprimer le compte",
      "Es-tu sûr de vouloir supprimer définitivement ton compte ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const uid = auth.currentUser?.uid;
              if (!uid) return;

              // 1️⃣ Supprimer le doc Firestore
              await deleteDoc(doc(db, "clubs", uid));

              // 2️⃣ Supprimer l’utilisateur Firebase Auth
              await auth.currentUser?.delete();

              Alert.alert("Compte supprimé", "Ton compte a été supprimé.");

              // 3️⃣ Redirection vers l'écran Home du stack principal
              navigation.navigate("Home" as never);
            } catch (err: any) {
              console.log("Erreur suppression compte :", err);

              if (err.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Reconnexion requise",
                  "Pour des raisons de sécurité, reconnecte-toi avant de supprimer ton compte."
                );
              } else {
                Alert.alert("Erreur", "Impossible de supprimer ton compte.");
              }
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0E0D0D]">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-white mt-3">Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      {/* HEADER */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-800 bg-[#0E1117] shadow-md">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-3">
          Modifier les informations
        </Text>
      </View>

      {/* ⭐ MAGIC FIX: KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <BlurView intensity={40} tint="dark" className="rounded-3xl p-5 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">
              Informations générales
            </Text>

            {/* Nom */}
            <View className="mb-5">
              <Text className="text-gray-400 mb-1">Nom du club</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: AS Bastia"
                placeholderTextColor="#6b7280"
                className="bg-[#0F141E] text-white rounded-xl px-4 py-3 border border-gray-700"
              />
            </View>

            {/* Ville */}
            <View className="mb-5">
              <Text className="text-gray-400 mb-1">Ville</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Ex: Bastia"
                placeholderTextColor="#6b7280"
                className="bg-[#0F141E] text-white rounded-xl px-4 py-3 border border-gray-700"
              />
            </View>

            {/* Département */}
            <View className="mb-5">
              <Text className="text-gray-400 mb-1">Département</Text>
              <DepartmentSelect
                value={department}
                onSelect={(dep) => setDepartment(dep)}
                placeholder="Sélectionner un département"
              />
            </View>

            {/* Description */}
            <View className="mb-2">
              <Text className="text-gray-400 mb-1">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Décris ton club..."
                placeholderTextColor="#6b7280"
                className="bg-[#0F141E] text-white rounded-xl px-4 py-3 border border-gray-700 min-h-[120px]"
                multiline
              />
            </View>

            {/* Catégories */}
            <View className="mb-5">
              <Text className="text-gray-400 mb-2">Catégories</Text>

              {/* Liste des catégories */}
              <View className="flex-row flex-wrap">
                {categories.map((cat, index) => (
                  <View
                    key={index}
                    className="bg-orange-600/20 border border-orange-600 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2"
                  >
                    <Text className="text-orange-400 mr-2">{cat}</Text>

                    <TouchableOpacity
                      onPress={() =>
                        setCategories((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Ionicons name="close-circle" size={18} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Ajout nouvelle catégorie */}
              <View className="flex-row items-center mt-3">
                <TextInput
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Ajouter une catégorie (ex: U11)"
                  placeholderTextColor="#6b7280"
                  className="flex-1 bg-[#0F141E] text-white rounded-xl px-4 py-3 border border-gray-700 mr-3"
                />

                <TouchableOpacity
                  onPress={() => {
                    const clean = newCategory.trim();

                    if (clean.length === 0) return;

                    // 🛑 Vérifie doublon (insensible à la casse)
                    const exists = categories.some(
                      (cat) => cat.toLowerCase() === clean.toLowerCase()
                    );

                    if (exists) {
                      Alert.alert(
                        "Catégorie existante",
                        `La catégorie "${clean}" existe déjà.`
                      );
                      return;
                    }

                    // ✔ Ajout si OK
                    setCategories((prev) => [...prev, clean]);
                    setNewCategory("");
                  }}
                  className="bg-orange-600 p-3 rounded-xl"
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>

          {/* Bouton sauvegarde */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-orange-600 py-3 rounded-2xl items-center shadow-lg active:bg-orange-700"
          >
            <Text className="text-white font-bold text-lg">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Text>
          </TouchableOpacity>

          {/* Bouton SUPPRIMER */}
          <TouchableOpacity
            onPress={handleDelete}
            className="mt-4 bg-red-700 py-3 rounded-2xl items-center shadow-lg active:bg-red-800"
          >
            <Text className="text-white font-bold text-lg">
              Supprimer le compte
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
