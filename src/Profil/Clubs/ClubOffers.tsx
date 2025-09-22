// screens/ClubOffers.tsx
import React from 'react';
import { View, Text, FlatList, Pressable, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ClubProfile'>;

// Dummy data typé depuis RootStackParamList
const dummyOffers: RootStackParamList['OfferDetail']['offer'][] = [
    {
        id: '1',
        title: 'Recherche Meneur U20',
        description:
            'URGENT ! Cherche meneur U20 homme pour renforcer notre rotation. Matchs mardi et jeudi.',
        position: 'Meneur',
        team: 'U20 Masculin',
        publishedAt: '2025-04-20',
        gender: 'Mixte',
        ageRange: '18–20 ans',
        category: 'U20',
        location: 'Moscou',
    },
    {
        id: '2',
        title: 'Recrutement Pivot Senior',
        description:
            'Nous recherchons un pivot senior pour remplacer notre ancien titulaire. Salaire motivant.',
        position: 'Pivot',
        team: 'Seniors',
        publishedAt: '2025-04-18',
        gender: 'Homme',
        ageRange: '25–30 ans',
        category: 'Seniors',
        location: 'Paris 18e',
    },
];

export default function ClubOffers() {
    const navigation = useNavigation<NavProp>();

    return (
        <View className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" />
            <FlatList
                contentContainerStyle={{ padding: 16 }}
                data={dummyOffers}
                keyExtractor={o => o.id}
                ListEmptyComponent={
                    <Text className="text-gray-500 text-center mt-10">
                        Aucune offre
                    </Text>
                }
                renderItem={({ item }) => (
                    <View className="mb-4">
                        <Pressable
                            onPress={() =>
                                navigation.navigate('OfferDetail', { offer: item })
                            }
                            className="overflow-hidden rounded-lg bg-gray-800"
                            android_ripple={{ color: '#444' }}
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
                    </View>
                )}
            />
        </View>
    );
}
