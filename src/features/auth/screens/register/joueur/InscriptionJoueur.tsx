import React, { useState } from "react";
import {
  ImageBackground,
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../../types";
import KeyboardFormScrollView from "../../../../../shared/components/KeyboardFormScrollView";

// 👉 Firebase
import { auth, db } from "../../../../../config/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

type InscriptionJoueurNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "InscriptionJoueur"
>;

export default function InscriptionJoueur() {
  const navigation = useNavigation<InscriptionJoueurNavProp>();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  //  Vérifications basiques
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPassword = (pwd: string) => pwd.length >= 6;

  const handleRegister = async () => {
    if (!fullName.trim() || !age.trim() || !position.trim() || !email.trim() || !password) {
      Alert.alert("Erreur", "Merci de remplir tous les champs.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Erreur", "Adresse e-mail invalide.");
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Création utilisateur Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      // 2️⃣ Sauvegarde dans Firestore
      await setDoc(doc(db, "joueurs", user.uid), {
        fullName: fullName.trim(),
        age: parseInt(age, 10),
        position: position.trim(),
        email: email.trim(),
        createdAt: new Date(),
      });

      Alert.alert("Succès", "Compte créé avec succès");

      // 3️⃣ Redirection → MainTabs
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (error: any) {
      console.error("Erreur inscription:", error);

      let message = "Impossible de créer le compte.";
      if (error.code === "auth/email-already-in-use") {
        message = "Cet email est déjà utilisé.";
      } else if (error.code === "auth/invalid-email") {
        message = "Adresse e-mail invalide.";
      } else if (error.code === "auth/weak-password") {
        message = "Mot de passe trop faible (min 6 caractères).";
      }

      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/background.jpg")}
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.6 }}
      resizeMode="cover"
    >
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" translucent />

        <KeyboardFormScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
            <View className="bg-white/90 rounded-2xl p-6 space-y-4">
              <Text className="text-2xl font-bold text-center mb-2">
                Inscription Joueur
              </Text>

              {/* Nom complet */}
              <TextInput
                placeholder="Nom complet"
                value={fullName}
                onChangeText={setFullName}
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              />

              {/* Âge */}
              <TextInput
                placeholder="Âge"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              />

              {/* Poste préféré */}
              <TextInput
                placeholder="Poste préféré"
                value={position}
                onChangeText={setPosition}
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              />

              {/* Email */}
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              />

              {/* Mot de passe */}
              <TextInput
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              />

              {/* Bouton validation */}
              <Pressable
                className={`py-4 rounded-2xl items-center ${loading ? "bg-gray-400" : "bg-orange-500"}`}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text className="text-white font-bold">
                  {loading ? "Création en cours…" : "Valider"}
                </Text>
              </Pressable>

              {/* Retour */}
              <Pressable
                className="mt-4 items-center"
                onPress={() => navigation.goBack()}
              >
                <Text className="text-blue-600">Retour</Text>
              </Pressable>
            </View>
        </KeyboardFormScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}
