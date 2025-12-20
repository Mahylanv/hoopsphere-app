import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../../../types";
import { auth, db } from "../../../../config/firebaseConfig";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";

type ClubProfileRouteProp = RouteProp<RootStackParamList, "ProfilClub">;

export default function ClubPresentation() {
  const { params } = useRoute<ClubProfileRouteProp>();
  // Club passé par la navigation (depuis OfferDetail / Search)
  const routeClub = (params?.club as any) || null;

  // UID du club à afficher (PRIORITÉ : route)
  const displayedUid: string | null =
    routeClub?.uid || routeClub?.id || null;

  // Suis-je le propriétaire de ce club ?
  const isOwner =
    !!auth.currentUser?.uid &&
    !!displayedUid &&
    auth.currentUser!.uid === displayedUid;

  const [club, setClub] = useState<any>(routeClub);
  const [loading, setLoading] = useState(!routeClub);
  const [modalVisible, setModalVisible] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<"description" | "categories" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Charger (ou recharger) le club AFFICHE via displayedUid
  // ClubPresentation.tsx
  useEffect(() => {
    if (!displayedUid) { setLoading(false); return; }

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "clubs", displayedUid),
      (snap) => {
        if (snap.exists()) setClub({ id: snap.id, ...snap.data() });
        setLoading(false);
      },
      (err) => {
        console.error("ClubPresentation onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [displayedUid]);


  // Mise à jour Firestore — seulement si propriétaire
  const updateClubField = async (field: string, value: any) => {
    if (!isOwner) return; // sécurité UI + logique
    try {
      setSaving(true);
      if (!displayedUid) return;
      await updateDoc(doc(db, "clubs", displayedUid), { [field]: value });
      setClub((prev: any) => ({ ...prev, [field]: value }));
      Alert.alert("✅ Succès", "Informations mises à jour !");
    } catch (err) {
      console.error("Erreur update club :", err);
      Alert.alert("Erreur", "Impossible de mettre à jour les informations.");
    } finally {
      setSaving(false);
      setModalVisible(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-300 mt-3">Chargement du profil...</Text>
      </View>
    );
  }

  if (!club) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-gray-300 text-center px-4">
          Aucune donnée trouvée.
        </Text>
      </View>
    );
  }

  // Catégories (tolérant string/array)
  const categoriesList = Array.isArray(club.categories)
    ? club.categories
    : typeof club.categories === "string"
      ? club.categories.split(",").map((c: string) => c.trim()).filter(Boolean)
      : [];

  return (
    <ScrollView className="flex-1 bg-gray-900 p-4">
      <StatusBar barStyle="light-content" />

      {/* === DESCRIPTION === */}
      <View className="mb-6">
        <Text className="text-white font-semibold mb-2">Présentation</Text>
        {club.description ? (
          <Text className="text-gray-300 leading-6">{club.description}</Text>
        ) : (
          <>
            <Text className="text-gray-400 italic">
              Aucune description pour le moment.
            </Text>
            {isOwner && (
              <Pressable
                onPress={() => {
                  setFieldToEdit("description");
                  setInputValue("");
                  setModalVisible(true);
                }}
                className="bg-orange-600 py-2 px-4 rounded-lg mt-2 self-start"
              >
                <Text className="text-white font-semibold">+ Ajouter une description</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* === CATÉGORIES === */}
      <View className="mb-6">
        <Text className="text-white font-semibold mb-2">Catégories</Text>
        {categoriesList.length > 0 ? (
          <View className="flex-row flex-wrap">
            {categoriesList.map((cat: string, index: number) => (
              <View
                key={`${cat}-${index}`}
                className="px-3 py-1 mr-2 mb-2 bg-gray-800 rounded-full border border-gray-700"
              >
                <Text className="text-sm text-gray-300">{cat}</Text>
              </View>
            ))}
          </View>
        ) : (
          <>
            <Text className="text-gray-400 italic">Aucune catégorie renseignée.</Text>
            {isOwner && (
              <Pressable
                onPress={() => {
                  setFieldToEdit("categories");
                  setInputValue("");
                  setModalVisible(true);
                }}
                className="bg-orange-600 py-2 px-4 rounded-lg mt-2 self-start"
              >
                <Text className="text-white font-semibold">
                  + Ajouter des catégories (ex : U15, U17, Seniors)
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* === MODAL D'ÉDITION (seulement propriétaire) === */}
      {isOwner && (
        <Modal visible={modalVisible} transparent animationType="fade">
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <View className="bg-gray-900 p-6 rounded-xl w-full max-w-md border border-gray-700">
              <Text className="text-lg text-white font-semibold mb-3">
                {fieldToEdit === "description" && "Ajouter une description"}
                {fieldToEdit === "categories" && "Ajouter des catégories (séparées par des virgules)"}
              </Text>

              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Saisir ici..."
                placeholderTextColor="#999"
                className="bg-gray-800 text-white rounded-lg px-4 py-3 mb-4"
                multiline={fieldToEdit === "description"}
              />

              <View className="flex-row justify-end">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="px-4 py-2 bg-gray-700 rounded-lg mr-2"
                >
                  <Text className="text-white">Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!inputValue || saving}
                  onPress={() => {
                    let val: any = inputValue.trim();
                    if (fieldToEdit === "categories") {
                      val = val.split(",").map((v: string) => v.trim()).filter(Boolean);
                    }
                    updateClubField(fieldToEdit!, val);
                  }}
                  className="px-4 py-2 bg-orange-600 rounded-lg"
                >
                  <Text className="text-white font-semibold">
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
