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
  position: string[]; // ✅ multi-postes
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
  const { params } = useRoute<ProfileRoute>();
  const clubParam = params?.club as unknown as Partial<ClubType> & {
    uid?: string;
  };

  // UID du club affiché (priorité au param)
  const clubUid = clubParam?.uid || clubParam?.id || auth.currentUser?.uid;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

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
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-400 mt-3">Chargement des offres...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" />

      {/* Ajout d’offre uniquement si on affiche son propre club */}
      {auth.currentUser?.uid === clubUid && (
        <Pressable
          onPress={() => setModalVisible(true)}
          className="m-4 py-3 bg-orange-600 rounded-xl items-center"
        >
          <Text className="text-white font-semibold">+ Créer une offre</Text>
        </Pressable>
      )}

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
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
              <Pressable
                onPress={onOpen}
                android_ripple={{ color: "#333" }}
                className="bg-[#1b1f2a] rounded-2xl p-5 border border-gray-800 shadow-sm mt-4"
              >
                {/*  CONTENU DE LA CARTE (de nouveau visible) */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className="text-white font-bold text-lg flex-1"
                    numberOfLines={1}
                  >
                    {item.title || "Sans titre"}
                  </Text>
                  {item.publishedAt ? (
                    <Text className="text-gray-500 text-xs ml-2">
                      {item.publishedAt}
                    </Text>
                  ) : null}
                </View>

                {item.location ? (
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#9ca3af"
                    />
                    <Text className="text-gray-400 text-sm ml-1">
                      {item.location}
                    </Text>
                  </View>
                ) : null}

                {!!item.description && (
                  <Text
                    className="text-gray-300 text-[14px] mb-4"
                    numberOfLines={3}
                  >
                    {item.description}
                  </Text>
                )}

                <View className="flex-row flex-wrap gap-2">
                  {Array.isArray(item.position) && item.position.length > 0 && (
                    <View className="bg-orange-600/80 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons name="person-outline" size={12} color="white" />
                      <Text className="text-white text-xs ml-1">
                        {Array.isArray(item.position)
                          ? item.position.join(" • ")
                          : "Non précisé"}
                      </Text>
                    </View>
                  )}
                  {!!item.gender && (
                    <View className="bg-purple-600/80 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons
                        name="male-female-outline"
                        size={12}
                        color="white"
                      />
                      <Text className="text-white text-xs ml-1">
                        {item.gender}
                      </Text>
                    </View>
                  )}
                  {!!item.team && (
                    <View className="bg-green-600/80 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons name="people-outline" size={12} color="white" />
                      <Text className="text-white text-xs ml-1">
                        {item.team}
                      </Text>
                    </View>
                  )}
                  {!!item.category && (
                    <View className="bg-blue-600/80 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons name="trophy-outline" size={12} color="white" />
                      <Text className="text-white text-xs ml-1">
                        {item.category}
                      </Text>
                    </View>
                  )}
                  {!!item.ageRange && (
                    <View className="bg-gray-700 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons
                        name="hourglass-outline"
                        size={12}
                        color="white"
                      />
                      <Text className="text-white text-xs ml-1">
                        {item.ageRange}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions (supprimer) visibles seulement pour le club */}
                {isMyClub && (
                  <>
                    <View className="border-t border-gray-700 mt-4 mb-3" />
                    <View className="flex-row justify-end">
                      <TouchableOpacity
                        onPress={() => deleteOffer(item.id)}
                        className="flex-row items-center gap-1 px-4 py-2 bg-red-600 rounded-xl active:bg-red-700"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="white"
                        />
                        <Text className="text-white font-semibold text-sm">
                          Supprimer
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </Pressable>
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
                    onPress={() => setModalVisible(false)}
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
                  onPress={() => setShowPosteSelect(false)}
                  className="mt-4 py-3 bg-gray-700 rounded-xl items-center"
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
