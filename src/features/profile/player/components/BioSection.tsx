// src/Profil/Joueur/components/BioSection.tsx

import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import clsx from "clsx";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { formatPhone } from "../modals/EditProfileModal/ EditProfileHandlers";

// Mapping codes → labels lisibles
const POSITION_LABELS: Record<string, string> = {
  MEN: "Meneur",
  M: "Meneur",
  ARR: "Arrière",
  AR: "Arrière",
  AIL: "Ailier",
  AI: "Ailier",
  AF: "Ailier fort",
  PIV: "Pivot",
  P: "Pivot",
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

  const renderValue = (value?: string, suffix = "") => {
    const trimmed = value?.toString().trim();
    return (
      <Text className={clsx("text-base mt-2", trimmed ? "text-white" : "text-gray-500")}>
        {trimmed ? `${trimmed}${suffix}` : "—"}
      </Text>
    );
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
      className="text-base text-white border-b border-white/20 pb-1 mt-2"
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
      className="border border-white/20 rounded-xl px-3 py-2 mt-2 bg-white/5"
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

  const renderField = (label: string, content: React.ReactNode) => (
    <View className="bg-[#0b0f18] border border-white/10 rounded-2xl px-3 py-3 overflow-hidden">
      <View className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500/40" />
      <View className="absolute left-2 right-2 top-2 h-[1px] bg-white/5" />
      <View className="absolute -right-6 -top-6 w-14 h-14 rounded-full bg-orange-500/10" />
      <Text className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </Text>
      {content}
    </View>
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
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-white">
                  Données personnelles
                </Text>
                <View className="ml-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5">
                  <Text className="text-[10px] text-orange-200 uppercase tracking-widest">
                    Profil
                  </Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs mt-1">
                Les infos clés de ton profil joueur
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

          <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Année de naissance",
                  editMode
                    ? renderInput(birthYear, setBirthYear, "2002", { keyboardType: "numeric" })
                    : renderValue(birthYear)
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Taille",
                  editMode
                    ? renderSelect("Sélectionne ta taille", onSelectHeight, height ? `${height} cm` : "")
                    : renderValue(height, height ? " cm" : "")
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Poids",
                  editMode
                    ? renderSelect("Sélectionne ton poids", onSelectWeight, weight ? `${weight} Kg` : "")
                    : renderValue(weight, weight ? " Kg" : "")
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Poste",
                  editMode
                    ? renderSelect("Sélectionne ton poste", onSelectPoste, position || "")
                    : renderValue(
                        position
                          ? position
                              .split(",")
                              .map((p) => POSITION_LABELS[p.trim()] || p)
                              .join(", ")
                          : ""
                      )
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Main forte",
                  editMode
                    ? renderInput(strongHand, setStrongHand, "Droite / Gauche")
                    : renderValue(strongHand)
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Département",
                  editMode
                    ? renderSelect("Sélectionne ton département", onSelectDepartement, departement || "")
                    : renderValue(departement)
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Club actuel",
                  editMode
                    ? renderSelect("Sélectionne ton club", onSelectClub, club || "")
                    : renderValue(club)
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Email",
                  editMode
                    ? renderInput(email, setEmail, "email@exemple.com", { keyboardType: "email-address" })
                    : renderValue(email)
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Téléphone",
                  editMode
                    ? renderInput(phone, (val) => setPhone(formatPhone(val)), "06 12 34 56 78", { keyboardType: "phone-pad" })
                    : renderValue(phone)
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Niveau",
                  editMode
                    ? renderSelect("Sélectionne ton niveau", onSelectLevel, level || "")
                    : renderValue(level)
                )}
              </View>
              <View className="w-1/2 px-2 mb-4">
                {renderField(
                  "Expérience",
                  editMode
                    ? renderInput(experience, setExperience, "Ex: 5 ans en club")
                    : renderValue(experience)
                )}
              </View>
            </View>
          </View>

          <View className="mt-6">
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-full bg-orange-500/15 border border-orange-500/30 items-center justify-center mr-3">
                <Feather name="edit-3" size={16} color="#FDBA74" />
              </View>
              <View>
                <Text className="text-white text-lg font-semibold">Biographie</Text>
                <Text className="text-gray-400 text-xs mt-1">
                  Mets en avant ton parcours et tes points forts
                </Text>
              </View>
            </View>
            <LinearGradient
              colors={["#0b0f18", "#0f172a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 1, marginTop: 12 }}
            >
              <View className="bg-[#0b0f18] border border-white/10 rounded-2xl px-3 py-3">
                {editMode ? (
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    className="text-base text-white"
                    placeholder="Parle de ton parcours, tes points forts..."
                    placeholderTextColor="#6B7280"
                    multiline
                    textAlignVertical="top"
                    style={{ minHeight: 120 }}
                  />
                ) : (
                  <Text className={clsx("text-base leading-6", bio ? "text-white" : "text-gray-500")}>
                    {bio || "Aucune biographie renseignée."}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>
  );
}
