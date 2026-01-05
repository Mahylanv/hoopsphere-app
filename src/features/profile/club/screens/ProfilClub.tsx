// src/Profil/Clubs/ProfilClub.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  View,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { RootStackParamList } from "../../../../types";
import ClubPresentation from "./ClubPresentation";
import ClubTeamsList from "./ClubTeamsList";
import ClubOffers from "./ClubOffers";

// Firebase
import { auth, db } from "../../../../config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

type ClubProfileNavProp = NativeStackNavigationProp<RootStackParamList, "ProfilClub">;
type ClubProfileRouteProp = RouteProp<RootStackParamList, "ProfilClub">;

const Tab = createMaterialTopTabNavigator();

export default function ProfilClub() {
  const navigation = useNavigation<ClubProfileNavProp>();
  const { params } = useRoute<ClubProfileRouteProp>();

  // club passé depuis Search (peut être undefined)
  const clubFromRoute = params?.club as any | undefined;

  const [club, setClub] = useState<any>(clubFromRoute ?? null);
  const [loading, setLoading] = useState(!clubFromRoute); // si on a déjà le club, pas besoin de loader initial
  const [uploading, setUploading] = useState(false);

  // Si aucun club passé par la route, on tente de charger le club du user connecté
  useEffect(() => {
    if (clubFromRoute) return; // déjà fourni
    const fetchClub = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, "clubs", uid));
        if (snap.exists()) setClub({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Erreur lors du chargement du club :", err);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchClub();
  }, [clubFromRoute]);

  const isOwner = useMemo(() => {
    const uid = auth.currentUser?.uid;
    // en BDD tu as souvent un champ `uid` sur le doc club
    return uid && club && (club.uid === uid || club.id === uid);
  }, [club]);

  const formatDepartment = (dep: any) => {
    if (!dep || typeof dep !== "string") return "";
    if (!dep.includes(" - ")) return dep;
    return dep.split(" - ")[1];
  };
  
  // Mise à jour du logo (réservé au propriétaire du club)
  const handleChangeLogo = async () => {
    if (!isOwner) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission refusée", "L'accès à la galerie est requis.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;

      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const imageUri = result.assets[0].uri;
      setUploading(true);

      const storage = getStorage();
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `clubs/${uid}/logo.jpg`);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "clubs", uid), { logo: downloadUrl });
      setClub((prev: any) => ({ ...prev, logo: downloadUrl }));

      Alert.alert("Succès ✅", "Logo mis à jour avec succès !");
    } catch (err) {
      console.error("Erreur upload logo :", err);
      Alert.alert("Erreur", "Impossible de mettre à jour le logo.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-white mt-3">Chargement du profil...</Text>
      </View>
    );
  }

  if (!club) {
    return (
      <View className="flex-1 justify-center items-center bg-black px-6">
        <Text className="text-white text-lg font-semibold mb-4 text-center">
          Aucun profil club trouvé
        </Text>
  
        <Pressable
          onPress={() => navigation.navigate("Home")}
          className="bg-orange-500 px-6 py-3 rounded-xl mt-2"
        >
          <Text className="text-white font-bold text-base">
            Retour à l'accueil
          </Text>
        </Pressable>
      </View>
    );
  }
  

  // Normalisation pour l’affichage (ton schéma a parfois nom/ville vs name/city)
  const safeClub = {
    id: club.id ?? "",
    uid: club.id ?? "",
    name: club.nom || club.name || "Nom du club",
    logo:
      club.logo ||
      "https://via.placeholder.com/150x150.png?text=Club",
    city: club.ville || club.city || "Ville inconnue",
    teams: club.teams ?? club.equipes ?? "", // string possible en BDD
    categories: Array.isArray(club.categories) ? club.categories : [],
    department: String(club.department ?? ""),
    email: club.email || "",
    description: club.description || "",
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="items-center px-4 py-6 border-b border-gray-700 relative">
        <Pressable
          onPress={() => navigation.goBack()}
          className="absolute left-4 top-6 p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>

        {/* Bouton édition profil (navigation vers page d’édition) — tu peux le cacher si !isOwner */}
        {isOwner && (
          <Pressable
            onPress={() => navigation.navigate("EditClubProfile")}
            className="absolute right-4 top-6 p-2"
          >
            <Ionicons name="create-outline" size={22} color="#fff" />
          </Pressable>
        )}

        <View className="relative">
          <Image
            source={{ uri: safeClub.logo }}
            className="w-24 h-24 rounded-full mb-2 border-2 border-gray-700"
          />
          {/* ✏️ Edition logo — visible seulement pour le propriétaire */}
          {isOwner && (
            <Pressable
              onPress={handleChangeLogo}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-orange-500 w-8 h-8 rounded-full items-center justify-center border-2 border-gray-900"
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </Pressable>
          )}
        </View>

        <Text className="text-xl font-bold text-white mt-2">
          {safeClub.name}
        </Text>
        <Text className="text-sm text-gray-400">
          {safeClub.city} {safeClub.department ? `• ${formatDepartment(safeClub.department)}` : ""}
        </Text>
      </View>

      {/* TABS */}
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: "#1f2937" },
          tabBarIndicatorStyle: { backgroundColor: "#F97316", height: 3 },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
          tabBarLabelStyle: { fontWeight: "bold", textTransform: "none" },
        }}
      >
        <Tab.Screen
          name="Présentation"
          component={ClubPresentation}
          initialParams={{ club: safeClub }}
        />
        <Tab.Screen
          name="Équipes"
          component={ClubTeamsList}
          initialParams={{ club: safeClub }}
        />
        <Tab.Screen
          name="Offres"
          component={ClubOffers}
          initialParams={{ club: safeClub }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
