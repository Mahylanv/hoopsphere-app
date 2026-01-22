// src/Inscription/Joueurs/InscriptionJoueurStep1.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../../types";
import { Feather, Ionicons } from "@expo/vector-icons";

type NavProps = NativeStackNavigationProp<
  RootStackParamList,
  "InscriptionJoueurStep1"
>;

export default function InscriptionJoueurStep1() {
  const navigation = useNavigation<NavProps>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // -------- VALIDATION --------
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  const isValidPassword = hasMinLength && hasUppercase && hasNumber;

  // -------- CONTINUE --------
  const handleContinue = async () => {
    setSubmitted(true);

    if (!isValidEmail(email) || !isValidPassword) return;

    setLoading(true);
    navigation.navigate("InscriptionJoueurStep2", { email, password });
    setLoading(false);
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
        <SafeAreaView className="flex-1 px-6">
          {/* ---------- HEADER ---------- */}
          <View className="flex-row items-center mt-6 mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3 p-2"
            >
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>

            <Text className="text-white text-xl font-semibold">
              Inscription joueur
            </Text>
          </View>

          {/* ---------- PAGE CENTRÉE ---------- */}
          <View className="flex-1 justify-center">
            <Text className="text-white text-3xl font-bold text-center mb-3">
              Crée ton profil joueur
            </Text>
            <Text className="text-gray-300 text-center mb-8">
              Étape 1 — Identifiants du compte
            </Text>
        {/* ---------- EMAIL ---------- */}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor="#ccc"
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-gray-500 bg-[#151515] rounded-xl h-14 px-4 text-white text-lg"
        />

        {submitted && !isValidEmail(email) && (
          <Text className="text-red-500 text-sm mt-1">
            Format d'email invalide
          </Text>
        )}

        {/* ---------- PASSWORD ---------- */}
        <View className="relative mt-5">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor="#ccc"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            className="border border-gray-500 bg-[#151515] rounded-xl h-14 px-4 pr-10 text-white text-lg"
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-4"
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#ccc"
            />
          </TouchableOpacity>
        </View>

        {/* ---------- PASSWORD CHECKS ---------- */}
        {(password.length > 0 || submitted) && (
          <View className="mt-4 space-y-1">
            <ValidationLine valid={hasMinLength} label="8 caractères minimum" />
            <ValidationLine valid={hasUppercase} label="1 lettre majuscule" />
            <ValidationLine valid={hasNumber} label="1 chiffre" />
          </View>
        )}

        {/* ---------- BOUTON CONTINUER ---------- */}
        <Pressable
          onPress={handleContinue}
          disabled={loading}
          className={`py-4 rounded-2xl items-center mt-6 ${
            !isValidEmail(email) || !isValidPassword
              ? "bg-gray-600 opacity-60"
              : "bg-orange-500"
          }`}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? "Chargement..." : "Continuer"}
          </Text>
        </Pressable>

        {/* ---------- LIEN CONNEXION ---------- */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Connexion")}
          className="mt-4 self-center"
        >
          <Text className="text-gray-300">
            Déjà un compte ?{" "}
            <Text className="text-orange-500 font-semibold">Se connecter</Text>
          </Text>
        </TouchableOpacity>

        {/* ---------- STEP INDICATOR (PLUS PETIT + CENTRÉ) ---------- */}
        <View className="flex-row items-center justify-center mt-6">
          <View className="w-2 h-2 rounded-full bg-orange-500" />
          <View className="w-6 h-[2px] bg-gray-600 mx-1" />
          <View className="w-2 h-2 rounded-full bg-gray-600" />
          <View className="w-6 h-[2px] bg-gray-600 mx-1" />
          <View className="w-2 h-2 rounded-full bg-gray-600" />
        </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

/* ---------------------------------------------------------
   🔧 Composant Ligne de Validation Live
--------------------------------------------------------- */
function ValidationLine({ valid, label }: { valid: boolean; label: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons
        name={valid ? "checkmark-circle" : "close-circle"}
        size={18}
        color={valid ? "#22c55e" : "#ef4444"}
      />
      <Text
        className={`ml-2 text-sm ${valid ? "text-green-400" : "text-red-400"}`}
      >
        {label}
      </Text>
    </View>
  );
}
