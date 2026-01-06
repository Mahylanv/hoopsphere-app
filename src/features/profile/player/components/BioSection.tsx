// src/Profil/Joueur/components/BioSection.tsx

import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import clsx from "clsx";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { formatPhone } from "../modals/EditProfileModal/ EditProfileHandlers";

// Mapping codes → labels lisibles
const POSITION_LABELS: Record<string, string> = {
  MEN: "Meneur (MEN)",
  ARR: "Arrière (ARR)",
  AIL: "Ailier (AIL)",
  AF: "Ailier fort (AF)",
  PIV: "Pivot (PIV)",
};

export type BioSectionProps = {
  editMode: boolean;
  onToggleEdit?: () => void;
  onSave: () => void;

  birthYear: string;
  setBirthYear: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  onSelectHeight: () => void;
  weight: string;
  setWeight: (v: string) => void;
  onSelectWeight: () => void;
  position: string;
  setPosition: (v: string) => void;
  onSelectPoste: () => void;
  strongHand: string;
  setStrongHand: (v: string) => void;
  departement: string;
  onSelectDepartement: () => void;
  club: string;
  onSelectClub: () => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  level: string;
  onSelectLevel: () => void;
  experience: string;
  setExperience: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
};

export default function BioSection({
  onToggleEdit,
  onSave,
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
  email,
  setEmail,
  level,
  onSelectLevel,
  experience,
  setExperience,
  bio,
  setBio,
}: BioSectionProps) {
  const brand = {
    orange: "#F97316",
    blue: "#2563EB",
    surface: "#0E0D0D",
    border: "rgba(255,255,255,0.08)",
  };

  const renderInput = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    props: any = {}
  ) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      className="text-lg text-white border-b border-white/20 pb-1"
      placeholder={placeholder}
      placeholderTextColor="#6B7280"
      {...props}
    />
  );

  const renderSelect = (
    placeholder: string,
    onPress: () => void,
    displayValue?: string
  ) => (
    <TouchableOpacity
      onPress={onPress}
      className="border border-white/30 rounded-lg h-12 px-4 justify-center bg-white/5"
    >
      <Text
        className={clsx(
          "text-base",
          displayValue ? "text-white" : "text-gray-400"
        )}
      >
        {displayValue || placeholder}
      </Text>
    </TouchableOpacity>
  );

  return (
      <LinearGradient
        colors={[brand.blue, "#0D1324", brand.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 1,
          borderWidth: 1,
          borderColor: brand.border,
        }}
      >
        <View className="rounded-[18px] bg-[#0E0D0D] p-5">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-xl font-bold text-white">Biographie</Text>
              <Text className="text-gray-400 text-xs mt-1">
                Infos clés pour te présenter aux clubs
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (editMode) onSave();
                if (onToggleEdit) onToggleEdit();
              }}
              className="p-2 bg-white/5 rounded-full border border-white/10"
            >
              {editMode ? (
                <Feather name="check" size={22} color="#22c55e" />
              ) : (
                <Feather name="edit-2" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <View className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <View className="flex-row justify-between gap-x-4">
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Année de naissance</Text>
                {editMode
                  ? renderInput(birthYear, setBirthYear, "2002", { keyboardType: "numeric" })
                  : <Text className="text-lg text-white">{birthYear || "-"}</Text>}
              </View>
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Taille</Text>
                {editMode
                  ? renderSelect("Sélectionne ta taille", onSelectHeight, height ? `${height} cm` : "")
                  : <Text className="text-lg text-white">{height ? `${height} cm` : "-"}</Text>}
              </View>
            </View>

            <View className="flex-row justify-between gap-x-4">
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Poids</Text>
                {editMode
                  ? renderSelect("Sélectionne ton poids", onSelectWeight, weight ? `${weight} Kg` : "")
                  : <Text className="text-lg text-white">{weight ? `${weight} Kg` : "-"}</Text>}
              </View>
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Poste</Text>
                {editMode
                  ? renderSelect("Sélectionne ton poste", onSelectPoste, position || "")
                  : (
                    <Text className="text-lg text-white">
                      {position
                        ? position
                            .split(",")
                            .map((p) => POSITION_LABELS[p.trim()] || p)
                            .join(", ")
                        : "-"}
                    </Text>
                  )}
              </View>
            </View>

            <View className="flex-row justify-between gap-x-4">
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Main forte</Text>
                {editMode
                  ? renderInput(strongHand, setStrongHand, "Droite / Gauche")
                  : <Text className="text-lg text-white">{strongHand || "-"}</Text>}
              </View>
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Département</Text>
                {editMode
                  ? renderSelect("Sélectionne ton département", onSelectDepartement, departement || "")
                  : <Text className="text-lg text-white">{departement || "-"}</Text>}
              </View>
            </View>

            <View className="flex-row justify-between gap-x-4">
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Club actuel</Text>
                {editMode
                  ? renderSelect("Sélectionne ton club", onSelectClub, club || "")
                  : <Text className="text-lg text-white">{club || "-"}</Text>}
              </View>
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Email</Text>
                {editMode
                  ? renderInput(email, setEmail, "email@exemple.com", { keyboardType: "email-address" })
                  : <Text className="text-lg text-white">{email || "-"}</Text>}
              </View>
            </View>

            <View className="flex-row justify-between gap-x-4">
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Téléphone</Text>
                {editMode
                  ? renderInput(phone, (val) => setPhone(formatPhone(val)), "06 12 34 56 78", { keyboardType: "phone-pad" })
                  : <Text className="text-lg text-white">{phone || "-"}</Text>}
              </View>
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Niveau</Text>
                {editMode
                  ? renderSelect("Sélectionne ton niveau", onSelectLevel, level || "")
                  : <Text className="text-lg text-white">{level || "-"}</Text>}
              </View>
            </View>

            <View className="flex-row justify-between gap-x-4">
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Expérience</Text>
                {editMode
                  ? renderInput(experience, setExperience, "Ex: 5 ans en club")
                  : <Text className="text-lg text-white">{experience || "-"}</Text>}
              </View>
              <View className="w-1/2">
                <Text className="text-sm text-gray-400">Bio</Text>
                {editMode ? (
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    className="text-lg text-white border border-white/20 rounded-lg px-3 py-2"
                    placeholder="Parle de ton parcours, tes points forts..."
                    placeholderTextColor="#6B7280"
                    multiline
                  />
                ) : (
                  <Text className="text-lg text-white mt-2">{bio || "-"}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
  );
}
