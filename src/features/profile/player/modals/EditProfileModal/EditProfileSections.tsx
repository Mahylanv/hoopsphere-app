// src/Profil/Joueurs/components/EditProfileModal/EditProfileSections.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import DepartmentSelect from "../../../../../shared/components/DepartmentSelect";
import ClearableInput from "../../../../../shared/components/ClearableInput";

type Props = {
  fields: any;
  editFields: any;
  setEditField: (key: string, value: string) => void;

  // handlers reçus de EditProfileHandlers.ts
  handleEmailInput: (v: string) => void;
  handlePhoneInput: (v: string) => void;
  pickAvatar: () => Promise<void>;

  // UI states envoyés par EditProfileModal
  openDobPicker: boolean;
  setOpenDobPicker: (b: boolean) => void;

  openTaille: boolean;
  setOpenTaille: (b: boolean) => void;

  openPoids: boolean;
  setOpenPoids: (b: boolean) => void;

  openClubModal: boolean;
  setOpenClubModal: (b: boolean) => void;

  clubs: string[];
  filteredClubs: string[];
  setClubSearch: (v: string) => void;

  openLevelModal: boolean;
  setOpenLevelModal: (b: boolean) => void;

  emailError: string;
  phoneError: string;

  TAILLES: number[];
  POIDS: number[];
  POSTES: { code: string; label: string }[];
  MAINS: string[];
  LEVELS: string[];
  togglePoste: (code: string) => void;
};

