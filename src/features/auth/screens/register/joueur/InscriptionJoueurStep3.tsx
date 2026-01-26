// src/Inscription/Joueurs/InscriptionJoueurStep3.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StatusBar,
  ScrollView,
  Platform,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
  Modal,
  ImageBackground,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../../types";
import { Ionicons, Feather } from "@expo/vector-icons";
import clsx from "clsx";
import * as ImagePicker from "expo-image-picker";

import DepartmentSelect from "../../../../../shared/components/DepartmentSelect";
import { registerPlayer } from "../../../services/authService";

import { auth } from "../../../../../config/firebaseConfig";

const tailles = Array.from({ length: 71 }, (_, i) => `${150 + i} cm`);
const poidsOptions = Array.from({ length: 101 }, (_, i) => `${40 + i} kg`);
const postes = ["Meneur", "Arrière", "Ailier", "Ailier fort", "Pivot"];

type Nav3Prop = NativeStackNavigationProp<
  RootStackParamList,
  "InscriptionJoueurStep3"
>;

export default function InscriptionJoueurStep3() {
  const navigation = useNavigation<Nav3Prop>();
  const route = useRoute<any>();

  // Récupération Step 1 & 2
  const { email, password, nom, prenom, dob, genre } = route.params || {};

  if (!email || !password) {
    Alert.alert("Erreur", "Informations d'inscription manquantes.");
    navigation.goBack();
    return null;
  }

  // -----------------------------
  // STATES
  // -----------------------------
  const [taille, setTaille] = useState("");
  const [poids, setPoids] = useState("");
  const [main, setMain] = useState("");
  const [poste, setPoste] = useState("");
  const [departement, setDepartement] = useState<string[]>([]);
  const [club, setClub] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid =
    taille && poids && main && poste && departement.length === 1;

  // -----------------------------
  // PICK AVATAR
  // -----------------------------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // -----------------------------
  // REGISTER
  // -----------------------------
  const handleRegister = async () => {
    if (!isValid) {
      Alert.alert("Champs requis", "Merci de remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      await registerPlayer({
        email,
        password,
        nom,
        prenom,
        dob,
        genre,
        taille: parseInt(taille),   // convertit "178 cm" → 178
        poids: parseInt(poids),
        main,
        poste,
        departement: departement[0], // 🔥 SINGLE VALUE
        club: club || null,
        avatar,
      });

      Alert.alert("Succès", "Compte joueur créé avec succès !");
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "MainTabs",
            params: {
              screen: "ProfilJoueur",   // ← l’onglet exact dans ton MainTabs joueur
              params: { uid: auth.currentUser?.uid },
            },
          },
        ],
      });
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de créer le compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent />
      <ImageBackground
        source={require("../../../../../../assets/player.jpeg")}
        resizeMode="cover"
        className="flex-1"
        imageStyle={{ opacity: 0.6 }}
      >
        <View className="absolute inset-0 bg-black/55" />
        <SafeAreaView className="flex-1">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            >
              {/* -------------------------------- HEADER -------------------------------- */}
              <View className="flex-row items-center px-6 mt-6">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-xl ml-4">Inscription joueur</Text>
              </View>

              <View className="px-6 mt-6">
                <Text className="text-white text-3xl font-bold text-center">
                  Finalise ton profil
                </Text>
                <Text className="text-gray-300 text-center mt-2">
                  Étape 3 — Informations sportives
                </Text>
              </View>

              {/* -------------------------------- AVATAR -------------------------------- */}
              <View className="items-center my-8">
                <Pressable onPress={pickImage} className="relative">
                  <View className="rounded-full bg-zinc-700 w-28 h-28 items-center justify-center overflow-hidden">
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        className="w-28 h-28 rounded-full"
                      />
                    ) : (
                      <Feather name="user" size={56} color="#aaa" />
                    )}
                  </View>

              <View className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full">
                <Feather name="plus" size={16} color="white" />
              </View>
                </Pressable>
              </View>

              {/* -------------------------------- FORM -------------------------------- */}
              <ScrollView
                className="px-6"
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
        {/* TAILLE */}
        <TouchableOpacity
          onPress={() => setFocusedInput("taille")}
          className="border-2 border-white rounded-lg h-14 px-4 justify-center mb-5"
        >
          <Text
            className={clsx(
              "text-base",
              taille ? "text-white" : "text-gray-400"
            )}
          >
            {taille || "Sélectionne ta taille"}
          </Text>
        </TouchableOpacity>

        {/* POIDS */}
        <TouchableOpacity
          onPress={() => setFocusedInput("poids")}
          className="border-2 border-white rounded-lg h-14 px-4 justify-center mb-5"
        >
          <Text
            className={clsx(
              "text-base",
              poids ? "text-white" : "text-gray-400"
            )}
          >
            {poids || "Sélectionne ton poids"}
          </Text>
        </TouchableOpacity>

        {/* MAIN FORTE */}
        <Text className="text-white text-base mb-2">Main forte</Text>
        <View className="flex-row justify-between mb-6">
          {["Gauche", "Droite", "Ambidextre"].map((opt, index) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setMain(opt)}
              className={clsx(
                "rounded-lg py-2 px-2 flex-1",
                main === opt
                  ? "border-2 border-orange-500"
                  : "border-2 border-white",
                index !== 2 ? "mr-2" : "" // marge seulement entre les 3 boutons
              )}
            >
              <Text className="text-white text-center text-base">{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* POSTE */}
        <TouchableOpacity
          onPress={() => setFocusedInput("poste")}
          className="border-2 border-white rounded-lg h-14 px-4 justify-center mb-5"
        >
          <Text
            className={clsx(
              "text-base",
              poste ? "text-white" : "text-gray-400"
            )}
          >
            {poste || "Sélectionne ton poste"}
          </Text>
        </TouchableOpacity>

        {/* DÉPARTEMENT */}
        <DepartmentSelect
          single
          value={departement}
          placeholder="Sélectionne ton département"
          onSelect={(values) => setDepartement(values)}
        />

        {/* CLUB (INPUT MANUEL) */}
        <TextInput
          value={club}
          onChangeText={setClub}
          placeholder="Nom de ton club"
          placeholderTextColor="#999"
          className="rounded-lg h-14 px-4 py-0 text-white text-lg mt-5 bg-[#111] border-2 border-gray-600"
          style={{ textAlignVertical: "center", paddingVertical: 0 }}
        />

        {/* BOUTON FINAL */}
        <Pressable
          disabled={!isValid || loading}
          onPress={handleRegister}
          className={clsx(
            "py-4 rounded-2xl items-center mt-8",
            isValid ? "bg-orange-500" : "bg-gray-600 opacity-60"
          )}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? "Création..." : "Créer mon compte"}
          </Text>
        </Pressable>
        {/* STEP INDICATOR */}
        <View className="flex-row justify-center items-center mt-5">
          <View className="w-2 h-2 rounded-full bg-gray-600" />
          <View className="w-6 h-[2px] bg-gray-600 mx-1" />
          <View className="w-2 h-2 rounded-full bg-gray-600" />
          <View className="w-6 h-[2px] bg-gray-600 mx-1" />
          <View className="w-2 h-2 rounded-full bg-orange-500" />
        </View>
          </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>

      {/* -------------------------------- MODALES -------------------------------- */}
      {focusedInput === "taille" &&
        renderPickerModal(
          "Sélectionne ta taille",
          tailles,
          setTaille,
          setFocusedInput
        )}

      {focusedInput === "poids" &&
        renderPickerModal(
          "Sélectionne ton poids",
          poidsOptions,
          setPoids,
          setFocusedInput
        )}

      {focusedInput === "poste" &&
        renderPickerModal(
          "Sélectionne ton poste",
          postes,
          setPoste,
          setFocusedInput
        )}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

/* --------------------------- MODALE SIMPLE (TAILLE / POIDS / POSTE) --------------------------- */
function renderPickerModal(
  title: string,
  list: string[],
  onSelect: (v: string) => void,
  close: (arg: any) => void
) {
  return (
    <Modal transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/70">
        <View className="bg-zinc-900 rounded-xl w-[80%] max-h-[70%] p-5">
          <Text className="text-white text-lg font-bold mb-4">{title}</Text>
          <ScrollView className="mb-4">
            {list.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  onSelect(item);
                  close(null);
                }}
                className="py-3 border-b border-gray-700"
              >
                <Text className="text-white">{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => close(null)}
            className="bg-gray-700 py-3 rounded-xl mt-2"
          >
            <Text className="text-center text-white">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
