// src/screens/auth/InscriptionJoueurStep3.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../types";
import { Feather } from "@expo/vector-icons";
import clsx from "clsx";

import { auth, db } from "../../config/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// 👉 Données statiques (clubs + options)
import paris from "../../../assets/paris.png";
import monaco from "../../../assets/monaco.png";
import csp from "../../../assets/csp.png";

const CLUBS = [
  { name: "Paris Basket - U18 Féminin (Régional 3)", logo: paris },
  { name: "Monaco - U20 Masculin (National 2)", logo: monaco },
  { name: "CSP Limoges - Seniors (Élite)", logo: csp },
];

const tailles = Array.from({ length: 71 }, (_, i) => `${150 + i} cm`);
const poidsOptions = Array.from({ length: 101 }, (_, i) => `${40 + i} kg`);
const postes = ["Meneur", "Arrière", "Ailier", "Ailier fort", "Pivot"];
const DEPARTEMENTS = [
  "75 - Paris",
  "92 - Hauts-de-Seine",
  "93 - Seine-Saint-Denis",
  "94 - Val-de-Marne",
  "95 - Val-d'Oise",
];

type Nav3Prop = NativeStackNavigationProp<
  RootStackParamList,
  "InscriptionJoueurStep3"
>;

export default function InscriptionJoueurStep3() {
  const navigation = useNavigation<Nav3Prop>();
  const route = useRoute<any>();

  // ✅ Données Step1 & Step2
  const { email, password, nom, prenom, dob, genre } = route.params || {};

  if (!email || !password) {
    console.error("❌ Données Step1/Step2 manquantes dans Step3");
    Alert.alert("Erreur", "Informations d'inscription manquantes.");
    navigation.goBack();
    return null;
  }

  // ✅ States locaux
  const [taille, setTaille] = useState("");
  const [poids, setPoids] = useState("");
  const [main, setMain] = useState("");
  const [poste, setPoste] = useState("");
  const [departement, setDepartement] = useState("");
  const [club, setClub] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showDepartementModal, setShowDepartementModal] = useState(false);
  const [searchDepartement, setSearchDepartement] = useState("");
  const [showClubModal, setShowClubModal] = useState(false);
  const [searchClub, setSearchClub] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    taille && poids && main && poste && departement && club ? true : false;

  // ✅ Création compte + enregistrement Firestore
  const handleRegister = async () => {
    if (!isValid) {
      Alert.alert("Champs requis", "Merci de remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      console.log("👉 Création user Firebase...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("✅ User créé:", user.uid);

      console.log("👉 Écriture Firestore...");
      await setDoc(doc(db, "joueurs", user.uid), {
        email,
        nom,
        prenom,
        dob,
        genre,
        taille,
        poids,
        main,
        poste,
        departement,
        club,
        createdAt: new Date().toISOString(),
      });
      console.log("✅ Firestore OK");

      Alert.alert("Succès", "Compte joueur créé avec succès ✅");

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (error: any) {
      console.error("❌ Erreur Step3:", error);

      let message = "Impossible de créer le compte.";
      if (error.code === "auth/email-already-in-use") {
        message = "Cet email est déjà utilisé.";
      } else if (error.code === "auth/invalid-email") {
        message = "Adresse email invalide.";
      } else if (error.code === "auth/weak-password") {
        message = "Mot de passe trop faible.";
      } else if (error.code === "permission-denied") {
        message = "Permissions Firestore insuffisantes (vérifie tes règles).";
      }
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Modales génériques
  const renderModal = (
    title: string,
    options: string[],
    onSelect: (val: string) => void,
    showSearch?: boolean,
    searchValue?: string,
    setSearchValue?: (val: string) => void
  ) => (
    <Modal visible transparent animationType="slide">
      <View className="flex-1 justify-center bg-black/70">
        <View className="bg-zinc-900 mx-5 rounded-xl p-4">
          <Text className="text-white text-lg font-bold mb-3">{title}</Text>
          {showSearch && setSearchValue && (
            <TextInput
              placeholder="Rechercher..."
              placeholderTextColor="#999"
              value={searchValue}
              onChangeText={setSearchValue}
              className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-3"
            />
          )}
          <ScrollView className="max-h-80">
            {options
              .filter((val) =>
                !showSearch || !searchValue
                  ? true
                  : val.toLowerCase().includes(searchValue.toLowerCase())
              )
              .map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    onSelect(val);
                    if (setSearchValue) setSearchValue("");
                    setFocusedInput(null);
                    setShowDepartementModal(false);
                    setShowClubModal(false);
                  }}
                  className="py-3"
                >
                  <Text className="text-white">{val}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => {
              if (setSearchValue) setSearchValue("");
              setFocusedInput(null);
              setShowDepartementModal(false);
              setShowClubModal(false);
            }}
            className="mt-4 bg-gray-700 rounded-lg py-3 items-center"
          >
            <Text className="text-white">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderClubModal = () => (
    <Modal visible transparent animationType="slide">
      <View className="flex-1 justify-center bg-black/70">
        <View className="bg-zinc-900 mx-5 rounded-xl p-4">
          <Text className="text-white text-lg font-bold mb-3">
            Sélectionne ton club
          </Text>
          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor="#999"
            value={searchClub}
            onChangeText={setSearchClub}
            className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-3"
          />
          <ScrollView className="max-h-80">
            {CLUBS.filter((c) =>
              c.name.toLowerCase().includes(searchClub.toLowerCase())
            ).map((clubItem) => (
              <TouchableOpacity
                key={clubItem.name}
                onPress={() => {
                  setClub(clubItem.name);
                  setSearchClub("");
                  setShowClubModal(false);
                }}
                className="flex-row items-center py-2"
              >
                <Image
                  source={clubItem.logo}
                  className="w-8 h-8 rounded-full mr-3"
                />
                <Text className="text-white text-base">{clubItem.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => {
              setSearchClub("");
              setShowClubModal(false);
            }}
            className="mt-4 bg-gray-700 rounded-lg py-3 items-center"
          >
            <Text className="text-white">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 mt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          className="flex-row items-center space-x-3"
        >
          <Image
            source={require("../../../assets/arrow-left.png")}
            className="w-9 h-9"
          />
          <Text className="text-white text-xl ml-3">Inscription joueur</Text>
        </Pressable>
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <Text className="text-white">Plus tard</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View className="items-center my-8">
        <View className="relative w-28 h-28 rounded-full bg-zinc-600 items-center justify-center">
          <Feather name="user" size={56} color="#aaa" />
          <View className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full">
            <Feather name="edit-2" size={16} color="white" />
          </View>
        </View>
      </View>

      {/* Formulaire */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        className="px-6 pt-10"
      >
        {/* Taille */}
        <TouchableOpacity
          onPress={() => setFocusedInput("taille")}
          className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white"
        >
          <Text
            className={clsx("text-base", taille ? "text-white" : "text-gray-400")}
          >
            {taille || "Sélectionne ta taille"}
          </Text>
        </TouchableOpacity>

        {/* Poids */}
        <TouchableOpacity
          onPress={() => setFocusedInput("poids")}
          className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white"
        >
          <Text
            className={clsx("text-base", poids ? "text-white" : "text-gray-400")}
          >
            {poids || "Sélectionne ton poids"}
          </Text>
        </TouchableOpacity>

        {/* Main forte */}
        <Text className="text-white text-base mb-2">Main forte</Text>
        <View className="flex-row justify-between mb-5">
          {["Gauche", "Droite"].map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setMain(opt)}
              className={clsx(
                "rounded-lg py-3 px-5 flex-1",
                main === opt
                  ? "border-2 border-orange-500"
                  : "border-2 border-white",
                opt === "Gauche" ? "mr-2" : ""
              )}
            >
              <Text className="text-white text-center text-base">{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Poste */}
        <TouchableOpacity
          onPress={() => setFocusedInput("poste")}
          className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white"
        >
          <Text
            className={clsx("text-base", poste ? "text-white" : "text-gray-400")}
          >
            {poste || "Sélectionne ton poste"}
          </Text>
        </TouchableOpacity>

        {/* Département */}
        <TouchableOpacity
          onPress={() => setShowDepartementModal(true)}
          className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white"
        >
          <Text
            className={clsx(
              "text-base",
              departement ? "text-white" : "text-gray-400"
            )}
          >
            {departement || "Sélectionne ton département"}
          </Text>
        </TouchableOpacity>

        {/* Club */}
        <TouchableOpacity
          onPress={() => setShowClubModal(true)}
          className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white"
        >
          <Text
            className={clsx("text-base", club ? "text-white" : "text-gray-400")}
          >
            {club || "Sélectionne ton club"}
          </Text>
        </TouchableOpacity>

        {/* Bouton final */}
        <Pressable
          disabled={!isValid || loading}
          onPress={handleRegister}
          className={clsx(
            "py-4 rounded-2xl items-center",
            isValid ? "bg-orange-500" : "bg-gray-600 opacity-60"
          )}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? "Création..." : "Continuer"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modales */}
      {focusedInput === "taille" &&
        renderModal("Sélectionne ta taille", tailles, setTaille)}
      {focusedInput === "poids" &&
        renderModal("Sélectionne ton poids", poidsOptions, setPoids)}
      {focusedInput === "poste" &&
        renderModal("Sélectionne ton poste", postes, setPoste)}
      {showDepartementModal &&
        renderModal(
          "Sélectionne ton département",
          DEPARTEMENTS,
          setDepartement,
          true,
          searchDepartement,
          setSearchDepartement
        )}
      {showClubModal && renderClubModal()}
    </SafeAreaView>
  );
}
