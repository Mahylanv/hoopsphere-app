// src/Profil/Joueur/components/BioSection.tsx

import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import clsx from "clsx";

export type BioSectionProps = {
  editMode: boolean;

  // Année de naissance
  birthYear: string;
  setBirthYear: (v: string) => void;

  // Taille
  height: string;
  setHeight: (v: string) => void;
  onSelectHeight: () => void;

  // Poids
  weight: string;
  setWeight: (v: string) => void;
  onSelectWeight: () => void;

  // Poste
  position: string;
  setPosition: (v: string) => void;
  onSelectPoste: () => void;

  // Main forte
  strongHand: string;
  setStrongHand: (v: string) => void;

  // Département
  departement: string;
  onSelectDepartement: () => void;

  // Club
  club: string;
  onSelectClub: () => void;

  // Champs ajoutés
  phone: string;
  setPhone: (v: string) => void;

  level: string; // Niveau
  onSelectLevel: () => void;

  experience: string; // Années d'expérience
  setExperience: (v: string) => void;

  bio: string; // Description textuelle
  setBio: (v: string) => void;

    /** ➕ AJOUTER ICI */
  onSave: () => void;
};

export default function BioSection({
  editMode,
  birthYear,
  setBirthYear,
  height,
  setHeight,
  onSelectHeight,
  weight,
  setWeight,
  onSelectWeight,
  position,
  setPosition,
  onSelectPoste,
  strongHand,
  setStrongHand,
  departement,
  onSelectDepartement,
  club,
  onSelectClub,
  phone,
  setPhone,
  level,
  onSelectLevel,
  experience,
  setExperience,
  bio,
  setBio,
}: BioSectionProps) {
  return (
    <View className="mt-8 px-6">
      <Text className="text-xl font-bold mb-4 text-white">Biographie</Text>

      {/* Ligne 1 — Année + Taille */}
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
            <Text className="text-lg text-white">{birthYear || "-"}</Text>
          )}
        </View>

        <View className="w-1/2">
          <Text className="text-base text-gray-400">Taille</Text>
          {editMode ? (
            <TouchableOpacity
              onPress={onSelectHeight}
              className="border-2 rounded-lg h-14 px-4 justify-center border-white"
            >
              <Text className={clsx("text-base", height ? "text-white" : "text-gray-400")}>
                {height || "Sélectionne ta taille"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-lg text-white">{height || "-"}</Text>
          )}
        </View>
      </View>

      {/* Ligne 2 — Poids + Poste */}
      <View className="flex-row justify-between mb-4 gap-x-4">
        <View className="w-1/2">
          <Text className="text-base text-gray-400">Poids</Text>
          {editMode ? (
            <TouchableOpacity
              onPress={onSelectWeight}
              className="border-2 rounded-lg h-14 px-4 justify-center border-white"
            >
              <Text className={clsx("text-base", weight ? "text-white" : "text-gray-400")}>
                {weight || "Sélectionne ton poids"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-lg text-white">{weight || "-"}</Text>
          )}
        </View>

        <View className="w-1/2">
          <Text className="text-base text-gray-400">Poste</Text>
          {editMode ? (
            <TouchableOpacity
              onPress={onSelectPoste}
              className="border-2 rounded-lg h-14 px-4 justify-center border-white"
            >
              <Text className={clsx("text-base", position ? "text-white" : "text-gray-400")}>
                {position || "Sélectionne ton poste"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-lg text-white">{position || "-"}</Text>
          )}
        </View>
      </View>

      {/* Ligne 3 — Main forte + Département */}
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
            <Text className="text-lg text-white">{strongHand || "-"}</Text>
          )}
        </View>

        <View className="w-1/2">
          <Text className="text-base text-gray-400">Département</Text>
          {editMode ? (
            <TouchableOpacity
              onPress={onSelectDepartement}
              className="border-2 rounded-lg h-14 px-4 justify-center border-white"
            >
              <Text
                className={clsx("text-base", departement ? "text-white" : "text-gray-400")}
              >
                {departement || "Sélectionne ton département"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-lg text-white">{departement || "-"}</Text>
          )}
        </View>
      </View>

      {/* Ligne 4 — Club */}
      <View className="mb-4">
        <Text className="text-base text-gray-400">Club</Text>
        {editMode ? (
          <TouchableOpacity
            onPress={onSelectClub}
            className="border-2 rounded-lg h-14 px-4 justify-center border-white"
          >
            <Text className={clsx("text-base", club ? "text-white" : "text-gray-400")}>
              {club || "Sélectionne ton club"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-lg text-white">{club || "-"}</Text>
        )}
      </View>

      {/* Ligne 5 — Téléphone + Niveau */}
      <View className="flex-row justify-between mb-4 gap-x-4">
        <View className="w-1/2">
          <Text className="text-base text-gray-400">Téléphone</Text>
          {editMode ? (
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="text-lg text-white border-b border-gray-500"
            />
          ) : (
            <Text className="text-lg text-white">{phone || "-"}</Text>
          )}
        </View>

        <View className="w-1/2">
          <Text className="text-base text-gray-400">Niveau</Text>
          {editMode ? (
            <TouchableOpacity
              onPress={onSelectLevel}
              className="border-2 rounded-lg h-14 px-4 justify-center border-white"
            >
              <Text className={clsx("text-base", level ? "text-white" : "text-gray-400")}>
                {level || "Sélectionne ton niveau"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-lg text-white">{level || "-"}</Text>
          )}
        </View>
      </View>

      {/* Ligne 6 — Expérience */}
      <View className="mb-4">
        <Text className="text-base text-gray-400">Années d'expérience</Text>
        {editMode ? (
          <TextInput
            value={experience}
            onChangeText={setExperience}
            keyboardType="numeric"
            className="text-lg text-white border-b border-gray-500"
          />
        ) : (
          <Text className="text-lg text-white">{experience || "-"}</Text>
        )}
      </View>

      {/* Ligne 7 — Bio */}
      <View className="mb-6">
        <Text className="text-base text-gray-400">À propos de moi</Text>
        {editMode ? (
          <TextInput
            value={bio}
            onChangeText={setBio}
            multiline
            className="text-white border border-gray-600 rounded-lg px-4 py-3 mt-2"
            placeholder="Parle un peu de toi..."
            placeholderTextColor="#777"
          />
        ) : (
          <Text className="text-lg text-white mt-2">{bio || "-"}</Text>
        )}
      </View>
    </View>
  );
}
