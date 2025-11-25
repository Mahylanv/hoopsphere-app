import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DepartmentSelect from "../Components/DepartmentSelect";

export type ClubFiltre = {
    categories?: string[];
    departments?: string[];
    teamKinds?: string[]; // ["Masculines", "Féminines", "Les deux"]
};

export default function ClubFilter({
    visible,
    onClose,
    onApply,
    allCategories,
    initial,
}: {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: ClubFiltre) => void;
    allCategories: string[];
    initial?: ClubFiltre;
}) {
    const [categories, setCategories] = useState<string[]>(initial?.categories ?? []);
    const [departments, setDepartments] = useState<string[]>(initial?.departments ?? []);
    const [teamKinds, setTeamKinds] = useState<string[]>(initial?.teamKinds ?? []);

    useEffect(() => {
        if (!visible) return;
        setCategories(initial?.categories ?? []);
        setDepartments(initial?.departments ?? []);
        setTeamKinds(initial?.teamKinds ?? []);
    }, [visible]);

    const resetFilters = () => {
        setCategories([]);
        setDepartments([]);
        setTeamKinds([]);
    };

    const applyFilters = () => {
        onApply({ categories, departments, teamKinds });
        onClose();
    };

    const toggleIn = (list: string[], setList: (n: string[]) => void, val: string) => {
        setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
    };

    const renderChips = (
        title: string,
        values: string[],
        selected: string[],
        onToggle: (val: string) => void,
        colorClass = "bg-gray-800",
        activeClass = "bg-orange-500"
    ) => (
        <View className="mb-5">
            <Text className="text-white text-lg font-semibold mb-3">{title}</Text>
            <View className="flex-row flex-wrap gap-2">
                {values.map((val) => {
                    const active = selected.includes(val);
                    return (
                        <TouchableOpacity
                            key={val}
                            onPress={() => onToggle(val)}
                            className={`px-4 py-2 rounded-2xl ${active ? activeClass : colorClass}`}
                        >
                            <Text className="text-white">{val}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                <View className="bg-[#1a1b1f] p-5 rounded-t-3xl max-h-[90%] border-t border-gray-800">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-xl font-bold">Filtres</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Catégories */}
                        {renderChips(
                            "Catégories",
                            allCategories,
                            categories,
                            (val) => toggleIn(categories, setCategories, val)
                        )}

                        {/* Équipes (nouveau) */}
                        {renderChips(
                            "Équipes",
                            ["Masculines", "Féminines", "Les deux"],
                            teamKinds,
                            (val) => toggleIn(teamKinds, setTeamKinds, val),
                            "bg-gray-800",
                            "bg-blue-600"
                        )}

                        {/* Départements */}
                        <View className="mb-6">
                            <Text className="text-white text-lg font-semibold mb-3">Départements</Text>
                            <DepartmentSelect
                                value={departments}
                                onSelect={setDepartments}
                                placeholder="Sélectionner un ou plusieurs départements"
                            />
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View className="flex-row justify-between mt-4">
                        <TouchableOpacity onPress={resetFilters} className="flex-1 bg-gray-700 py-3 rounded-2xl mr-3">
                            <Text className="text-center text-white font-semibold">Réinitialiser</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={applyFilters} className="flex-1 bg-orange-500 py-3 rounded-2xl ml-3">
                            <Text className="text-center text-white font-semibold">Appliquer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
