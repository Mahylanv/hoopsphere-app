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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { auth, db } from "../../config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ProfilClub">;

type Offer = {
  id?: string;
  title: string;
  description: string;
  position: string;
  team: string;
  publishedAt: string;
  gender: "Homme" | "Femme" | "Mixte";
  ageRange: string;
  category: string;
  location: string;
};

export default function ClubOffers() {
  const navigation = useNavigation<NavProp>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Champs du formulaire d’ajout
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState("");
  const [team, setTeam] = useState("");
  const [gender, setGender] = useState<"Homme" | "Femme" | "Mixte">("Mixte");
  const [ageRange, setAgeRange] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  // 🔄 Charger les offres du club
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDocs(collection(db, "clubs", uid, "offres"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Offer[];
        setOffers(data);
      } catch (err) {
        console.error("Erreur chargement offres :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  // ➕ Ajouter une offre
  const addOffer = async () => {
    if (!title.trim() || !description.trim()) return;
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const ref = collection(db, "clubs", uid, "offres");

      const newOffer: Offer = {
        title,
        description,
        position,
        team,
        gender,
        ageRange,
        category,
        location,
        publishedAt: new Date().toISOString().split("T")[0],
      };

      const docRef = await addDoc(ref, newOffer);
      setOffers((prev) => [...prev, { ...newOffer, id: docRef.id }]);
      setModalVisible(false);

      // Reset form
      setTitle("");
      setDescription("");
      setPosition("");
      setTeam("");
      setAgeRange("");
      setCategory("");
      setLocation("");
    } catch (err) {
      console.error("Erreur ajout offre :", err);
      Alert.alert("Erreur", "Impossible d’ajouter l’offre.");
    } finally {
      setSaving(false);
    }
  };

  // ❌ Supprimer une offre
  const deleteOffer = async (id?: string) => {
    if (!id) return;
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await deleteDoc(doc(db, "clubs", uid, "offres", id));
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Erreur suppression offre :", err);
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

      {/* ➕ Bouton ajouter */}
      <Pressable
        onPress={() => setModalVisible(true)}
        className="m-4 py-3 bg-orange-600 rounded-xl items-center"
      >
        <Text className="text-white font-semibold">+ Créer une offre</Text>
      </Pressable>

      {/* Liste des offres */}
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={offers}
        keyExtractor={(o) => o.id || Math.random().toString()}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-10">
            Aucune offre disponible.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="mb-4">
            <Pressable
              onPress={() =>
                navigation.navigate("OfferDetail", { offer: item })
              }
              className="overflow-hidden rounded-lg bg-gray-800"
              android_ripple={{ color: "#444" }}
            >
              <View className="p-4">
                <Text className="text-xl font-bold text-white mb-1">
                  {item.title}
                </Text>
                <Text className="text-gray-400 mb-2">{item.location}</Text>
                <Text className="text-gray-300 mb-4" numberOfLines={2}>
                  {item.description}
                </Text>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row space-x-2">
                    <Text className="px-3 py-1 bg-blue-600 rounded-full text-white text-xs">
                      {item.category}
                    </Text>
                    <Text className="px-3 py-1 mx-2 bg-green-600 rounded-full text-white text-xs">
                      {item.team}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    {item.publishedAt}
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Bouton supprimer */}
            <Pressable
              onPress={() => deleteOffer(item.id)}
              className="bg-red-600 px-3 py-2 mt-2 rounded-lg self-end"
            >
              <Text className="text-white font-semibold text-sm">
                Supprimer
              </Text>
            </Pressable>
          </View>
        )}
      />

      {/* 🧾 Modal ajout offre */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-gray-900 p-5 rounded-xl w-full max-w-md border border-gray-700">
            <Text className="text-lg text-white font-semibold mb-3">
              Nouvelle offre
            </Text>

            <TextInput
              placeholder="Titre"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 mb-3"
            />

            <TextInput
              placeholder="Description"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 mb-3"
              multiline
            />

            <TextInput
              placeholder="Poste recherché (ex: Meneur)"
              placeholderTextColor="#999"
              value={position}
              onChangeText={setPosition}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 mb-3"
            />

            <TextInput
              placeholder="Équipe concernée (ex: U18)"
              placeholderTextColor="#999"
              value={team}
              onChangeText={setTeam}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 mb-3"
            />

            <TextInput
              placeholder="Tranche d’âge (ex: 18–22 ans)"
              placeholderTextColor="#999"
              value={ageRange}
              onChangeText={setAgeRange}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 mb-3"
            />

            <TextInput
              placeholder="Catégorie (ex: Régional 2)"
              placeholderTextColor="#999"
              value={category}
              onChangeText={setCategory}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 mb-3"
            />

            <TextInput
              placeholder="Ville ou lieu"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 mb-3"
            />

            {/* Boutons */}
            <View className="flex-row justify-end space-x-3 mt-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-2 bg-gray-700 rounded-lg"
              >
                <Text className="text-white">Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!title || saving}
                onPress={addOffer}
                className="px-4 py-2 bg-orange-600 rounded-lg"
              >
                <Text className="text-white font-semibold">
                  {saving ? "Création..." : "Créer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
