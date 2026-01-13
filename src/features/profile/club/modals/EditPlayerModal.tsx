// src/Profil/Clubs/Teams/EditPlayerModal.tsx

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../../config/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

type Player = { id?: string; prenom: string; nom: string; poste?: string };

type Props = {
  visible: boolean;
  teamId: string | null;
  player: Player | null;
  onClose: () => void;
  onUpdated: (teamId: string, player: Player) => void;
};

const POSTES = ["Meneur", "Arriere", "Ailier", "Ailier-Fort", "Pivot"] as const;

export default function EditPlayerModal({
  visible,
  teamId,
  player,
  onClose,
  onUpdated,
}: Props) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState("");
  const [selectPoste, setSelectPoste] = useState(false);

  useEffect(() => {
    setPrenom(player?.prenom ?? "");
    setNom(player?.nom ?? "");
    setPoste(player?.poste ?? "");
  }, [player, visible]);

  const save = async () => {
    if (!teamId || !player?.id) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const next = {
      prenom: prenom.trim(),
      nom: nom.trim(),
      poste: poste.trim(),
    };

    if (!next.prenom || !next.nom) {
      alert("Le prenom et le nom sont requis.");
      return;
    }

    try {
      const ref = doc(db, "clubs", uid, "equipes", teamId, "joueurs", player.id);
      await updateDoc(ref, next);
      onUpdated(teamId, { ...player, ...next });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la modification du joueur.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-gray-900 rounded-2xl p-5 border border-gray-700 w-full max-w-md">
          <Text className="text-white text-lg font-bold mb-4 text-center">
            Modifier le joueur
          </Text>

          <TextInput
            value={prenom}
            onChangeText={setPrenom}
            placeholder="Prenom"
            placeholderTextColor="#888"
            className="bg-gray-800 text-white rounded-lg px-3 py-2 mb-3"
          />

          <TextInput
            value={nom}
            onChangeText={setNom}
            placeholder="Nom"
            placeholderTextColor="#888"
            className="bg-gray-800 text-white rounded-lg px-3 py-2 mb-3"
          />

          <Pressable
            onPress={() => setSelectPoste(true)}
            className="flex-row items-center mb-4"
          >
            <Ionicons name="basketball-outline" size={18} color="#F97316" />
            <Text className="text-orange-400 font-semibold ml-2">
              {poste ? poste : "Choisir un poste"}
            </Text>
          </Pressable>

          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 bg-gray-700 rounded-lg"
            >
              <Text className="text-white">Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={save}
              className="px-4 py-2 bg-orange-600 rounded-lg"
            >
              <Text className="text-white font-semibold">Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={selectPoste} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setSelectPoste(false)}
        >
          <Pressable
            className="bg-gray-900 rounded-2xl p-5 border border-gray-700 w-full max-w-md"
            onPress={() => null}
          >
            <Text className="text-white text-lg font-bold mb-4 text-center">
              Choisir un poste
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {POSTES.map((p) => {
                const selected = poste === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      setPoste(p);
                      setSelectPoste(false);
                    }}
                    className={`px-3 py-2 rounded-2xl ${
                      selected ? "bg-orange-500" : "bg-gray-800"
                    }`}
                  >
                    <Text className="text-white">{p}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row justify-between mt-5">
              <TouchableOpacity
                onPress={() => {
                  setPoste("");
                  setSelectPoste(false);
                }}
                className="px-4 py-2 bg-gray-700 rounded-lg"
              >
                <Text className="text-white">Sans poste</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectPoste(false)}
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
