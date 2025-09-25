import React, { useState, useMemo } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    StatusBar,
    Pressable,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Club } from '../../types';

const ALL_CLUBS: Club[] = [
    {
        id: '1',
        name: 'CSP Limoges',
        logo: require('../../assets/csp.png'),
        city: 'Limoges',
        teams: 5,
        categories: ['U20', 'U18', 'U16'],
    },
    {
        id: '2',
        name: 'Paris Basket',
        logo: require('../../assets/paris.png'),
        city: 'Paris',
        teams: 8,
        categories: ['U16', 'U14', 'U20', 'Seniors'],
    },
    {
        id: '3',
        name: 'CSKA Moscou',
        logo: require('../../assets/cska.png'),
        city: 'Moscou',
        teams: 3,
        categories: ['Seniors', 'U20', 'U18'],
    },
];

type SearchNavProp = NativeStackNavigationProp<RootStackParamList, 'Search'>;

export default function Search() {
    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const navigation = useNavigation<SearchNavProp>();

    const allCategories = useMemo(
        () => Array.from(new Set(ALL_CLUBS.flatMap((c) => c.categories))),
        []
    );
    const allCities = useMemo(
        () => Array.from(new Set(ALL_CLUBS.map((c) => c.city))),
        []
    );

    const toggleCategory = (cat: string) =>
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    const toggleCity = (city: string) =>
        setSelectedCities((prev) =>
            prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
        );

    const filtered = useMemo(
        () =>
            ALL_CLUBS.filter((club) => {
                const matchesQuery =
                    club.name.toLowerCase().includes(query.toLowerCase()) ||
                    club.city.toLowerCase().includes(query.toLowerCase());
                const matchesCategory =
                    selectedCategories.length === 0 ||
                    club.categories.some((c) => selectedCategories.includes(c));
                const matchesCity =
                    selectedCities.length === 0 ||
                    selectedCities.includes(club.city);
                return matchesQuery && matchesCategory && matchesCity;
            }),
        [query, selectedCategories, selectedCities]
    );

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <View className="p-4 flex-1">
                <View className="flex-row items-center border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Rechercher un club..."
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 px-4 py-2 text-white"
                    />
                    <Pressable
                        onPress={() => setShowFilters((v) => !v)}
                        className="px-4"
                    >
                        <Ionicons name="filter" size={24} color="#fff" />
                    </Pressable>
                </View>

                {/* Panneau de filtres */}
                {showFilters && (
                    <View className="bg-gray-800 p-4 rounded-lg shadow mt-2">
                        <Text className="text-white font-bold mb-2">Filtres</Text>

                        <Text className="text-gray-200 font-medium mb-1">Catégories</Text>
                        <View className="flex-row flex-wrap mb-4">
                            {allCategories.map((cat) => {
                                const selected = selectedCategories.includes(cat);
                                return (
                                    <Pressable
                                        key={cat}
                                        onPress={() => toggleCategory(cat)}
                                        className={`px-3 py-1 mr-2 mb-2 rounded-full border ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                                            }`}
                                    >
                                        <Text className={selected ? 'text-white' : 'text-gray-300'}>
                                            {cat}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Text className="text-gray-200 font-medium mb-1">Ville</Text>
                        <View className="flex-row flex-wrap">
                            {allCities.map((city) => {
                                const selected = selectedCities.includes(city);
                                return (
                                    <Pressable
                                        key={city}
                                        onPress={() => toggleCity(city)}
                                        className={`px-3 py-1 mr-2 mb-2 rounded-full border ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                                            }`}
                                    >
                                        <Text className={selected ? 'text-white' : 'text-gray-300'}>
                                            {city}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                )}

                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingTop: 16 }}
                    ListEmptyComponent={
                        <Text className="text-gray-500 text-center mt-8">
                            Aucun club trouvé
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() =>
                                navigation.navigate('ClubProfile', { club: item })
                            }
                            className="flex-row items-center bg-gray-800 rounded-lg p-4 mb-3"
                        >
                            <Image
                                source={item.logo}
                                className="w-16 h-16 rounded-lg mr-4"
                            />
                            <View className="flex-1">
                                <Text className="text-white text-lg font-semibold">
                                    {item.name}
                                </Text>
                                <Text className="text-gray-400">{item.city}</Text>
                                <Text className="text-gray-400">
                                    {item.teams} équipes
                                </Text>
                                <View className="flex-row flex-wrap mt-1">
                                    {item.categories.map((c) => (
                                        <View
                                            key={c}
                                            className="px-2 py-0.5 mr-2 mb-1 bg-gray-700 rounded-full"
                                        >
                                            <Text className="text-xs text-gray-300">{c}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </Pressable>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}
