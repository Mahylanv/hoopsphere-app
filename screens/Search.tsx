import React, { useState, useMemo } from 'react';
import {
    SafeAreaView,
    View,
    TextInput,
    FlatList,
    Text,
    StatusBar,
    Pressable,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Club } from '../types';

const ALL_CLUBS: Club[] = [
    {
        id: '1',
        name: 'CSP Limoges',
        logo: require('../assets/csp.png'),
        city: 'Limoges',
        teams: 5,
        categories: ['U20', 'U18', 'U16'],
    },
    {
        id: '2',
        name: 'Paris Basket',
        logo: require('../assets/paris.png'),
        city: 'Paris',
        teams: 8,
        categories: ['U16', 'U14', 'U20', 'Seniors'],
    },
    {
        id: '3',
        name: 'CSKA Moscou',
        logo: require('../assets/cska.png'),
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
        () =>
            Array.from(
                new Set(ALL_CLUBS.flatMap((c) => c.categories))
            ),
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

    const filtered = useMemo(() => {
        return ALL_CLUBS.filter((club) => {
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
        });
    }, [query, selectedCategories, selectedCities]);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <View className="p-4">
                {/* Barre de recherche + filtre */}
                <View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Rechercher un club..."
                        className="flex-1 px-4 py-2"
                    />
                    <Pressable
                        onPress={() => setShowFilters((v) => !v)}
                        className="px-4"
                    >
                        <Ionicons name="filter" size={24} color="#4B5563" />
                    </Pressable>
                </View>

                {/* Panneau de filtres */}
                {showFilters && (
                    <View className="bg-white p-4 rounded-lg shadow mt-2">
                        <Text className="font-bold mb-2">Filtres</Text>

                        <Text className="font-medium mb-1">Catégories</Text>
                        <View className="flex-row flex-wrap mb-4">
                            {allCategories.map((cat) => (
                                <Pressable
                                    key={cat}
                                    onPress={() => toggleCategory(cat)}
                                    className={`px-3 py-1 mr-2 mb-2 rounded-full border ${selectedCategories.includes(cat)
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-300'
                                        }`}
                                >
                                    <Text
                                        className={
                                            selectedCategories.includes(cat)
                                                ? 'text-white'
                                                : 'text-gray-700'
                                        }
                                    >
                                        {cat}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text className="font-medium mb-1">Ville</Text>
                        <View className="flex-row flex-wrap">
                            {allCities.map((city) => (
                                <Pressable
                                    key={city}
                                    onPress={() => toggleCity(city)}
                                    className={`px-3 py-1 mr-2 mb-2 rounded-full border ${selectedCities.includes(city)
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-300'
                                        }`}
                                >
                                    <Text
                                        className={
                                            selectedCities.includes(city)
                                                ? 'text-white'
                                                : 'text-gray-700'
                                        }
                                    >
                                        {city}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* Liste des clubs */}
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    className="mt-4"
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
                            className="flex-row items-center bg-gray-100 rounded-lg p-4 mb-3"
                        >
                            <Image
                                source={item.logo}
                                className="w-16 h-16 rounded-lg mr-4"
                            />
                            <View className="flex-1">
                                <Text className="text-lg font-semibold">{item.name}</Text>
                                <Text className="text-gray-500">{item.city}</Text>
                                <Text className="text-gray-500">
                                    {item.teams} équipes
                                </Text>
                                <View className="flex-row flex-wrap mt-1">
                                    {item.categories.map((c) => (
                                        <View
                                            key={c}
                                            className="px-2 py-0.5 mr-2 mb-1 bg-gray-200 rounded-full"
                                        >
                                            <Text className="text-xs text-gray-700">{c}</Text>
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
