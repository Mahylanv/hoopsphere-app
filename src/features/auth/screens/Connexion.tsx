// src/Components/Connexion.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";

import { RootStackParamList } from "../../../types";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

import { auth, db } from "../../../config/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ConnexionNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Connexion"
>;

const backgroundImage = require("../../../../assets/connexion-basket.jpeg");

export default function Connexion() {
  const navigation = useNavigation<ConnexionNavProp>();
  const { setUserType } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    Asset.fromModule(backgroundImage).downloadAsync().catch(() => null);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
      if (!emailOk) {
        setEmailError("Adresse email invalide.");
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );
      const uid = userCredential.user.uid;

      const joueurDoc = await getDoc(doc(db, "joueurs", uid));
      if (joueurDoc.exists()) {
        await AsyncStorage.setItem("userType", "joueur");
        setUserType("joueur");
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
        return;
      }

      // Verify in clubs
      const clubDoc = await getDoc(doc(db, "clubs", uid));
      if (clubDoc.exists()) {
        await AsyncStorage.setItem("userType", "club");
        setUserType("club");
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabsClub" }],
        });
        return;
      }

      // Not found
      setError("Compte introuvable dans la base de donnees.");
    } catch (err: any) {
      if (err.code === "auth/invalid-email") {
        setEmailError("Adresse email invalide.");
      } else if (err.code === "auth/user-not-found") {
        setEmailError("Aucun utilisateur trouve avec cet email.");
      } else if (err.code === "auth/wrong-password") {
        setPasswordError("Mot de passe incorrect.");
      } else {
        setError("Echec de la connexion. Veuillez reessayer.");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" translucent />
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          className="flex-1"
          imageStyle={{ opacity: 0.6 }}
        >
          <View className="absolute inset-0 bg-black/55" />
          <View className="flex-1 px-6 justify-center space-y-6">
        <Text className="text-white text-3xl font-bold text-center mb-4">
          Connexion
        </Text>

        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (emailError) setEmailError(null);
          }}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocusedInput("email")}
          onBlur={() => setFocusedInput(null)}
          className={clsx(
            "border-2 rounded-lg h-14 px-4 text-white text-base",
            emailError
              ? "border-red-500 mb-2"
              : focusedInput === "email"
                ? "border-orange-500 mb-5"
                : "border-white mb-5"
          )}
        />
        {emailError && (
          <Text className="text-red-400 text-sm -mt-1 mb-4 text-center">
            {emailError}
          </Text>
        )}

        <View
          className={clsx(
            "flex-row items-center px-4 rounded-lg h-14 border-2",
            passwordError
              ? "border-red-500 bg-[#1A1A1A] mb-2"
              : "border-transparent bg-[#1A1A1A] mb-5"
          )}
        >
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (passwordError) setPasswordError(null);
            }}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            onFocus={() => setFocusedInput("password")}
            onBlur={() => setFocusedInput(null)}
            underlineColorAndroid="transparent"
            selectionColor="#F97316"
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
        {passwordError && (
          <Text className="text-red-400 text-sm -mt-1 mb-4 text-center">
            {passwordError}
          </Text>
        )}

        {/* ⚡ Message d'erreur */}
        {error && (
          <View className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-300 text-center">{error}</Text>
          </View>
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
          className="self-center mt-4 mb-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40"
        >
          <Text className="text-orange-200 font-semibold text-sm">
            Mot de passe oublié ?
          </Text>
        </Pressable>

        {/* ⚡ Message d'erreur */}
        <Pressable
          className="items-center mt-2 flex-row justify-center gap-2"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text className="text-white underline">Retour</Text>
        </Pressable>
          </View>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}
