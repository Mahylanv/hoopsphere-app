// src/Profil/Clubs/ClubTeams.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StatusBar,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList, Club } from "../../types";
import { auth, db } from "../../config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

type ClubProfileRouteProp = RouteProp<RootStackParamList, "ProfilClub">;

type Player = { id?: string; prenom: string; nom: string };
type Team = { id?: string; label: string; createdAt?: string };

export default function ClubTeams() {
  const { club } = useRoute<ClubProfileRouteProp>().params as { club: Club };
  const [teams, setTeams] = useState<Team[]>([]);
  const [playersByTeam, setPlayersByTeam] = useState<Record<string, Player[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // === Modal création équipe ===
  const [modalVisible, setModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [playersInputs, setPlayersInputs] = useState<Player[]>([{ prenom: "", nom: "" }]);
  const [saving, setSaving] = useState(false);

  // === Modal ajout joueur post-création ===
  const [addPlayersModal, setAddPlayersModal] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [newPlayersInputs, setNewPlayersInputs] = useState<Player[]>([{ prenom: "", nom: "" }]);

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  // === Charger équipes + joueurs ===
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const teamsSnap = await getDocs(collection(db, "clubs", uid, "equipes"));
        const data = teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Team[];
        setTeams(data);

        const playersData: Record<string, Player[]> = {};
        for (const team of data) {
          const joueursSnap = await getDocs(
            collection(db, "clubs", uid, "equipes", team.id!, "joueurs")
          );
          playersData[team.id!] = joueursSnap.docs.map((j) => ({
            id: j.id,
            ...j.data(),
          })) as Player[];
        }
        setPlayersByTeam(playersData);
      } catch (err) {
        console.error("Erreur chargement équipes :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // === Ajouter équipe + joueurs ===
  const addTeamWithPlayers = async () => {
    if (!newTeamName.trim()) return Alert.alert("Erreur", "Nom d’équipe requis.");
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const ref = collection(db, "clubs", uid, "equipes");
      const newTeam = { label: newTeamName.trim(), createdAt: new Date().toISOString() };
      const teamDoc = await addDoc(ref, newTeam);

      const validPlayers = playersInputs.filter((p) => p.nom && p.prenom);
      for (const p of validPlayers) {
        await addDoc(collection(db, "clubs", uid, "equipes", teamDoc.id, "joueurs"), p);
      }

      setTeams((prev) => [...prev, { ...newTeam, id: teamDoc.id }]);
      setPlayersByTeam((prev) => ({ ...prev, [teamDoc.id]: validPlayers }));

      setNewTeamName("");
      setPlayersInputs([{ prenom: "", nom: "" }]);
      setModalVisible(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // === Ajouter joueurs après création ===
  const addPlayersToTeam = async () => {
    if (!currentTeamId) return;
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const validPlayers = newPlayersInputs.filter((p) => p.nom && p.prenom);

      for (const p of validPlayers) {
        await addDoc(collection(db, "clubs", uid, "equipes", currentTeamId, "joueurs"), p);
      }

      setPlayersByTeam((prev) => ({
        ...prev,
        [currentTeamId]: [...(prev[currentTeamId] || []), ...validPlayers],
      }));

      setNewPlayersInputs([{ prenom: "", nom: "" }]);
      setAddPlayersModal(false);
    } catch (err) {
      console.error("Erreur ajout joueurs :", err);
    }
  };

  // === Supprimer joueur ===
  const deletePlayer = async (teamId: string, playerId?: string) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
  
      // 🔹 Étape 1 : supprimer en BDD seulement si on a un id Firestore
      if (playerId) {
        await deleteDoc(doc(db, "clubs", uid, "equipes", teamId, "joueurs", playerId));
      }
  
      // 🔹 Étape 2 : mettre à jour le state en toute sécurité
      setPlayersByTeam((prev) => {
        const current = prev[teamId] || [];
        const updated = current.filter(
          (p) => p.id !== playerId && !(p.id === undefined && !playerId)
        );
        return { ...prev, [teamId]: updated };
      });
    } catch (err) {
      console.error("Erreur suppression joueur :", err);
    }
  };  

  // === Supprimer équipe ===
  const deleteTeam = async (id?: string) => {
    if (!id) return;
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await deleteDoc(doc(db, "clubs", uid, "equipes", id));
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Erreur suppression équipe :", err);
    }
  };

  // === UI Helpers ===
  const addInput = (setFn: any) => setFn((prev: any) => [...prev, { prenom: "", nom: "" }]);
  const removeInput = (setFn: any, index: number) =>
    setFn((prev: any) => prev.filter((_: any, i: number) => i !== index));
  const updateInput = (setFn: any, index: number, key: keyof Player, value: string) =>
    setFn((prev: any) => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });

  const icons = [
    "basketball",
    "trophy",
    "shield-star-outline",
    "account-group",
    "lightning-bolt",
    "medal",
  ];

  const getIcon = (label: string) => {
    const index = label.charCodeAt(0) % icons.length;
    return icons[index];
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-400 mt-3">Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" />
      <Pressable
        onPress={() => setModalVisible(true)}
        className="m-4 py-3 bg-orange-600 rounded-xl items-center"
      >
        <Text className="text-white font-semibold">+ Créer une équipe</Text>
      </Pressable>

      {/* === Liste équipes === */}
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={teams}
        keyExtractor={(t) => t.id!}
        renderItem={({ item }) => {
          const open = expanded === item.id;
          return (
            <View className="mb-4 border border-gray-700 rounded-xl overflow-hidden">
              <Pressable
                onPress={() => toggle(item.id!)}
                className="bg-gray-800 px-4 py-3 flex-row justify-between items-center"
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name={getIcon(item.label) as any}
                    size={28}
                    color="#F97316"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white text-lg font-semibold">
                    {item.label}
                  </Text>
                </View>
                <Text className="text-white text-2xl">{open ? "−" : "+"}</Text>
              </Pressable>

              {open && (
                <View className="bg-gray-800 px-4 py-3">
                  {playersByTeam[item.id!]?.length ? (
                    playersByTeam[item.id!].map((p) => (
                      <View
                      key={p.id || `${p.prenom}-${p.nom}-${Math.random()}`}
                        className="flex-row justify-between items-center border-b border-gray-700 py-1"
                      >
                        <Text className="text-gray-300">
                          {p.prenom} {p.nom}
                        </Text>
                        <Pressable onPress={() => deletePlayer(item.id!, p.id!)}>
                          <Ionicons name="trash" size={18} color="#f87171" />
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-400 mb-2">
                      Aucun joueur enregistré.
                    </Text>
                  )}

                  <View className="flex-row justify-end space-x-2 mt-3">
                    <Pressable
                      onPress={() => {
                        setCurrentTeamId(item.id!);
                        setAddPlayersModal(true);
                      }}
                      className="bg-orange-600 px-3 py-2 rounded-lg"
                    >
                      <Text className="text-white font-semibold">
                        + Ajouter joueurs
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteTeam(item.id)}
                      className="bg-red-600 px-3 py-2 rounded-lg"
                    >
                      <Text className="text-white font-semibold">Supprimer</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* === Modal création équipe === */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <ScrollView
            className="bg-gray-900 rounded-2xl p-5 border border-gray-700 w-full max-w-md"
            style={{ maxHeight: "80%" }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-white text-lg font-bold mb-4 text-center">
              Nouvelle équipe
            </Text>
            <TextInput
              value={newTeamName}
              onChangeText={setNewTeamName}
              placeholder="Nom de l’équipe (ex : U17 Masculin)"
              placeholderTextColor="#999"
              className="bg-gray-800 text-white rounded-lg px-4 py-3 mb-4"
            />
            <Text className="text-white mb-2 font-semibold">Joueurs</Text>
            {playersInputs.map((p, i) => (
              <View key={i} className="flex-row items-center space-x-2 mb-2">
                <TextInput
                  value={p.prenom}
                  onChangeText={(v) => updateInput(setPlayersInputs, i, "prenom", v)}
                  placeholder="Prénom"
                  placeholderTextColor="#888"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
                />
                <TextInput
                  value={p.nom}
                  onChangeText={(v) => updateInput(setPlayersInputs, i, "nom", v)}
                  placeholder="Nom"
                  placeholderTextColor="#888"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
                />
                {playersInputs.length > 1 && (
                  <Pressable onPress={() => removeInput(setPlayersInputs, i)}>
                    <Ionicons name="remove-circle" size={22} color="#f87171" />
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable
              onPress={() => addInput(setPlayersInputs)}
              className="flex-row items-center mb-3"
            >
              <Ionicons name="add-circle" size={22} color="#F97316" />
              <Text className="text-orange-400 font-semibold ml-2">
                Ajouter un joueur
              </Text>
            </Pressable>
            <View className="flex-row justify-end space-x-3 mt-4">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-2 bg-gray-700 rounded-lg"
              >
                <Text className="text-white">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addTeamWithPlayers}
                disabled={saving}
                className="px-4 py-2 bg-orange-600 rounded-lg"
              >
                <Text className="text-white font-semibold">
                  {saving ? "Création..." : "Créer"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* === Modal ajout joueurs post-création === */}
      <Modal visible={addPlayersModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <ScrollView
            className="bg-gray-900 rounded-2xl p-5 border border-gray-700 w-full max-w-md"
            style={{ maxHeight: "70%" }}
          >
            <Text className="text-white text-lg font-bold mb-4 text-center">
              Ajouter des joueurs
            </Text>
            {newPlayersInputs.map((p, i) => (
              <View key={i} className="flex-row items-center space-x-2 mb-2">
                <TextInput
                  value={p.prenom}
                  onChangeText={(v) => updateInput(setNewPlayersInputs, i, "prenom", v)}
                  placeholder="Prénom"
                  placeholderTextColor="#888"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
                />
                <TextInput
                  value={p.nom}
                  onChangeText={(v) => updateInput(setNewPlayersInputs, i, "nom", v)}
                  placeholder="Nom"
                  placeholderTextColor="#888"
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
                />
                {newPlayersInputs.length > 1 && (
                  <Pressable onPress={() => removeInput(setNewPlayersInputs, i)}>
                    <Ionicons name="remove-circle" size={22} color="#f87171" />
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable
              onPress={() => addInput(setNewPlayersInputs)}
              className="flex-row items-center mb-3"
            >
              <Ionicons name="add-circle" size={22} color="#F97316" />
              <Text className="text-orange-400 font-semibold ml-2">
                Ajouter un joueur
              </Text>
            </Pressable>

            <View className="flex-row justify-end space-x-3 mt-4">
              <TouchableOpacity
                onPress={() => setAddPlayersModal(false)}
                className="px-4 py-2 bg-gray-700 rounded-lg"
              >
                <Text className="text-white">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addPlayersToTeam}
                className="px-4 py-2 bg-orange-600 rounded-lg"
              >
                <Text className="text-white font-semibold">Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
