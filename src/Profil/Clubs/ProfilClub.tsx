import React, { useEffect, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { auth, db } from "../../config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";

import ClubPresentation from "./ClubPresentation";
import ClubTeams from "./ClubTeams";
import ClubOffers from "./ClubOffers";

type ClubProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "ProfilClub"
>;

const Tab = createMaterialTopTabNavigator();

export default function ProfilClub() {
  const navigation = useNavigation<ClubProfileNavProp>();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 🔹 Charger les infos du club connecté
  useEffect(() => {
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
    fetchClub();
  }, []);

  // 🔹 Gestion du changement de logo
  const handleChangeLogo = async () => {
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
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white text-lg font-semibold">
          Aucun profil club trouvé
        </Text>
      </View>
    );
  }

  const safeClub = {
    name: club.nom || club.name || "Nom du club",
    logo: club.logo || "https://via.placeholder.com/150x150.png?text=Club",
    city: club.ville || club.city || "Ville inconnue",
    teams: club.teams ?? club.equipes ?? 0,
    categories: club.categories ?? [],
    department : club.department ?? [],
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="items-center px-4 py-6 border-b border-gray-700 relative">
        <Pressable
          onPress={() => navigation.goBack()}
          className="absolute left-4 top-6 p-2"
        >
          <Text className="text-white text-lg">←</Text>
        </Pressable>

        <View className="relative">
          <Image
            source={{ uri: safeClub.logo }}
            className="w-24 h-24 rounded-full mb-2 border-2 border-gray-700"
          />
          {/* ✏️ Bulle d'édition */}
          <Pressable
            onPress={handleChangeLogo}
            disabled={uploading}
            className="absolute bottom-0 right-0 bg-orange-500 w-8 h-8 rounded-full items-center justify-center border-2 border-gray-900"
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="pencil" size={16} color="#fff" />
            )}
          </Pressable>
        </View>

        <Text className="text-xl font-bold text-white mt-2">{safeClub.name}</Text>
        <Text className="text-sm text-gray-400">
          {safeClub.city} • {safeClub.department}
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
          component={ClubTeams}
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
