import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../../../../types";
import AddressAutocomplete from "../../../../../shared/components/AddressAutocomplete";

// Firebase
import { db } from "../../../../../config/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Component
import DepartmentSelect from "../../../../../shared/components/DepartmentSelect";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../../context/AuthContext";

type NavProps = NativeStackNavigationProp<
  RootStackParamList,
  "InscriptionClubStep2"
>;
type RouteProps = RouteProp<RootStackParamList, "InscriptionClubStep2">;

export default function InscriptionClubStep2() {
  const navigation = useNavigation<NavProps>();
  const { params } = useRoute<RouteProps>();
  const { setUserType } = useAuth();

  const uid = params.uid;
  const emailFromAuth = params.email;

  const [clubName, setClubName] = useState("");
  const [department, setDepartment] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [selection, setSelection] = useState<
    "masculines" | "feminines" | "les deux" | null
  >(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isValid =
    Boolean(clubName && city && selection && uid) && department.length > 0;

  // --- SAVE ---
  const saveClub = async () => {
    if (!uid) {
      setErr("Session expirée. Merci de recommencer l’inscription.");
      return;
    }
    if (!isValid || saving) return;

    setSaving(true);
    setErr(null);

    try {
      await setDoc(
        doc(db, "clubs", uid),
        {
          uid,
          email: emailFromAuth,
          name: clubName.trim(),
          department: department[0],
          city: city.trim(),
          teams: selection,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      try {
        await AsyncStorage.setItem("userType", "club");
        setUserType("club");
      } catch {}

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "MainTabsClub",
            params: {
              screen: "ProfilClub",
              params: { uid },
            },
          },
        ],
      });
      
    } catch (e) {
      console.error(e);
      setErr("Impossible d'enregistrer les infos du club. Réessaie.");
      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer les infos du club. Réessaie."
      );
    } finally {
      setSaving(false);
    }
  };

  // --- TOGGLE DE SÉLECTION / DESELECTION ---
  const toggleSelection = (opt: "masculines" | "feminines" | "les deux") => {
    if (selection === opt) {
      setSelection(null); // → déselection si on reclique
    } else {
      setSelection(opt);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent />
      <ImageBackground
        source={require("../../../../../../assets/club.jpg")}
        resizeMode="cover"
        className="flex-1"
        imageStyle={{ opacity: 0.6 }}
      >
        <View className="absolute inset-0 bg-black/55" />
        <SafeAreaView className="flex-1 px-6">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
            >

          {/* ---------- HEADER ---------- */}
          <View className="flex-row items-center mt-6 mb-4">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl ml-4">Informations du club</Text>
          </View>

          <View className="flex-1 justify-center w-full max-w-md self-center">
          {/* ---------- TITRE ---------- */}
          <View className="mb-8 mt-4">
            <Text className="text-white text-3xl font-bold text-center">
              Configure ton club
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Étape 2 — Informations générales du club
            </Text>
          </View>

          {/* ---------- FORMULAIRE ---------- */}

            {/* Nom du club */}
            <TextInput
              placeholder="Nom du club"
              placeholderTextColor="#ccc"
              value={clubName}
              onChangeText={setClubName}
              className="border border-gray-600 rounded-xl px-4 h-14 text-white bg-[#111] mb-6"
            />

            {/* Département */}
            <View className="mb-6">
              <DepartmentSelect
                value={department}
                onSelect={setDepartment}
                placeholder="Sélectionner un département"
                single
              />
            </View>

            {/* Ville */}
            <AddressAutocomplete
              value={city}
              placeholder="Ville / adresse du club"
              onSelect={(addr) => setCity(addr.label)}
            />

            {/* ---------- ÉQUIPES CONCERNÉES ---------- */}
            <Text className="text-white mb-3 text-center">
              Équipes concernées
            </Text>

            <View className="flex-row justify-between mb-8">
              {(["masculines", "feminines", "les deux"] as const).map((opt) => {
                const selected = selection === opt;

                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleSelection(opt)}
                    className={`flex-1 mx-1 px-3 py-3 rounded-lg border ${
                      selected
                        ? "border-orange-500 bg-orange-500/20"
                        : "border-gray-600"
                    }`}
                  >
                    <Text
                      className={`text-center text-sm ${
                        selected
                          ? "text-orange-400 font-semibold"
                          : "text-white"
                      }`}
                    >
                      {opt === "masculines"
                        ? "Masculines"
                        : opt === "feminines"
                        ? "Féminines"
                        : "Les deux"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {err && (
              <Text className="text-red-400 mb-4 text-center">{err}</Text>
            )}

            {/* ---------- BOUTON ---------- */}
            <Pressable
              disabled={!isValid || saving}
              onPress={saveClub}
              className={`py-4 rounded-xl items-center ${
                isValid ? "bg-orange-500" : "bg-gray-600 opacity-40"
              }`}
            >
              <Text className="text-white font-bold text-lg">
                {saving ? "Enregistrement..." : "Continuer"}
              </Text>
            </Pressable>

            {/* ---------- STEPPER ---------- */}
            <View className="flex-row justify-center items-center mt-6 mb-6">
              <View className="w-2 h-2 rounded-full bg-gray-600" />
              <View className="w-6 h-[2px] bg-gray-600 mx-1" />
              <View className="w-2 h-2 rounded-full bg-orange-500" />
            </View>

          </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
