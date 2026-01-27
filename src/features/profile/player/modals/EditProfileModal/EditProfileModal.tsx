// src/Profil/Joueurs/components/EditProfileModal/EditProfileModal.tsx

import React, { forwardRef, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { Ionicons } from "@expo/vector-icons";

import usePlayerProfile from "../../hooks/usePlayerProfile";
import { handleEmailInput, handlePhoneInput } from "./ EditProfileHandlers";
import EditProfileSections from "./EditProfileSections";
import { TAILLES, POIDS, POSTES, MAINS, LEVELS } from "./EditProfileConstants";

type Props = {
  fields: any;
  editFields: any;
  setEditField: (k: string, v: string) => void;
  saveProfile: () => Promise<void>;

  // 🔥 AJOUT OBLIGATOIRE POUR L'EMAIL
  passwordModalVisible: boolean;
  setPasswordModalVisible: (v: boolean) => void;

  passwordForReauth: string;
  setPasswordForReauth: (v: string) => void;

  tempNewEmail: string;
  setTempNewEmail: (v: string) => void;
};

type ModalizeRef = {
  open: () => void;
  close: () => void;
};

const EditProfileModal = forwardRef<ModalizeRef, Props>(
  (
    {
      fields,
      editFields,
      setEditField,
      saveProfile,
      passwordModalVisible,
      setPasswordModalVisible,
      passwordForReauth,
      setPasswordForReauth,
      tempNewEmail,
      setTempNewEmail,
    },
    ref
  ) => {
    // ✔️ Tu peux récupérer UNIQUEMENT les méthodes qui ne dépendent pas de ces états
    const { handleAvatarChange } = usePlayerProfile();

    // ---------------- UI STATES ----------------
    const [openDobPicker, setOpenDobPicker] = useState(false);
    const [openTaille, setOpenTaille] = useState(false);
    const [openPoids, setOpenPoids] = useState(false);
    const [openClubModal, setOpenClubModal] = useState(false);
    const [openLevelModal, setOpenLevelModal] = useState(false);

    const [clubs, setClubs] = useState<string[]>([]);
    const [clubSearch, setClubSearch] = useState("");

    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const modalRef = ref as React.RefObject<Modalize>;

    // ---------------- LOAD CLUBS ----------------
    useEffect(() => {
      import("firebase/firestore").then(async ({ collection, getDocs }) => {
        const refClubs = collection(
          require("../../../../../config/firebaseConfig").db,
          "clubs"
        );
        const snap = await getDocs(refClubs);
        const list = snap.docs
          .map((d) => d.data()?.nom)
          .filter((c) => typeof c === "string");

        setClubs(list);
      });
    }, []);

    const filteredClubs = clubs.filter((c) =>
      c.toLowerCase().includes(clubSearch.toLowerCase())
    );

    // ---------------- AVATAR ----------------
    const pickAvatar = async () => {
      const ImagePicker = await import("expo-image-picker");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setEditField("avatar", uri);
        await handleAvatarChange(uri);
      }
    };

    // ---------------- POSTES ----------------
    const togglePoste = (code: string) => {
      const current =
        editFields.poste
          ?.split(",")
          .map((v: string) => v.trim())
          .filter(Boolean) || [];

      const updated = current.includes(code)
        ? current.filter((p: string) => p !== code)
        : [...current, code];

      setEditField("poste", updated.join(","));
    };

    // ---------------- RENDER ----------------
    return (
      <>
        <Modalize
          ref={modalRef}
          modalHeight={650}
          handleStyle={{ backgroundColor: "#444" }}
          modalStyle={{ backgroundColor: "#111" }}
        >
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-2xl font-bold">
                Modifier mon profil
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await saveProfile();
                  modalRef.current?.close();
                }}
                className="bg-orange-500/15 border border-orange-500/40 rounded-full px-3 py-2 flex-row items-center"
              >
                <Text className="text-white font-semibold text-sm">
                  Enregistrer
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <EditProfileSections
                fields={fields}
                editFields={editFields}
                setEditField={setEditField}
                handleEmailInput={(v) =>
                  handleEmailInput(v, setEditField, setEmailError)
                }
                handlePhoneInput={(v) =>
                  handlePhoneInput(v, setEditField, setPhoneError)
                }
                pickAvatar={pickAvatar}
                openDobPicker={openDobPicker}
                setOpenDobPicker={setOpenDobPicker}
                openTaille={openTaille}
                setOpenTaille={setOpenTaille}
                openPoids={openPoids}
                setOpenPoids={setOpenPoids}
                openClubModal={openClubModal}
                setOpenClubModal={setOpenClubModal}
                clubs={clubs}
                filteredClubs={filteredClubs}
                setClubSearch={setClubSearch}
                emailError={emailError}
                phoneError={phoneError}
                TAILLES={TAILLES}
                POIDS={POIDS}
                POSTES={POSTES}
                MAINS={MAINS}
                LEVELS={LEVELS}
                togglePoste={togglePoste}
                openLevelModal={openLevelModal}
                setOpenLevelModal={setOpenLevelModal}
              />

              {/* BUTTON SAVE */}
              <TouchableOpacity
                onPress={async () => {
                  await saveProfile();
                  modalRef.current?.close();
                }}
                className="bg-orange-500 p-4 rounded-xl mt-6 mb-10"
              >
                <Text className="text-center text-white text-lg font-bold">
                  Enregistrer
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modalize>

        {/* 🔥 PASSWORD MODAL */}
        <Modal visible={passwordModalVisible} animationType="fade" transparent>
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <View className="bg-[#222] w-full p-6 rounded-2xl">
              <Text className="text-white text-xl font-bold mb-4">
                Confirmer votre mot de passe
              </Text>

              <Text className="text-gray-300 mb-3">
                Pour modifier votre email, entrez votre mot de passe actuel :
              </Text>

              {/* ----------- INPUT MOT DE PASSE + ICÔNE ŒIL ----------- */}
              <View className="relative w-full mb-4">
                <TextInput
                  secureTextEntry={!showPassword}
                  placeholder="Mot de passe"
                  placeholderTextColor="#888"
                  value={passwordForReauth}
                  onChangeText={setPasswordForReauth}
                  className="bg-[#333] text-white p-3 pr-12 rounded-lg"
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#bbb"
                  />
                </TouchableOpacity>
              </View>

              {/* ----------- BOUTONS ----------- */}
              <View className="flex-row justify-end">
                <TouchableOpacity
                  onPress={() => setPasswordModalVisible(false)}
                  className="px-4 py-2 mr-3"
                >
                  <Text className="text-gray-300">Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    await saveProfile();
                  }}
                  className="bg-orange-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-bold">Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }
);

export default EditProfileModal;
