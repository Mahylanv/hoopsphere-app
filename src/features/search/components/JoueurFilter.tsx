// src/components/JoueurFilter.tsx
// Version PREMIUM avec sections, chips, sliders, filtres complets

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DepartmentSelect from "../../../shared/components/DepartmentSelect";
import Slider from "@react-native-community/slider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

export type JoueurFiltre = {
  poste?: string[];
  departement?: string[];
  genre?: string[];
  main?: string[];
  tailleMin?: number | null;
  tailleMax?: number | null;
  poidsMin?: number | null;
  poidsMax?: number | null;
};

export default function JoueurFilter({
  visible,
  onClose,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: JoueurFiltre) => void;
}) {
  const [poste, setPoste] = useState<string[]>([]);
  const [departement, setDepartement] = useState<string[]>([]);
  const [genre, setGenre] = useState<string[]>([]);
  const [main, setMain] = useState<string[]>([]);
  const [club, setClub] = useState<string[]>([]);

  const [tailleMin, setTailleMin] = useState<number | null>(null);
  const [tailleMax, setTailleMax] = useState<number | null>(null);
  const [poidsMin, setPoidsMin] = useState<number | null>(null);
  const [poidsMax, setPoidsMax] = useState<number | null>(null);

  const resetFilters = () => {
    setPoste([]);
    setDepartement([]);
    setGenre([]);
    setMain([]);
    setTailleMin(null);
    setTailleMax(null);
    setPoidsMin(null);
    setPoidsMax(null);
  };


  const applyFilters = () => {
    onApply({
      poste,
      departement,
      genre,
      main,
      tailleMin,
      tailleMax,
      poidsMin,
      poidsMax,
    });
    onClose();
  };

  const renderChips = (
    title: string,
    values: string[],
    selected: string[],
    onSelect: (val: string[]) => void
  ) => (
    <View className="mb-5">
      <Text className="text-white text-lg font-semibold mb-3">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {values.map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => {
              if (selected.includes(val)) {
                onSelect(selected.filter((s) => s !== val)); // retire l'option
              } else {
                onSelect([...selected, val]); // ajoute l’option
              }
            }}
            className={`px-4 py-2 rounded-2xl ${
              selected.includes(val) ? "bg-orange-500" : "bg-gray-800"
            }`}
          >
            <Text className="text-white">{val}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View className="bg-[#1a1b1f] p-5 rounded-t-3xl max-h-[90%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Filtres</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {renderChips(
              "Poste",
              ["Meneur", "Arrière", "Ailier", "Ailier-Fort", "Pivot"],
              poste,
              setPoste
            )}

            {renderChips(
              "Genre",
              ["Équipe masculine", "Équipe féminine", "Mixte"],
              genre,
              setGenre
            )}

            {renderChips("Main forte", ["Droite", "Gauche"], main, setMain)}

            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Département
              </Text>

              <DepartmentSelect
                value={departement}
                onSelect={setDepartement}
                placeholder="Sélectionner un ou plusieurs départements"
              />
            </View>

            {/* Placeholders for sliders (can be replaced by actual RN sliders) */}
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Taille (cm)
              </Text>
              <Text className="text-gray-400 mb-2">{`${tailleMin ?? 120} cm - ${tailleMax ?? 220} cm`}</Text>
              <Slider
                minimumValue={120}
                maximumValue={220}
                step={1}
                value={tailleMin ?? 150}
                onValueChange={(v) => setTailleMin(v)}
                minimumTrackTintColor="#F97316"
                maximumTrackTintColor="#3a3a3d"
                thumbTintColor="#e47a10ff"
                style={{ height: 40 }}
              />

              <Slider
                minimumValue={120}
                maximumValue={220}
                step={1}
                value={tailleMax ?? 190}
                onValueChange={(v) => setTailleMax(v)}
                minimumTrackTintColor="#F97316"
                maximumTrackTintColor="#3a3a3d"
                thumbTintColor="#e47a10ff"
                style={{ height: 40, marginTop: -10 }}
              />
            </View>

            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Poids (kg)
              </Text>
              <Text className="text-gray-400 mb-2">{`${poidsMin ?? 40} kg - ${poidsMax ?? 130} kg`}</Text>
              <Slider
                minimumValue={40}
                maximumValue={130}
                step={1}
                value={poidsMin ?? 50}
                onValueChange={(v) => setPoidsMin(v)}
                minimumTrackTintColor="#F97316"
                maximumTrackTintColor="#3a3a3d"
                thumbTintColor="#e47a10ff"
                style={{ height: 40 }}
              />

              <Slider
                minimumValue={40}
                maximumValue={130}
                step={1}
                value={poidsMax ?? 90}
                onValueChange={(v) => setPoidsMax(v)}
                minimumTrackTintColor="#F97316"
                maximumTrackTintColor="#3a3a3d"
                thumbTintColor="#e47a10ff"
                style={{ height: 40, marginTop: -10 }}
              />
            </View>
          </ScrollView>

          <View className="flex-row justify-between mt-4">
            <TouchableOpacity
              onPress={resetFilters}
              className="flex-1 bg-gray-700 py-3 rounded-2xl mr-3"
            >
              <Text className="text-center text-white font-semibold">
                Réinitialiser
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={applyFilters}
              className="flex-1 bg-orange-500 py-3 rounded-2xl ml-3"
            >
              <Text className="text-center text-white font-semibold">
                Appliquer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
