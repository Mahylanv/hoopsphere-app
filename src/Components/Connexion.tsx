// src/Components/Connexion.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../types";
import clsx from "clsx";

import { auth, db } from "../config/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ConnexionNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Connexion"
>;

export default function Connexion() {
  const navigation = useNavigation<ConnexionNavProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      console.log("Email tapé:", email);
      console.log("Email normalisé:", email.trim().toLowerCase());
      const cleanEmail = email.trim().toLowerCase();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );
      const uid = userCredential.user.uid;

      const joueurDoc = await getDoc(doc(db, "joueurs", uid));
      if (joueurDoc.exists()) {
        await AsyncStorage.setItem("userType", "joueur");
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
        return;
      }

      // 🔎 Vérifie dans "clubs"
      const clubDoc = await getDoc(doc(db, "clubs", uid));
      if (clubDoc.exists()) {
        await AsyncStorage.setItem("userType", "club");
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabsClub" }],
        });
        return;
      }

      // ⚠️ Si ni joueur ni club trouvé
      setError("Compte introuvable dans la base de données.");
    } catch (err: any) {
      console.error("Erreur connexion:", err.code, err.message);

      if (err.code === "auth/invalid-email") {
        setError("Adresse email invalide.");
      } else if (err.code === "auth/user-not-found") {
        setError("Aucun utilisateur trouvé avec cet email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Mot de passe incorrect.");
      } else {
        setError("Échec de la connexion. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D] px-6 justify-center">
      <StatusBar barStyle="light-content" />
      <View className="space-y-6">
        <Text className="text-white text-3xl font-bold text-center mb-4">
          Connexion
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocusedInput("email")}
          onBlur={() => setFocusedInput(null)}
          className={clsx(
            "border-2 rounded-lg h-14 px-4 text-white text-base mb-5",
            focusedInput === "email" ? "border-orange-500" : "border-white"
          )}
        />

        <View className="flex-row items-center px-4 mb-5 bg-[#1A1A1A] rounded-lg h-14">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            onFocus={() => setFocusedInput("password")}
            onBlur={() => setFocusedInput(null)}
            underlineColorAndroid="transparent" // ✅ SUPPRIME le border Android
            selectionColor="#F97316" // (optionnel) couleur du curseur
            className="flex-1 text-white text-base"
          />

          <Pressable onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={22}
              color="#fff"
            />
          </Pressable>
        </View>

        {/* ⚡ Message d'erreur */}
        {error && (
          <Text className="text-red-500 text-center mb-2">{error}</Text>
        )}

        <Pressable
          onPress={handleLogin}
          disabled={!email || !password || loading}
          className={clsx(
            "py-4 rounded-2xl items-center",
            !email || !password || loading
              ? "bg-gray-600 opacity-60"
              : "bg-orange-500"
          )}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Se connecter</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("ForgotPassword")}
          className="items-center -mt-2 mb-4"
        >
          <Text
            className="mt-8 underline font-semibold"
            style={{ color: "#F97316" }}
          >
            Mot de passe oublié ?
          </Text>
        </Pressable>

        {/* ⚡ Message d'erreur */}
        <Pressable className="items-center mt-2" onPress={() => navigation.goBack()}>
          <Text className="text-white underline">Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
