// src/Inscription/Joueurs/InscriptionJoueurStep2.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../../../../types";

type Route2Prop = RouteProp<RootStackParamList, "InscriptionJoueurStep2">;
type Nav2Prop = NativeStackNavigationProp<
  RootStackParamList,
  "InscriptionJoueurStep2"
>;

export default function InscriptionJoueurStep2() {
  const { params } = useRoute<Route2Prop>();
  const navigation = useNavigation<Nav2Prop>();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");

  const [dobDate, setDobDate] = useState(new Date(2005, 0, 1));
  const [dob, setDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [genre, setGenre] = useState("");

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const isValid = Boolean(nom && prenom && dob && genre);

  const formatDate = (date: Date) =>
    `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;

  const handleContinue = () => {
    if (!isValid) return;
    navigation.navigate("InscriptionJoueurStep3", {
      email: params.email,
      password: params.password,
      nom,
      prenom,
      dob,
      genre,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0E0D0D" }}>
      <StatusBar barStyle="light-content" />

      {/* ---------- HEADER ---------- */}
      <View className="flex-row items-center px-6 mt-6">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-xl ml-4">Inscription joueur</Text>
      </View>

      {/* ---------- CONTENT SCROLL ---------- */}
      <ScrollView
        contentContainerStyle={{
          justifyContent: "center",
          flexGrow: 1,
          paddingHorizontal: 24,
        }}
      >
        {/* ---------- GENRE ---------- */}
        <View className="mb-6">
          <Text className="text-gray-300 mb-2">Genre</Text>

          <View className="flex-row justify-between">
            {[
              { label: "Homme", value: "Équipe masculine" },
              { label: "Femme", value: "Équipe féminine" },
            ].map((opt) => {
              const selected = genre === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setGenre(opt.value)}
                  className={`px-4 py-3 rounded-lg border w-[48%]
                    ${selected ? "border-orange-500 bg-orange-500/20" : "border-gray-600"}
                  `}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-base ${
                        selected ? "text-orange-400" : "text-gray-300"
                      }`}
                    >
                      {opt.label}
                    </Text>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#f97316"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ---------- NOM ---------- */}
        <TextInput
          value={nom}
          onChangeText={setNom}
          placeholder="Nom"
          placeholderTextColor="#999"
          onFocus={() => setFocusedInput("nom")}
          onBlur={() => setFocusedInput(null)}
          className="rounded-lg h-14 px-4 text-white text-lg mb-4"
          style={{
            borderWidth: 2,
            borderColor: focusedInput === "nom" ? "#F97316" : "#9CA3AF",
            backgroundColor: "#111",
          }}
        />

        {/* ---------- PRENOM ---------- */}
        <TextInput
          value={prenom}
          onChangeText={setPrenom}
          placeholder="Prénom"
          placeholderTextColor="#999"
          onFocus={() => setFocusedInput("prenom")}
          onBlur={() => setFocusedInput(null)}
          className="rounded-lg h-14 px-4 text-white text-lg mb-4"
          style={{
            borderWidth: 2,
            borderColor: focusedInput === "prenom" ? "#F97316" : "#9CA3AF",
            backgroundColor: "#111",
          }}
        />

        {/* ---------- DATE DE NAISSANCE ---------- */}
        {Platform.OS === "web" ? (
          /* --- WEB : simple champ texte --- */
          <TextInput
            value={dob}
            onChangeText={setDob}
            placeholder="Date de naissance (JJ/MM/AAAA)"
            placeholderTextColor="#999"
            className="h-14 rounded-lg px-4 text-white text-lg mb-6"
            style={{
              borderWidth: 2,
              borderColor: "#9CA3AF",
              backgroundColor: "#111",
            }}
          />
        ) : (
          /* --- MOBILE : bouton ouvrant le DatePicker --- */
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="h-14 rounded-lg px-4 justify-center mb-6"
            style={{
              borderWidth: 2,
              borderColor: "#9CA3AF",
              backgroundColor: "#111",
            }}
          >
            <Text className={`text-lg ${dob ? "text-white" : "text-gray-500"}`}>
              {dob || "Date de naissance (JJ/MM/AAAA)"}
            </Text>
          </TouchableOpacity>
        )}

        {/* ---------- DATE PICKER MODAL (iOS / Android seulement) ---------- */}
        {showDatePicker && Platform.OS !== "web" && (
          <Modal transparent animationType="fade">
            <View className="flex-1 justify-center items-center bg-black/60">
              <View className="bg-[#1E1E1E] rounded-xl p-6 w-[85%]">
                <DateTimePicker
                  value={dobDate}
                  mode="date"
                  maximumDate={new Date()}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setDobDate(selectedDate);
                      setDob(formatDate(selectedDate));
                    }
                    if (Platform.OS !== "ios") setShowDatePicker(false);
                  }}
                />

                {/* Bouton Valider (nécessaire pour iOS) */}
                <TouchableOpacity
                  className="bg-orange-500 rounded-xl py-3 mt-4"
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text className="text-center text-white font-bold">
                    Valider
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* ---------- CONTINUE BTN ---------- */}
        <Pressable
          onPress={handleContinue}
          disabled={!isValid}
          className={`py-4 rounded-2xl items-center mb-5 ${
            isValid ? "bg-orange-500" : "bg-gray-600 opacity-50"
          }`}
        >
          <Text className="text-white font-bold text-lg">Continuer</Text>
        </Pressable>

        {/* ---------- STEP INDICATOR ---------- */}
        <View className="flex-row items-center justify-center">
          <View className="w-2 h-2 rounded-full bg-gray-600" />
          <View className="w-6 h-[2px] bg-gray-600 mx-1" />
          <View className="w-2 h-2 rounded-full bg-orange-500" />
          <View className="w-6 h-[2px] bg-gray-600 mx-1" />
          <View className="w-2 h-2 rounded-full bg-gray-600" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
