// src/screens/Profil.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import clsx from "clsx";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

import {
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  deleteUserAccount,
} from "../services/userService";
import { DEPARTEMENTS } from "../constants/departements";

// === Images statiques ===
import paris from "../../assets/paris.png";
import monaco from "../../assets/monaco.png";
import csp from "../../assets/csp.png";

const CLUBS = [
  { name: "Paris Basket - U18 Féminin (Régional 3)", logo: paris },
  { name: "Monaco - U20 Masculin (National 2)", logo: monaco },
  { name: "CSP Limoges - Seniors (Élite)", logo: csp },
];

const tailles = Array.from({ length: 71 }, (_, i) => `${150 + i} cm`);
const poidsOptions = Array.from({ length: 101 }, (_, i) => `${40 + i} kg`);
const postes = ["Meneur", "Arrière", "Ailier", "Ailier fort", "Pivot"];

export default function Profil() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [userData, setUserData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // Champs utilisateur
  const [birthYear, setBirthYear] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [position, setPosition] = useState("");
  const [strongHand, setStrongHand] = useState("");
  const [departement, setDepartement] = useState("");
  const [club, setClub] = useState("");

  // Modales & UI
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showDepartementModal, setShowDepartementModal] = useState(false);
  const [searchDepartement, setSearchDepartement] = useState("");
  const [showClubModal, setShowClubModal] = useState(false);
  const [searchClub, setSearchClub] = useState("");

  // === Charger les données utilisateur ===
  useEffect(() => {
    const fetchData = async () => {
      const data = await getUserProfile();
      if (data) {
        setUserData(data);
        setBirthYear(data.dob || "");
        setHeight(data.taille || "");
        setWeight(data.poids || "");
        setPosition(data.poste || "");
        setStrongHand(data.main || "");
        setDepartement(data.departement || "");
        setClub(data.club || "");
      }
    };
    fetchData();
  }, []);

  // === Modifier l'avatar ===
  const handleAvatarChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission refusée !");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const newUrl = await updateAvatar(imageUri);
        if (newUrl) {
          setUserData((prev: any) => ({ ...prev, avatar: newUrl }));
          alert("Photo de profil mise à jour ✅");
        }
      }
    } catch (error) {
      console.error("Erreur avatar :", error);
    }
  };

  // === Sauvegarder les infos ===
  const saveProfile = async () => {
    try {
      const updatedData = {
        dob: birthYear,
        taille: height,
        poids: weight,
        poste: position,
        main: strongHand,
        departement,
        club,
      };
      await updateUserProfile(updatedData);
      setUserData((prev: any) => ({ ...prev, ...updatedData }));
      setEditMode(false);
      alert("Profil mis à jour ✅");
    } catch (e) {
      console.error("Erreur mise à jour :", e);
    }
  };

  // === Galerie locale ===
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Autorisation refusée !");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  // === Suppression du compte ===
  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer mon compte",
      "Cette action est irréversible. Es-tu sûr de vouloir supprimer ton compte ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserAccount();
              alert("Compte supprimé avec succès 👋");
              navigation.navigate("Home");
            } catch (e) {
              alert("Erreur lors de la suppression du compte.");
              console.error(e);
            }
          },
        },
      ]
    );
  };

  // === Modales ===
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
                    setShowDepartementModal(false);
                    setShowClubModal(false);
                    setFocusedInput(null);
                  }}
                  className="py-3"
                >
                  <Text className="text-white">{val}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              setShowDepartementModal(false);
              setShowClubModal(false);
              setFocusedInput(null);
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
          <Text className="text-white text-lg font-bold mb-3">Sélectionne ton club</Text>
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
                <Image source={clubItem.logo} className="w-8 h-8 rounded-full mr-3" />
                <Text className="text-white text-base">{clubItem.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => setShowClubModal(false)}
            className="mt-4 bg-gray-700 rounded-lg py-3 items-center"
          >
            <Text className="text-white">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!userData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-black">
        <Text className="text-white">Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0E0D0D" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Avatar */}
        <View className="items-center mt-12">
          <View className="relative">
            <Image source={{ uri: userData.avatar }} className="w-32 h-32 rounded-full" />
            <TouchableOpacity
              onPress={handleAvatarChange}
              className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full z-50"
              style={{ elevation: 10 }}
            >
              <Feather name="edit-2" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="mt-4 text-xl font-semibold text-white">
            {userData.prenom} {userData.nom}
          </Text>
        </View>

        {/* BIO */}
        <View className="mt-8 px-6">
          <Text className="text-xl font-bold mb-4 text-white">Biographie</Text>

          {/* Ligne 1 */}
          <View className="flex-row justify-between mb-4 gap-x-4">
            <View className="w-1/2">
              <Text className="text-base text-gray-400">Année de naissance</Text>
              {editMode ? (
                <TextInput
                  value={birthYear}
                  onChangeText={setBirthYear}
                  keyboardType="numeric"
                  className="text-lg text-white border-b border-gray-500"
                />
              ) : (
                <Text className="text-lg text-white">{birthYear}</Text>
              )}
            </View>
            <View className="w-1/2">
              <Text className="text-base text-gray-400">Taille</Text>
              {editMode ? (
                <TouchableOpacity
                  onPress={() => setFocusedInput("taille")}
                  className="border-2 rounded-lg h-14 px-4 justify-center border-white"
                >
                  <Text className={clsx("text-base", height ? "text-white" : "text-gray-400")}>
                    {height || "Sélectionne ta taille"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-lg text-white">{height}</Text>
              )}
            </View>
          </View>

          {/* Ligne 2 */}
          <View className="flex-row justify-between mb-4 gap-x-4">
            <View className="w-1/2">
              <Text className="text-base text-gray-400">Poids</Text>
              {editMode ? (
                <TouchableOpacity
                  onPress={() => setFocusedInput("poids")}
                  className="border-2 rounded-lg h-14 px-4 justify-center border-white"
                >
                  <Text className={clsx("text-base", weight ? "text-white" : "text-gray-400")}>
                    {weight || "Sélectionne ton poids"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-lg text-white">{weight}</Text>
              )}
            </View>
            <View className="w-1/2">
              <Text className="text-base text-gray-400">Poste</Text>
              {editMode ? (
                <TouchableOpacity
                  onPress={() => setFocusedInput("poste")}
                  className="border-2 rounded-lg h-14 px-4 justify-center border-white"
                >
                  <Text className={clsx("text-base", position ? "text-white" : "text-gray-400")}>
                    {position || "Sélectionne ton poste"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-lg text-white">{position}</Text>
              )}
            </View>
          </View>

          {/* Ligne 3 */}
          <View className="flex-row justify-between mb-4 gap-x-4">
            <View className="w-1/2">
              <Text className="text-base text-gray-400">Main forte</Text>
              {editMode ? (
                <View className="flex-row justify-between">
                  {["Gauche", "Droite"].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setStrongHand(opt)}
                      className={clsx(
                        "rounded-lg py-3 px-5 flex-1",
                        strongHand === opt ? "border-2 border-orange-500" : "border-2 border-white",
                        opt === "Gauche" ? "mr-2" : ""
                      )}
                    >
                      <Text className="text-white text-center text-base">{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-lg text-white">{strongHand}</Text>
              )}
            </View>

            <View className="w-1/2">
              <Text className="text-base text-gray-400">Département</Text>
              {editMode ? (
                <TouchableOpacity
                  onPress={() => setShowDepartementModal(true)}
                  className="border-2 rounded-lg h-14 px-4 justify-center border-white"
                >
                  <Text className={clsx("text-base", departement ? "text-white" : "text-gray-400")}>
                    {departement || "Sélectionne ton département"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-lg text-white">{departement}</Text>
              )}
            </View>
          </View>

          {/* Ligne 4 */}
          <View className="mb-6">
            <Text className="text-base text-gray-400">Club</Text>
            {editMode ? (
              <TouchableOpacity
                onPress={() => setShowClubModal(true)}
                className="border-2 rounded-lg h-14 px-4 justify-center border-white"
              >
                <Text className={clsx("text-base", club ? "text-white" : "text-gray-400")}>
                  {club || "Sélectionne ton club"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-lg text-white">{club}</Text>
            )}
          </View>

          {/* Bouton enregistrer */}
          <View className="items-start">
            <TouchableOpacity
              onPress={() => (editMode ? saveProfile() : setEditMode(true))}
              className="py-3 px-6 rounded-lg mb-6"
              style={{ backgroundColor: "#2E4E9C" }}
            >
              <Text className="text-white text-base font-semibold">
                {editMode ? "Enregistrer" : "Complète ta bio"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GALERIE */}
        <View className="mt-4 px-6">
          <Text className="text-xl font-bold text-white mb-2">Galerie</Text>
          <Image
            source={require("../../assets/basketteur.jpg")}
            className="w-full h-48 rounded-xl mb-4"
            resizeMode="cover"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={pickImage}
                className="w-32 h-32 rounded-xl bg-gray-800 justify-center items-center"
              >
                <Text className="text-4xl text-white">+</Text>
              </TouchableOpacity>
              <Image
                source={require("../../assets/galerie3.png")}
                className="w-32 h-32 rounded-xl"
                resizeMode="cover"
              />
              <Image
                source={require("../../assets/galerie2.jpg")}
                className="w-32 h-32 rounded-xl"
                resizeMode="cover"
              />
              {images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  className="w-32 h-32 rounded-xl"
                  resizeMode="cover"
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Déconnexion */}
        <View className="items-center mt-10">
          <Animatable.View animation="pulse" iterationCount="infinite" duration={2000}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Home")}
              className="py-4 px-8 rounded-2xl bg-orange-500 shadow-md shadow-black"
            >
              <Text className="text-white text-lg font-bold">Déconnexion</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>

        {/* SUPPRESSION DU COMPTE */}
        <View className="items-center mt-6 mb-10">
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="py-3 px-6 rounded-lg bg-red-600"
          >
            <Text className="text-white text-base font-semibold">Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modales */}
      {focusedInput === "taille" && renderModal("Sélectionne ta taille", tailles, setHeight)}
      {focusedInput === "poids" && renderModal("Sélectionne ton poids", poidsOptions, setWeight)}
      {focusedInput === "poste" && renderModal("Sélectionne ton poste", postes, setPosition)}
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
