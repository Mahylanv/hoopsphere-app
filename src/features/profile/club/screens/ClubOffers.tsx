// src/Profil/Clubs/ClubOffers.tsx

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
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Club as ClubType } from "../../../../types";

import { auth, db } from "../../../../config/firebaseConfig";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ProfilClub">;
type ProfileRoute = RouteProp<RootStackParamList, "ProfilClub">;

type Offer = {
  id?: string;
  title: string;
  description: string;
  position: string[]; //  multi-postes
  team: string;
  publishedAt: string;
  gender: "Homme" | "Femme" | "Mixte";
  ageRange: string;
  category: string;
  location: string;
  clubUid?: string;
};

export default function ClubOffers() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ProfileRoute>();
  const params = route.params;
  const clubParam = params?.club as unknown as Partial<ClubType> & {
    uid?: string;
  };
  const [shouldAutoOpen, setShouldAutoOpen] = useState(
    () => params?.openCreateOffer ?? false
  );

  // UID du club affiché (priorité au param)
  const clubUid = clubParam?.uid || clubParam?.id || auth.currentUser?.uid;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  // Champs formulaire
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [positions, setPositions] = useState<string[]>([]);
  const [gender, setGender] = useState<"Homme" | "Femme" | "Mixte">("Mixte");
  const [team, setTeam] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const [showPosteSelect, setShowPosteSelect] = useState(false);
  const [showGenreSelect, setShowGenreSelect] = useState(false);

  const POSTES = ["Meneur", "Arrière", "Ailier", "Ailier fort", "Pivot"];
  const GENRES: ("Homme" | "Femme" | "Mixte")[] = ["Homme", "Femme", "Mixte"];

  const togglePoste = (poste: string) => {
    setPositions((prev) =>
      prev.includes(poste) ? prev.filter((p) => p !== poste) : [...prev, poste]
    );
  };

  // Si un nouveau paramètre openCreateOffer arrive (ex: action rapide),
  // on réarme l'auto-ouverture même si cela a déjà été consommé précédemment.
  useEffect(() => {
    if (params?.openCreateOffer) {
      setShouldAutoOpen(true);
      setAutoOpened(false);
    }
  }, [params?.openCreateOffer]);

  useEffect(() => {
    if (!clubUid) {
      setLoading(false);
      return;
    }
    const ref = collection(db, "clubs", clubUid, "offres");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Offer),
        }));
        setOffers(data);
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot offres:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [clubUid]);

  useEffect(() => {
    if (shouldAutoOpen && auth.currentUser?.uid === clubUid && !autoOpened) {
      setModalVisible(true);
      setAutoOpened(true);
      setShouldAutoOpen(false);
      // Réinitialise le param sur la route Offres et son parent (tabs) pour éviter la persistance
      navigation.setParams({ openCreateOffer: false } as any);
      navigation.getParent()?.setParams?.({ openCreateOffer: false } as any);
      navigation.getParent()?.getParent()?.setParams?.({ openCreateOffer: false } as any);
    } else if (params?.openCreateOffer && !shouldAutoOpen) {
      // Si la navigation rehydrate encore le param, on le nettoie sans rouvrir
      navigation.setParams({ openCreateOffer: false } as any);
      navigation.getParent()?.setParams?.({ openCreateOffer: false } as any);
      navigation.getParent()?.getParent()?.setParams?.({ openCreateOffer: false } as any);
    }
  }, [shouldAutoOpen, params?.openCreateOffer, clubUid, autoOpened, navigation]);

  const addOffer = async () => {
    if (!clubUid) return;
    if (!title.trim() || !description.trim()) {
      Alert.alert("Champs requis", "Titre et description sont obligatoires.");
      return;
    }
    try {
      setSaving(true);
      const ref = collection(db, "clubs", clubUid, "offres");
      const newOffer: Offer = {
        title,
        description,
        position: positions, // array
        team,
        gender,
        ageRange,
        category,
        location,
        publishedAt: new Date().toISOString().split("T")[0],
        clubUid,
      };
      await addDoc(ref, newOffer);
      setModalVisible(false);
      setAutoOpened(false);
      setTitle("");
      setDescription("");
      setTeam("");
      setAgeRange("");
      setCategory("");
      setLocation("");
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d’ajouter l’offre.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id?: string) => {
    if (!id || !clubUid) return;
    try {
      await deleteDoc(doc(db, "clubs", clubUid, "offres", id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0E0D0D]">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-400 mt-3">Chargement des offres...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0E0D0D]">
      <StatusBar barStyle="light-content" />

      <View className="px-4 pt-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-orange-600/20 items-center justify-center mr-3">
            <Ionicons name="briefcase-outline" size={20} color="#F97316" />
          </View>
          <View>
            <Text className="text-white text-lg font-semibold">Offres</Text>
            <Text className="text-gray-400 text-xs">
              {offers.length} offre{offers.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Ajout d’offre uniquement si on affiche son propre club */}
      {auth.currentUser?.uid === clubUid && (
        <Pressable
          onPress={() => setModalVisible(true)}
          className="mx-4 mt-4 mb-2 py-3 bg-orange-600 rounded-xl items-center flex-row justify-center"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">Créer une offre</Text>
        </Pressable>
      )}

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
        data={offers}
        keyExtractor={(o) => o.id || Math.random().toString()}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-10 text-base">
            Aucune offre publiée pour le moment.
          </Text>
        }
        renderItem={({ item }) => {
          const isMyClub = auth.currentUser?.uid === clubUid;

          const onOpen = () => {
            if (isMyClub) {
              navigation.navigate("EditOffer", { offer: item });
            } else {
              navigation.navigate("OfferDetail", {
                offer: { ...item, clubUid: item.clubUid || clubUid },
              });
            }
          };

          return (
            <View className="mb-5">
              <LinearGradient
                colors={["#F97316", "#0E0D0D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 18, padding: 1.5 }}
              >
                <Pressable
                  onPress={onOpen}
                  android_ripple={{ color: "#333" }}
                  className="bg-[#111827] rounded-[16px] p-5 border border-gray-800"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="w-9 h-9 rounded-2xl bg-orange-600/20 items-center justify-center mr-3">
                        <Ionicons name="briefcase-outline" size={18} color="#F97316" />
                      </View>
                      <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>
                        {item.title || "Sans titre"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </View>

                  <View className="flex-row flex-wrap mb-3">
                    {item.location ? (
                      <View className="flex-row items-center bg-black/30 border border-gray-800 px-3 py-1 rounded-full mr-2 mb-2">
                        <Ionicons name="location-outline" size={12} color="#F97316" />
                        <Text className="text-gray-200 text-xs ml-1">
                          {item.location}
                        </Text>
                      </View>
                    ) : null}
                    {item.publishedAt ? (
                      <View className="flex-row items-center bg-black/30 border border-gray-800 px-3 py-1 rounded-full mr-2 mb-2">
                        <Ionicons name="calendar-outline" size={12} color="#60a5fa" />
                        <Text className="text-gray-200 text-xs ml-1">
                          {item.publishedAt}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {!!item.description && (
                    <View className="bg-[#0b0f19] border border-gray-800 rounded-xl p-3 mb-4">
                      <Text className="text-gray-300 text-[14px] leading-5" numberOfLines={3}>
                        {item.description}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row flex-wrap">
                    {Array.isArray(item.position) && item.position.length > 0 && (
                      <View className="bg-orange-600/20 border border-orange-500/30 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2">
                        <Ionicons name="person-outline" size={12} color="#F97316" />
                        <Text className="text-orange-100 text-xs ml-1">
                          {Array.isArray(item.position)
                            ? item.position.join(" • ")
                            : "Non précisé"}
                        </Text>
                      </View>
                    )}
                    {!!item.gender && (
                      <View className="bg-blue-600/20 border border-blue-500/30 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2">
                        <Ionicons name="male-female-outline" size={12} color="#60a5fa" />
                        <Text className="text-blue-100 text-xs ml-1">
                          {item.gender}
                        </Text>
                      </View>
                    )}
                    {!!item.team && (
                      <View className="bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2">
                        <Ionicons name="people-outline" size={12} color="#34d399" />
                        <Text className="text-emerald-100 text-xs ml-1">
                          {item.team}
                        </Text>
                      </View>
                    )}
                    {!!item.category && (
                      <View className="bg-sky-600/20 border border-sky-500/30 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2">
                        <Ionicons name="trophy-outline" size={12} color="#38bdf8" />
                        <Text className="text-sky-100 text-xs ml-1">
                          {item.category}
                        </Text>
                      </View>
                    )}
                    {!!item.ageRange && (
                      <View className="bg-gray-700/60 border border-gray-600 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2">
                        <Ionicons name="hourglass-outline" size={12} color="#d1d5db" />
                        <Text className="text-gray-200 text-xs ml-1">
                          {item.ageRange}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions (supprimer) visibles seulement pour le club */}
                  {isMyClub && (
                    <>
                      <View className="border-t border-gray-800 mt-4 mb-3" />
                      <View className="flex-row justify-end">
                        <TouchableOpacity
                          onPress={() => deleteOffer(item.id)}
                          className="flex-row items-center gap-1 px-4 py-2 bg-red-600/80 border border-red-500/40 rounded-xl"
                        >
                          <Ionicons name="trash-outline" size={16} color="white" />
                          <Text className="text-white font-semibold text-sm">
                            Supprimer
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </Pressable>
              </LinearGradient>
            </View>
          );
        }}
      />

      {/* Modal création (seulement pour son propre club) */}
      {auth.currentUser?.uid === clubUid && (
        <Modal visible={modalVisible} transparent animationType="fade">
          <BlurView
            intensity={45}
            tint="dark"
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
              style={{ width: "100%" }}
            >
              <View className="bg-[#1b1f2a] w-[90%] rounded-3xl p-6 border border-gray-800 shadow-2xl">
                <Text className="text-white text-2xl font-bold text-center mb-6">
                  Nouvelle offre
                </Text>

                <View className="mb-4">
                  <Text className="text-gray-400 mb-2 text-[15px]">Titre</Text>
                  <TextInput
                    placeholder="Ex: Recrutement U18"
                    placeholderTextColor="#6b7280"
                    value={title}
                    onChangeText={setTitle}
                    className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700"
                  />
                </View>

                <View className="flex-row gap-3 mb-5">
                  {/* ===== SELECT POSTES (MULTI) ===== */}
                  <View className="flex-1">
                    <Text className="text-gray-400 mb-2 text-[15px]">
                      Postes
                    </Text>

                    <Pressable
                      onPress={() => setShowPosteSelect(true)}
                      className="bg-[#0e1320] border border-gray-700 rounded-2xl px-4 py-3"
                    >
                      <Text
                        className="text-white text-[15px]"
                        numberOfLines={1}
                      >
                        {positions.length > 0 ? positions.join(", ") : "Postes"}
                      </Text>
                    </Pressable>
                  </View>

                  {/* ===== SELECT GENRES (SIMPLE) ===== */}
                  <View className="flex-1">
                    <Text className="text-gray-400 mb-2 text-[15px]">
                      Genres
                    </Text>

                    <Pressable
                      onPress={() => setShowGenreSelect(true)}
                      className="bg-[#0e1320] border border-gray-700 rounded-2xl px-4 py-3"
                    >
                      <Text
                        className="text-white text-[15px]"
                        numberOfLines={1}
                      >
                        {gender || "Genre"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-400 mb-2 text-[15px]">
                    Description
                  </Text>
                  <TextInput
                    placeholder="Décris ton offre…"
                    placeholderTextColor="#6b7280"
                    value={description}
                    onChangeText={setDescription}
                    className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 min-h-[110px]"
                    multiline
                  />
                </View>

                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-gray-400 mb-2 text-[15px]">
                      Équipe
                    </Text>
                    <TextInput
                      placeholder="Ex: U18"
                      placeholderTextColor="#6b7280"
                      value={team}
                      onChangeText={setTeam}
                      className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 mb-2 text-[15px]">
                      Tranche d’âge
                    </Text>
                    <TextInput
                      placeholder="Ex: 18–22 ans"
                      placeholderTextColor="#6b7280"
                      value={ageRange}
                      onChangeText={setAgeRange}
                      className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700"
                    />
                  </View>
                </View>

                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1">
                    <Text className="text-gray-400 mb-2 text-[15px]">
                      Catégorie
                    </Text>
                    <TextInput
                      placeholder="Ex: Régional 2"
                      placeholderTextColor="#6b7280"
                      value={category}
                      onChangeText={setCategory}
                      className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 mb-2 text-[15px]">Lieu</Text>
                    <TextInput
                      placeholder="Ex: Bastia"
                      placeholderTextColor="#6b7280"
                      value={location}
                      onChangeText={setLocation}
                      className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700"
                    />
                  </View>
                </View>

                <View className="flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setAutoOpened(false);
                  }}
                  className="px-5 py-2.5 bg-gray-700 rounded-xl"
                >
                    <Text className="text-white text-[15px]">Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={!title || saving}
                    onPress={addOffer}
                    className="px-5 py-2.5 bg-orange-600 rounded-xl"
                  >
                    <Text className="text-white font-semibold text-[15px]">
                      {saving ? "Création..." : "Créer"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </BlurView>

          {/* ===== MODAL SELECT POSTES ===== */}
          <Modal visible={showPosteSelect} transparent animationType="fade">
            <Pressable
              className="flex-1 bg-black/60 justify-center items-center px-6"
              onPress={() => setShowPosteSelect(false)}
            >
              <View className="bg-[#1b1f2a] w-full rounded-3xl p-6">
                <Text className="text-white text-xl font-bold mb-4">
                  Postes recherchés
                </Text>
                <Text className="text-gray-400 text-sm mb-4">
                  Tu peux sélectionner plusieurs postes.
                </Text>

                {POSTES.map((poste) => {
                  const selected = positions.includes(poste);
                  return (
                    <Pressable
                      key={poste}
                      onPress={() => togglePoste(poste)}
                      className={`py-3 px-4 rounded-xl mb-2 ${
                        selected ? "bg-orange-600" : "bg-[#0e1320]"
                      }`}
                    >
                      <Text className="text-white">{poste}</Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  disabled={positions.length === 0}
                  onPress={() => setShowPosteSelect(false)}
                  className={`mt-4 py-3 rounded-xl items-center ${
                    positions.length > 0 ? "bg-orange-600" : "bg-gray-700"
                  }`}
                >
                  <Text className="text-white font-semibold">Valider</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>

          {/* ===== MODAL SELECT GENRE ===== */}
          <Modal visible={showGenreSelect} transparent animationType="fade">
            <Pressable
              className="flex-1 bg-black/60 justify-center items-center px-6"
              onPress={() => setShowGenreSelect(false)}
            >
              <View className="bg-[#1b1f2a] w-full rounded-3xl p-6">
                <Text className="text-white text-xl font-bold mb-4">Genre</Text>

                {GENRES.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => {
                      setGender(g);
                      setShowGenreSelect(false);
                    }}
                    className={`py-3 px-4 rounded-xl mb-2 ${
                      gender === g ? "bg-orange-600" : "bg-[#0e1320]"
                    }`}
                  >
                    <Text className="text-white">{g}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Modal>
        </Modal>
      )}
    </View>
  );
}

