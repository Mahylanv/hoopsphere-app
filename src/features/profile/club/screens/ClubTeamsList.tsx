import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StatusBar, ActivityIndicator } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList, Club as ClubType } from "../../../../types";

import { auth, db } from "../../../../config/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

import CreateTeamModal from "../modals/CreateTeamModal";
import AddPlayersModal from "../modals/AddPlayersModal";

type ClubProfileRouteProp = RouteProp<RootStackParamList, "ProfilClub">;

type Player = { id?: string; prenom: string; nom: string };
type Team = { id?: string; label: string; createdAt?: string };

export default function ClubTeamsList() {
  const { params } = useRoute<ClubProfileRouteProp>();
  const clubParam = params?.club as unknown as Partial<ClubType> & { uid?: string };
  const clubUid = clubParam?.uid; // 👈 UNIQUEMENT uid

  const [teams, setTeams] = useState<Team[]>([]);
  const [playersByTeam, setPlayersByTeam] = useState<Record<string, Player[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalCreateTeam, setModalCreateTeam] = useState(false);
  const [modalAddPlayers, setModalAddPlayers] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        if (!clubUid) { setLoading(false); return; }

        const teamsSnap = await getDocs(collection(db, "clubs", clubUid, "equipes"));
        const data = teamsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Team[];
        setTeams(data);

        const map: Record<string, Player[]> = {};
        for (const t of data) {
          const joueursSnap = await getDocs(collection(db, "clubs", clubUid, "equipes", t.id!, "joueurs"));
          map[t.id!] = joueursSnap.docs.map((j) => ({ id: j.id, ...(j.data() as any) })) as Player[];
        }
        setPlayersByTeam(map);
      } catch (err) {
        console.error("Erreur chargement équipes :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [clubUid]);

  const deletePlayer = async (teamId: string, playerId?: string) => {
    if (!clubUid || !playerId) return;
    try {
      await deleteDoc(doc(db, "clubs", clubUid, "equipes", teamId, "joueurs", playerId));
      setPlayersByTeam((prev) => ({ ...prev, [teamId]: (prev[teamId] || []).filter((p) => p.id !== playerId) }));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTeam = async (id?: string) => {
    if (!clubUid || !id) return;
    try {
      await deleteDoc(doc(db, "clubs", clubUid, "equipes", id));
      setTeams((prev) => prev.filter((t) => t.id !== id));
      const { [id]: _, ...rest } = playersByTeam;
      setPlayersByTeam(rest);
    } catch (e) {
      console.error(e);
    }
  };

  const icons = ["basketball", "trophy", "shield-star-outline", "account-group", "lightning-bolt", "medal"];
  const getIcon = (label: string) => icons[label.charCodeAt(0) % icons.length];

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0E0D0D]">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-400 mt-3">Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0E0D0D]">
      <StatusBar barStyle="light-content" />

      {/* Création d’équipe seulement si c’est **son** club */}
      {auth.currentUser?.uid === clubUid && (
        <Pressable onPress={() => setModalCreateTeam(true)} className="m-5 px-4 py-3 bg-orange-600 rounded-xl items-center">
          <Text className="text-white font-semibold">+ Créer une équipe</Text>
        </Pressable>
      )}

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={teams}
        keyExtractor={(t) => t.id!}
        renderItem={({ item }) => {
          const open = expanded === item.id;
          return (
            <View className="mb-4 border border-gray-700 rounded-xl overflow-hidden">
              <Pressable onPress={() => toggle(item.id!)} className="bg-gray-800 px-4 py-3 flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name={getIcon(item.label) as any} size={28} color="#F97316" style={{ marginRight: 8 }} />
                  <Text className="text-white text-lg font-semibold">{item.label}</Text>
                </View>
                <Text className="text-white text-2xl">{open ? "−" : "+"}</Text>
              </Pressable>

              {open && (
                <View className="bg-gray-800 px-4 py-3">
                  {playersByTeam[item.id!]?.length ? (
                    playersByTeam[item.id!].map((p) => (
                      <View key={p.id} className="flex-row justify-between items-center border-b border-gray-700 py-1">
                        <Text className="text-gray-300">{p.prenom} {p.nom}</Text>
                        {auth.currentUser?.uid === clubUid && (
                          <Pressable onPress={() => deletePlayer(item.id!, p.id)}>
                            <Ionicons name="trash" size={18} color="#f87171" />
                          </Pressable>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-400 mb-2">Aucun joueur enregistré.</Text>
                  )}

                  {auth.currentUser?.uid === clubUid && (
                    <View className="flex-row justify-end space-x-2 mt-3">
                      <Pressable
                        onPress={() => { setCurrentTeamId(item.id!); setModalAddPlayers(true); }}
                        className="bg-orange-600 px-3 py-2 rounded-lg"
                      >
                        <Text className="text-white font-semibold">+ Ajouter joueurs</Text>
                      </Pressable>

                      <Pressable onPress={() => deleteTeam(item.id)} className="bg-red-600 px-3 py-2 rounded-lg">
                        <Text className="text-white font-semibold">Supprimer</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Modals — réservés au proprio du club */}
      {auth.currentUser?.uid === clubUid && (
        <>
          <CreateTeamModal
            visible={modalCreateTeam}
            onClose={() => setModalCreateTeam(false)}
            onCreated={(team, players) => {
              setTeams((prev) => [...prev, team]);
              setPlayersByTeam((prev) => ({ ...prev, [team.id!]: players }));
            }}
          />
          <AddPlayersModal
            visible={modalAddPlayers}
            onClose={() => setModalAddPlayers(false)}
            teamId={currentTeamId}
            onPlayersAdded={(teamId, newPlayers) => {
              setPlayersByTeam((prev) => ({
                ...prev,
                [teamId]: [...(prev[teamId] || []), ...newPlayers],
              }));
            }}
          />
        </>
      )}
    </View>
  );
}
