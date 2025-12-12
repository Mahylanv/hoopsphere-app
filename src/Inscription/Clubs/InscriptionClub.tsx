import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { TextInput as RNTextInput } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebaseConfig";

type NavProp = NativeStackNavigationProp<RootStackParamList, "InscriptionClub">;

export default function InscriptionClub() {
  const navigation = useNavigation<NavProp>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const passwordRef = useRef<RNTextInput>(null);

  // VALIDATION
  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const isValidPassword = (v: string) =>
    v.length >= 8 && /[A-Z]/.test(v) && /\d/.test(v);

  const formValid = isValidEmail(email) && isValidPassword(password);

  // CONTINUE
  const handleContinue = async () => {
    setSubmitted(true);

    if (!formValid || loading) return;

    try {
      setErr(null);
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      navigation.navigate("InscriptionClubStep2", {
        uid: cred.user.uid,
        email: cred.user.email ?? email.trim().toLowerCase(),
      });
    } catch (e: any) {
      const code = e?.code || "";
      if (code === "auth/email-already-in-use")
        setErr("Cet e-mail est déjà utilisé.");
      else if (code === "auth/invalid-email") setErr("E-mail invalide.");
      else if (code === "auth/weak-password")
        setErr("Mot de passe trop faible.");
      else setErr("Erreur. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0E0D0D" }}>
      <StatusBar barStyle="light-content" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          className="flex-1 px-6"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* HEADER */}
          <View className="flex-row items-center mt-6 mb-4">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-xl ml-4">Inscription club</Text>
          </View>

          {/* CONTENU */}
          <View className="flex-1 justify-center items-center">
            <Text className="text-white text-3xl font-bold text-center mb-4">
              Crée ton espace club
            </Text>

            <Text className="text-gray-400 text-center mb-8">
              Étape 1 — Identifiants du compte
            </Text>

            {/* FORMULAIRE */}
            <View className="w-full max-w-md">
              {/* Email */}
              <TextInput
                placeholder="E-mail"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="border border-gray-600 rounded-xl h-14 px-4 text-white text-lg bg-[#111]"
              />
              {submitted && !isValidEmail(email) && (
                <Text className="text-red-500 text-sm mt-1">
                  Email invalide
                </Text>
              )}

              {/* Mot de passe */}
              <View className="relative mt-6">
                <TextInput
                  ref={passwordRef}
                  placeholder="Mot de passe"
                  placeholderTextColor="#ccc"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="border border-gray-600 rounded-xl h-14 px-4 pr-10 text-white text-lg bg-[#111]"
                />

                <TouchableOpacity
                  onPress={() => {
                    setShowPassword(!showPassword);
                    setTimeout(() => passwordRef.current?.focus(), 60);
                  }}
                  className="absolute right-4 top-4"
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#ccc"
                  />
                </TouchableOpacity>
              </View>

              {/* Validation live */}
              {password.length > 0 && (
                <View className="mt-2">
                  <Text
                    className={`text-sm ${
                      password.length >= 8 ? "text-green-400" : "text-red-500"
                    }`}
                  >
                    • 8 caractères minimum
                  </Text>

                  <Text
                    className={`text-sm ${
                      /[A-Z]/.test(password) ? "text-green-400" : "text-red-500"
                    }`}
                  >
                    • 1 majuscule
                  </Text>

                  <Text
                    className={`text-sm ${
                      /\d/.test(password) ? "text-green-400" : "text-red-500"
                    }`}
                  >
                    • 1 chiffre
                  </Text>
                </View>
              )}

              {/* Erreur Firebase */}
              {err && <Text className="text-red-400 text-sm mt-2">{err}</Text>}
            </View>

            {/* BOUTON */}
            <Pressable
              disabled={!formValid}
              onPress={handleContinue}
              className={`w-full max-w-md py-4 rounded-2xl items-center mt-10 ${
                formValid ? "bg-orange-500" : "bg-gray-600 opacity-60"
              }`}
            >
              <Text className="text-white font-bold text-lg">Continuer</Text>
            </Pressable>

            {/* LIEN CONNEXION */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Connexion")}
              className="mt-6"
            >
              <Text className="text-gray-300">
                Déjà un compte ?{" "}
                <Text className="text-orange-400 font-semibold">
                  Se connecter
                </Text>
              </Text>
            </TouchableOpacity>

            {/* STEPPER */}
            <View className="flex-row justify-center items-center mt-8 mb-6">
              <View className="w-2 h-2 rounded-full bg-orange-500" />
              <View className="w-6 h-[2px] bg-gray-600 mx-1" />
              <View className="w-2 h-2 rounded-full bg-gray-600" />
              <View className="w-6 h-[2px] bg-gray-600 mx-1" />
              <View className="w-2 h-2 rounded-full bg-gray-600" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
