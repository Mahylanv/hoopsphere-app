import React, { forwardRef, useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Modalize } from "react-native-modalize";

import usePlayerProfile from "../../hooks/usePlayerProfile";
import {
  handleEmailInput,
  handlePhoneInput,
  formatPhone,
} from "./ EditProfileHandlers";

import EditProfileSections from "./EditProfileSections";
import { TAILLES, POIDS, POSTES, MAINS, LEVELS } from "./EditProfileConstants";

type Props = {
  fields: any;
  editFields: any;
  setEditField: (k: string, v: string) => void;
  saveProfile: () => Promise<void>;
};

type ModalizeRef = {
  open: () => void;
  close: () => void;
};

const EditProfileModal = forwardRef<Modalize, Props>(
  ({ fields, editFields, setEditField, saveProfile }, ref) => {
    /* -----------------------------------------------------
        🔥 HOOKS IMPORTÉS DU PROFIL
    ----------------------------------------------------- */
    const { handleAvatarChange } = usePlayerProfile();

    /* -----------------------------------------------------
        🔥 ETATS UI SPÉCIFIQUES AU MODAL
    ----------------------------------------------------- */
    const [openDobPicker, setOpenDobPicker] = useState(false);
    const [openTaille, setOpenTaille] = useState(false);
    const [openPoids, setOpenPoids] = useState(false);
    const [openClubModal, setOpenClubModal] = useState(false);

    const [clubs, setClubs] = useState<string[]>([]);
    const [clubSearch, setClubSearch] = useState("");

    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const modalRef = ref as React.RefObject<ModalizeRef>;
    const [openLevelModal, setOpenLevelModal] = useState(false);

    /* -----------------------------------------------------
        🔥 FETCH LISTE CLUBS
    ----------------------------------------------------- */
    useEffect(() => {
      import("firebase/firestore").then(async ({ collection, getDocs }) => {
        const ref = collection(
          require("../../../../config/firebaseConfig").db,
          "clubs"
        );
        const snap = await getDocs(ref);
        const list = snap.docs
          .map((d) => d.data()?.nom)
          .filter((c) => typeof c === "string");
        setClubs(list);
      });
    }, []);

    const filteredClubs = clubs.filter((c) =>
      c.toLowerCase().includes(clubSearch.toLowerCase())
    );

    /* -----------------------------------------------------
        🔥 PICK AVATAR
    ----------------------------------------------------- */
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
        setEditField("avatar", uri); // 🔥 maj immédiate modal
        await handleAvatarChange(uri); // 🔥 maj BDD
      }
    };

    /* -----------------------------------------------------
        🔥 TOGGLE POSTE
    ----------------------------------------------------- */
    const togglePoste = (code: string) => {
      const current =
        editFields.poste
          ?.split(",")
          .map((v: string) => v.trim())
          .filter(Boolean) || []; // ← Important !!

      if (current.includes(code)) {
        setEditField(
          "poste",
          current.filter((p: string) => p !== code).join(",")
        );
      } else {
        setEditField("poste", [...current, code].join(","));
      }
    };

    /* -----------------------------------------------------
        🎨 RENDER
    ----------------------------------------------------- */
    return (
      <Modalize
        ref={ref}
        modalHeight={650}
        handleStyle={{ backgroundColor: "#444" }}
        modalStyle={{ backgroundColor: "#111" }}
      >
        <View className="p-6">
          <Text className="text-white text-2xl font-bold mb-6">
            Modifier mon profil
          </Text>

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

            {/* ------------------- ENREGISTRER ------------------- */}
            <TouchableOpacity
              onPress={async () => {
                await saveProfile();
                modalRef.current?.close(); // ← correction
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
    );
  }
);

export default EditProfileModal;
