import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StatusBar, ActivityIndicator } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  const getInitials = (player: Player) => {
    const prenom = (player.prenom || "").trim();
    const nom = (player.nom || "").trim();
    const initials = `${prenom ? prenom[0] : ""}${nom ? nom[0] : ""}`.toUpperCase();
    return initials || "?";
  };

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

      <View className="px-5 pt-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-orange-600/20 items-center justify-center mr-3">
            <Ionicons name="people-outline" size={20} color="#F97316" />
          </View>
          <View>
            <Text className="text-white text-lg font-semibold">Équipes</Text>
            <Text className="text-gray-400 text-xs">
              {teams.length} équipe{teams.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Création d’équipe seulement si c’est **son** club */}
      {auth.currentUser?.uid === clubUid && (
        <Pressable
          onPress={() => setModalCreateTeam(true)}
          className="mx-5 mt-4 mb-2 px-4 py-3 bg-orange-600 rounded-xl items-center flex-row justify-center"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">Créer une équipe</Text>
        </Pressable>
      )}

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        data={teams}
        keyExtractor={(t) => t.id!}
        renderItem={({ item }) => {
          const open = expanded === item.id;
          const playersCount = playersByTeam[item.id!]?.length ?? 0;
          return (
            <View className="mb-4">
              <LinearGradient
                colors={["#F97316", "#0E0D0D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 18, padding: 1.5 }}
              >
                <View className="rounded-[16px] overflow-hidden bg-gray-900 border border-gray-800">
                  <Pressable
                    onPress={() => toggle(item.id!)}
                    className="bg-gray-800/80 px-4 py-3 flex-row justify-between items-center"
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-orange-600/20 items-center justify-center mr-3">
                        <MaterialCommunityIcons name={getIcon(item.label) as any} size={22} color="#F97316" />
                      </View>
                      <View>
                        <Text className="text-white text-lg font-semibold">{item.label}</Text>
                        <Text className="text-gray-400 text-xs">
                          {playersCount} joueur{playersCount > 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-gray-700/70 items-center justify-center">
                      <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#fff" />
                    </View>
                  </Pressable>

                  {open && (
                    <View className="bg-gray-900 px-4 py-3 border-t border-gray-800">
                      {playersByTeam[item.id!]?.length ? (
                        playersByTeam[item.id!].map((p) => (
                          <View
                            key={p.id}
                            className="flex-row justify-between items-center bg-gray-800/60 border border-gray-800 rounded-lg px-3 py-2 mb-2"
                          >
                            <View className="flex-row items-center">
                              <View className="w-7 h-7 rounded-full bg-orange-600/20 items-center justify-center mr-2">
                                <Text className="text-orange-400 text-xs font-semibold">
                                  {getInitials(p)}
                                </Text>
                              </View>
                              <Text className="text-gray-200">{p.prenom} {p.nom}</Text>
                            </View>
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

                          <Pressable onPress={() => deleteTeam(item.id)} className="bg-red-600 px-3 py-2 rounded-lg ml-2">
                            <Text className="text-white font-semibold">Supprimer</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </LinearGradient>
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
