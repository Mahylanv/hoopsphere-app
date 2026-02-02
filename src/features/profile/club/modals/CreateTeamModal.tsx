// src/Profil/Clubs/Teams/CreateTeamModal.tsx

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../../config/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

type Player = { prenom: string; nom: string; poste?: string };
type Team = { id?: string; label: string; createdAt: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (team: Team, players: Player[]) => void;
};

const POSTES = ["Meneur", "Arriere", "Ailier", "Ailier-Fort", "Pivot"] as const;

export default function CreateTeamModal({
  visible,
  onClose,
  onCreated,
}: Props) {
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<Player[]>([
    { prenom: "", nom: "", poste: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectPosteIndex, setSelectPosteIndex] = useState<number | null>(null);

  // Ajouter un champ joueur
  const addInput = () => {
    setPlayers((prev) => [...prev, { prenom: "", nom: "", poste: "" }]);
  };

  // Modifier le champ
  const updateInput = (i: number, key: keyof Player, value: string) => {
    setPlayers((prev) => {
      const arr = [...prev];
      arr[i][key] = value;
      return arr;
    });
  };

  // Supprimer un champ joueur
  const removeInput = (i: number) => {
    setPlayers((prev) => prev.filter((_, index) => index !== i));
  };

  const closePosteSelect = () => setSelectPosteIndex(null);

  // ===================================
  // CRÉATION ÉQUIPE
  // ===================================
  const createTeam = async () => {
    if (!teamName.trim()) {
      alert("Le nom de l’équipe est requis.");
      return;
    }

    try {
      setLoading(true);

      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // 1. création équipe
      const teamData: Team = {
        label: teamName.trim(),
        createdAt: new Date().toISOString(),
      };

      const ref = collection(db, "clubs", uid, "equipes");
      const teamDoc = await addDoc(ref, teamData);

      // 2. joueurs valides
      const validPlayers = players.filter(
        (p) => p.prenom.trim() && p.nom.trim()
      );

      for (const p of validPlayers) {
        await addDoc(
          collection(db, "clubs", uid, "equipes", teamDoc.id, "joueurs"),
          p
        );
      }

      // 3. callback parent
      onCreated({ ...teamData, id: teamDoc.id }, validPlayers);

      // 4. reset + fermeture
      setTeamName("");
      setPlayers([{ prenom: "", nom: "", poste: "" }]);
      onClose();
    } catch (err) {
      console.error("Erreur création équipe :", err);
      alert("Impossible de créer l’équipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <ScrollView
          className="bg-gray-900 rounded-2xl p-5 border border-gray-700 w-full max-w-md"
          style={{ maxHeight: "80%" }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text className="text-white text-lg font-bold mb-4 text-center">
            Nouvelle équipe
          </Text>

          {/* Nom Ç¸quipe */}
          <TextInput
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Nom de l’équipe (ex : U17 Masculin)"
            placeholderTextColor="#999"
            className="bg-gray-800 text-white rounded-lg px-4 py-3 mb-4"
          />

          {/* Joueurs */}
          <Text className="text-white mb-2 font-semibold">Joueurs</Text>

          {players.map((p, i) => (
            <View key={i} className="mb-3">
              <View className="flex-row items-center">
                <TextInput
                  value={p.prenom}
                  onChangeText={(v) => updateInput(i, "prenom", v)}
                  placeholder="Prénom"
                  placeholderTextColor="#888"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 mr-2"
                />

                <TextInput
                  value={p.nom}
                  onChangeText={(v) => updateInput(i, "nom", v)}
                  placeholder="Nom"
                  placeholderTextColor="#888"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 mr-2"
                />

                {players.length > 1 && (
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

          {/* Ajouter un joueur */}
          <Pressable
            onPress={addInput}
            className="flex-row items-center mb-3"
          >
            <Ionicons name="add-circle" size={22} color="#F97316" />
            <Text className="text-orange-400 font-semibold ml-2">
              Ajouter un joueur
            </Text>
          </Pressable>

          {/* Actions */}
          <View className="flex-row justify-end mt-4">
            <TouchableOpacity
              onPress={loading ? undefined : onClose}
              className="px-4 py-2 bg-gray-700 rounded-lg"
            >
              <Text className="text-white">Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={createTeam}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 rounded-lg flex-row items-center ml-3"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Créer</Text>
              )}
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
                  players[selectPosteIndex]?.poste === poste;
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
