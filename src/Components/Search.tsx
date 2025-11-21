import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    StatusBar,
    Pressable,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { db } from '../config/firebaseConfig';
import {
    collection,
    onSnapshot,
    query as fsQuery,
    orderBy,
} from 'firebase/firestore';

type SearchNavProp = NativeStackNavigationProp<RootStackParamList, 'Search'>;

type FirestoreClub = {
    id: string;
    uid?: string;
    name: string;
    logo?: string;        
    city?: string;
    department?: string;
    teams?: string;        
    categories?: string[];  
    email?: string;
    description?: string;
    createdAt?: any;
    updatedAt?: any;
};

export default function Search() {
    const navigation = useNavigation<SearchNavProp>();

    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);

    const [clubs, setClubs] = useState<FirestoreClub[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setErr(null);

        const q = fsQuery(collection(db, 'clubs'), orderBy('name'));
        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: FirestoreClub[] = [];
                snap.forEach((doc) => {
                    const d = doc.data() as any;
                    list.push({
                        id: doc.id,
                        uid: d?.uid,
                        name: (d?.name || '').toString(),
                        logo: d?.logo || '',
                        city: d?.city || '',
                        department: d?.department || '',
                        teams: d?.teams || '',
                        categories: Array.isArray(d?.categories) ? d.categories as string[] : [],
                        email: d?.email || '',
                        description: d?.description || '',
                        createdAt: d?.createdAt,
                        updatedAt: d?.updatedAt,
                    });
                });
                setClubs(list);
                setLoading(false);
            },
            (e) => {
                console.error(e);
                setErr("Impossible de charger les clubs.");
                setLoading(false);
            }
        );

        return () => unsub();
    }, []);

    const allCategories = useMemo(
        () => Array.from(new Set(clubs.flatMap((c) => c.categories || []))).sort(),
        [clubs]
    );
    const allCities = useMemo(
        () => Array.from(new Set(clubs.map((c) => c.city || '').filter(Boolean))).sort(),
        [clubs]
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
        const qLower = query.trim().toLowerCase();
        return clubs.filter((club) => {
            const name = (club.name || '').toLowerCase();
            const city = (club.city || '').toLowerCase();
            const matchesQuery = !qLower || name.includes(qLower) || city.includes(qLower);

            const matchesCategory =
                selectedCategories.length === 0 ||
                (club.categories || []).some((c) => selectedCategories.includes(c));

            const matchesCity =
                selectedCities.length === 0 ||
                (club.city ? selectedCities.includes(club.city) : false);

            return matchesQuery && matchesCategory && matchesCity;
        });
    }, [clubs, query, selectedCategories, selectedCities]);

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
                    <Pressable onPress={() => setShowFilters((v) => !v)} className="px-4">
                        <Ionicons name="filter" size={24} color="#fff" />
                    </Pressable>
                </View>

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

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator />
                        <Text className="text-gray-400 mt-3">Chargement des clubs…</Text>
                    </View>
                ) : err ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-red-400">{err}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
                        ListEmptyComponent={
                            <Text className="text-gray-500 text-center mt-8">
                                Aucun club trouvé
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => navigation.navigate('ProfilClub', { club: item as any })}
                                className="flex-row items-center bg-gray-800 rounded-lg p-4 mb-3"
                            >
                                {item.logo ? (
                                    <Image
                                        source={{ uri: item.logo }}
                                        className="w-16 h-16 rounded-lg mr-4"
                                    />
                                ) : (
                                    <View className="w-16 h-16 rounded-lg mr-4 bg-gray-700 items-center justify-center">
                                        <Ionicons name="image" size={20} color="#bbb" />
                                    </View>
                                )}

                                <View className="flex-1">
                                    <Text className="text-white text-lg font-semibold">
                                        {item.name || 'Club sans nom'}
                                    </Text>
                                    <Text className="text-gray-400">{item.city || '—'}</Text>
                                    <Text className="text-gray-400">
                                        {item.teams ? `Équipes : ${item.teams}` : (item.categories?.length ? `${item.categories.length} catégories` : '—')}
                                    </Text>

                                    <View className="flex-row flex-wrap mt-1">
                                        {(item.categories || []).map((c) => (
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
                )}
            </View>
        </SafeAreaView>
    );
}
