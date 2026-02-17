// src/Profil/Clubs/Teams/AddPlayersModal.tsx

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../../config/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

type Player = { id?: string; prenom: string; nom: string; poste?: string };

type Props = {
  visible: boolean;
  teamId: string | null;
  onClose: () => void;

  /**
   * ÐY"¾ EXACTEMENT ce que tu utilises dans ClubTeamsList
   * (teamId, playersCrÇ¸Ç¸s)
   */
  onPlayersAdded: (teamId: string, players: Player[]) => void;
};

const POSTES = ["Meneur", "Arriere", "Ailier", "Ailier-Fort", "Pivot"] as const;

export default function AddPlayersModal({
  visible,
  teamId,
  onClose,
  onPlayersAdded,
}: Props) {
  const [inputs, setInputs] = useState<Player[]>([
    { prenom: "", nom: "", poste: "" },
  ]);
  const [selectPosteIndex, setSelectPosteIndex] = useState<number | null>(null);

  const addInput = () => {
    setInputs((prev) => [...prev, { prenom: "", nom: "", poste: "" }]);
  };

  const updateInput = (index: number, key: keyof Player, value: string) => {
    setInputs((prev) => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  const removeInput = (index: number) => {
    setInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const closePosteSelect = () => setSelectPosteIndex(null);

  const addPlayers = async () => {
    if (!teamId) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const validPlayers = inputs.filter(
      (p) => p.prenom.trim() && p.nom.trim()
    );

    if (validPlayers.length === 0) {
      alert("Tu dois remplir au moins un joueur.");
      return;
    }

    try {
      const createdPlayers: Player[] = [];
      for (const p of validPlayers) {
        const created = await addDoc(
          collection(db, "clubs", uid, "equipes", teamId, "joueurs"),
          p
        );
        createdPlayers.push({ ...p, id: created.id });
      }

      // Renvoie les ids pour que la suppression marche immediatement
      onPlayersAdded(teamId, createdPlayers);

      setInputs([{ prenom: "", nom: "", poste: "" }]);
      onClose();
    } catch (err) {
      // console.log("Erreur ajout joueurs :", err);
      alert("Erreur lors de l'ajout des joueurs.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <ScrollView
          className="bg-gray-900 rounded-2xl p-5 border border-gray-700 w-full max-w-md"
          style={{ maxHeight: "70%" }}
        >
          <Text className="text-white text-lg font-bold mb-4 text-center">
            Ajouter des joueurs
          </Text>

          {inputs.map((p, i) => (
            <View key={i} className="mb-3">
              <View className="flex-row items-center space-x-2">
                <TextInput
                  value={p.prenom}
                  onChangeText={(v) => updateInput(i, "prenom", v)}
                  placeholder="Prénom"
                  placeholderTextColor="#888"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
                />

                <TextInput
                  value={p.nom}
                  onChangeText={(v) => updateInput(i, "nom", v)}
                  placeholder="Nom"
                  placeholderTextColor="#888"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
                />

                {inputs.length > 1 && (
                  <Pressable onPress={() => removeInput(i)}>
                    <Ionicons name="remove-circle" size={22} color="#f87171" />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => setSelectPosteIndex(i)}
                className="flex-row items-center mt-2"
              >
                <Ionicons
                  name="basketball-outline"
                  size={18}
                  color="#F97316"
                />
                <Text className="text-orange-400 font-semibold ml-2">
                  {p.poste ? p.poste : "Choisir un poste"}
                </Text>
              </Pressable>
            </View>
          ))}

          <Pressable onPress={addInput} className="flex-row items-center mb-3">
            <Ionicons name="add-circle" size={22} color="#F97316" />
            <Text className="text-orange-400 font-semibold ml-2">
              Ajouter un joueur
            </Text>
          </Pressable>

          <View className="flex-row justify-end space-x-3 mt-4">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 mr-2 bg-gray-700 rounded-lg"
            >
              <Text className="text-white">Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={addPlayers}
              className="px-4 py-2 bg-orange-600 rounded-lg"
            >
              <Text className="text-white font-semibold">Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <Modal visible={selectPosteIndex !== null} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={closePosteSelect}
        >
          <Pressable
            className="bg-gray-900 rounded-2xl p-5 border border-gray-700 w-full max-w-md"
            onPress={() => null}
          >
            <Text className="text-white text-lg font-bold mb-4 text-center">
              Choisir un poste
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {POSTES.map((poste) => {
                const selected =
                  selectPosteIndex !== null &&
                  inputs[selectPosteIndex]?.poste === poste;
                return (
                  <Pressable
                    key={poste}
                    onPress={() => {
                      if (selectPosteIndex === null) return;
                      updateInput(selectPosteIndex, "poste", poste);
                      closePosteSelect();
                    }}
                    className={`px-3 py-2 rounded-2xl ${
                      selected ? "bg-orange-500" : "bg-gray-800"
                    }`}
                  >
                    <Text className="text-white">{poste}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row justify-between mt-5">
              <TouchableOpacity
                onPress={() => {
                  if (selectPosteIndex === null) return;
                  updateInput(selectPosteIndex, "poste", "");
                  closePosteSelect();
                }}
                className="px-4 py-2 bg-gray-700 rounded-lg"
              >
                <Text className="text-white">Sans poste</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closePosteSelect}
                className="px-4 py-2 bg-orange-600 rounded-lg"
              >
                <Text className="text-white font-semibold">Fermer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}