export default function EditProfileSections(props: Props) {
  const {
    fields,
    editFields,
    setEditField,
    handleEmailInput,
    handlePhoneInput,
    pickAvatar,

    openDobPicker,
    setOpenDobPicker,

    openTaille,
    setOpenTaille,

    openPoids,
    setOpenPoids,

    openClubModal,
    setOpenClubModal,

    clubs,
    filteredClubs,
    setClubSearch,

    emailError,
    phoneError,

    TAILLES,
    POIDS,
    POSTES,
    MAINS,
    togglePoste,
    LEVELS,

    openLevelModal, //  ⭐ AJOUT
    setOpenLevelModal,
  } = props;

  const currentPostes: string[] =
    editFields.poste?.split(",").map((x: string) => x.trim().toLowerCase()) ??
    [];

    const formatPhoneLive = (raw: string) => {
      const digits = raw.replace(/\D/g, "").slice(0, 10); // max 10 chiffres FR
    
      return digits
        .replace(/(\d{2})(?=\d)/g, "$1 ") // ajoute un espace toutes les 2 digits
        .trim();
    };
    
    const updatePhone = (value: string) => {
      const formatted = formatPhoneLive(value);
      setEditField("phone", formatted);
    };

  return (
    <>
      {/* ⭐ PHOTO DE PROFIL */}
      <View className="items-center mb-6">
        <TouchableOpacity
          onPress={pickAvatar}
          className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 items-center justify-center"
        >
          {editFields.avatar ? (
            <Image
              source={{ uri: editFields.avatar }}
              className="w-full h-full"
            />
          ) : (
            <Ionicons name="person-circle-outline" size={110} color="#777" />
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 text-sm mt-2">
          Modifier la photo de profil
        </Text>
      </View>

      {/* ⭐ IDENTITÉ */}
      <View className="flex-row w-full justify-between mb-5">
        <View className="flex-1 mr-2">
          <ClearableInput
            label="Prénom"
            value={editFields.prenom}
            onChange={(v) => setEditField("prenom", v)}
            placeholder="Prénom"
          />
        </View>

        <View className="flex-1 ml-2">
          <ClearableInput
            label="Nom"
            value={editFields.nom}
            onChange={(v) => setEditField("nom", v)}
            placeholder="Nom"
          />
        </View>
      </View>

      {/* ⭐ DATE DE NAISSANCE */}
      <Text className="text-gray-400 mb-1">Date de naissance</Text>

      <TouchableOpacity
        className="bg-[#222] p-3 rounded-lg mb-5"
        onPress={() => setOpenDobPicker(true)}
      >
        <Text className="text-white">
          {editFields.dob || "Sélectionner la date de naissance"}
        </Text>
      </TouchableOpacity>

      {/* ⭐ MODAL DATE PICKER */}
      <Modal visible={openDobPicker} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setOpenDobPicker(false)}
        >
          <View className="bg-[#1A1A1A] rounded-t-2xl px-4 py-5 w-full">
            <Text className="text-white text-center text-lg font-semibold mb-3">
              Sélectionner la date de naissance
            </Text>

            <DateTimePicker
              value={
                editFields.dob
                  ? new Date(
                      Number(editFields.dob.split("/")[2]),
                      Number(editFields.dob.split("/")[1]) - 1,
                      Number(editFields.dob.split("/")[0])
                    )
                  : new Date(2005, 0, 1)
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              themeVariant="dark" // ⭐ IMPORTANT : rend le texte visible
              textColor="#ffffff" // ⭐ iOS : force le texte en blanc
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (!selectedDate) return;

                const d = String(selectedDate.getDate()).padStart(2, "0");
                const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
                const y = selectedDate.getFullYear();

                setEditField("dob", `${d}/${m}/${y}`);

                if (Platform.OS === "android") {
                  setOpenDobPicker(false);
                }
              }}
            />

            {/* ⭐ BOUTONS iOS */}
            {Platform.OS === "ios" && (
              <View className="flex-row justify-between mt-6">
                <TouchableOpacity
                  onPress={() => setOpenDobPicker(false)}
                  className="bg-gray-300 px-6 py-3 rounded-xl"
                >
                  <Text className="text-black font-semibold">Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setOpenDobPicker(false)}
                  className="bg-orange-500 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Valider</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ⭐ TAILLE + POIDS */}
      <View className="flex-row w-full justify-between mb-5">
        <View className="flex-1 mr-2">
          <Text className="text-gray-400 mb-1">Taille (cm)</Text>

          <TouchableOpacity
            className="bg-[#222] p-3 rounded-lg"
            onPress={() => setOpenTaille(true)}
          >
            <Text className="text-white">
              {editFields.taille
                ? `${editFields.taille} cm`
                : "Sélectionner..."}
            </Text>
          </TouchableOpacity>

          <Modal visible={openTaille} animationType="slide">
            <View className="flex-1 bg-black p-6">
              <TouchableOpacity onPress={() => setOpenTaille(false)}>
                <Ionicons
                  name="arrow-back"
                  size={26}
                  color="#fff"
                  className="mt-10 mb-5"
                />
              </TouchableOpacity>

              <FlatList
                data={TAILLES}
                keyExtractor={(i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-3 border-b border-gray-700"
                    onPress={() => {
                      setEditField("taille", item.toString());
                      setOpenTaille(false);
                    }}
                  >
                    <Text className="text-white text-lg">{item} cm</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Modal>
        </View>

        <View className="flex-1 ml-2">
          <Text className="text-gray-400 mb-1">Poids (kg)</Text>

          <TouchableOpacity
            className="bg-[#222] p-3 rounded-lg"
            onPress={() => setOpenPoids(true)}
          >
            <Text className="text-white">
              {editFields.poids ? `${editFields.poids} kg` : "Sélectionner..."}
            </Text>
          </TouchableOpacity>

          <Modal visible={openPoids} animationType="slide">
            <View className="flex-1 bg-black p-6">
              <TouchableOpacity onPress={() => setOpenPoids(false)}>
                <Ionicons
                  name="arrow-back"
                  size={26}
                  color="#fff"
                  className="mt-10 mb-5"
                />
              </TouchableOpacity>

              <FlatList
                data={POIDS}
                keyExtractor={(i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-3 border-b border-gray-700"
                    onPress={() => {
                      setEditField("poids", item.toString());
                      setOpenPoids(false);
                    }}
                  >
                    <Text className="text-white text-lg">{item} kg</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Modal>
        </View>
      </View>

      {/* ⭐ POSTES */}
      <Text className="text-gray-400 mb-2">Poste(s)</Text>

      <View className="flex-row flex-wrap mb-5">
        {POSTES.map((poste) => {
          const active = currentPostes.includes(poste.code.toLowerCase());
          return (
            <TouchableOpacity
              key={poste.code}
              onPress={() => togglePoste(poste.code)}
              className={`px-3 py-2 rounded-lg m-1 ${
                active ? "bg-orange-500" : "bg-[#222]"
              }`}
            >
              <Text className="text-white text-xs">{poste.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ⭐ MAIN FORTE */}
      <Text className="text-gray-400 mb-2">Main forte</Text>

      <View className="flex-row mb-5">
        {MAINS.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setEditField("main", m)}
            className={`px-4 py-2 rounded-lg mr-2 ${
              editFields.main === m ? "bg-orange-500" : "bg-[#222]"
            }`}
          >
            <Text className="text-white">{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ⭐ DÉPARTEMENT */}
      <Text className="text-gray-400 mb-1">Département</Text>

      <DepartmentSelect
        value={editFields.departement ? [editFields.departement] : []}
        onSelect={(list) => setEditField("departement", list[0] || "")}
        placeholder="Sélectionner..."
        single={true}
      />

      <View className="mb-5" />

      {/* ⭐ CLUB */}
      <Text className="text-gray-400 mb-1">Club</Text>

      <TouchableOpacity
        className="bg-[#222] p-3 rounded-lg mb-5"
        onPress={() => setOpenClubModal(true)}
      >
        <Text className="text-white">
          {editFields.club || "Sélectionner..."}
        </Text>
      </TouchableOpacity>

      <Modal visible={openClubModal} animationType="slide">
        <View className="flex-1 bg-black p-6">
          <TouchableOpacity onPress={() => setOpenClubModal(false)}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-bold mb-4">
            Modifier mon club
          </Text>

          <ClearableInput
            placeholder="Nom du club"
            value={editFields.club}
            onChange={(v) => setEditField("club", v)}
          />

          <TouchableOpacity
            onPress={() => setOpenClubModal(false)}
            className="bg-orange-500 py-4 rounded-xl mt-6"
          >
            <Text className="text-white text-center text-lg font-bold">
              Enregistrer
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ⭐ EMAIL + TÉLÉPHONE */}
      <View className="flex-row w-full justify-between mb-5">
        <View className="flex-1 mr-2">
          <ClearableInput
            label="Email"
            value={editFields.email}
            placeholder="Email"
            keyboardType="email-address"
            error={emailError}
            onChange={handleEmailInput}
          />
        </View>

        <View className="flex-1 ml-2">
          <ClearableInput
            label="Téléphone"
            value={editFields.phone}
            placeholder="06 00 00 00 00"
            keyboardType="phone-pad"
            error={phoneError}
            onChange={updatePhone}
          />
        </View>
      </View>

      {/* ⭐ NIVEAU + EXPÉRIENCE */}
      <View className="flex-row w-full justify-between mb-5">
        {/* ⭐ NIVEAU */}
        <View className="flex-1 mr-2">
          <Text className="text-gray-400 mb-1">Niveau</Text>

          <TouchableOpacity
            className="bg-[#222] p-3 rounded-lg"
            onPress={() => setOpenLevelModal(true)}
          >
            <Text className="text-white">
              {editFields.level || "Sélectionner..."}
            </Text>
          </TouchableOpacity>

          {/* MODAL NIVEAUX */}
          <Modal visible={openLevelModal} animationType="slide">
            <View className="flex-1 bg-black p-6">
              <TouchableOpacity onPress={() => setOpenLevelModal(false)}>
                <Ionicons
                  name="arrow-back"
                  size={28}
                  color="#fff"
                  className="mt-10 mb-5"
                />
              </TouchableOpacity>

              <Text className="text-white text-xl font-bold mb-4">
                Sélectionner le niveau
              </Text>

              <FlatList
                data={LEVELS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-3 border-b border-gray-700"
                    onPress={() => {
                      setEditField("level", item);
                      setOpenLevelModal(false);
                    }}
                  >
                    <Text className="text-white text-lg">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Modal>
        </View>

        {/* ⭐ EXPERIENCE */}
        <View className="flex-1 ml-2">
          <ClearableInput
            label="Années d'expérience"
            value={editFields.experience}
            placeholder="0"
            keyboardType="numeric"
            onChange={(v) => {
              if (/^\d*$/.test(v)) setEditField("experience", v);
            }}
          />
        </View>
      </View>

      {/* ⭐ BIO */}
      <ClearableInput
        label="À propos de moi"
        value={editFields.description}
        placeholder="Parle un peu de toi…"
        onChange={(v) => setEditField("description", v)}
      />
    </>
  );
}
