import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type ClubProfileRouteProp = RouteProp<RootStackParamList, 'ClubProfile'>;

export default function ClubPresentation() {
    const { club } = useRoute<ClubProfileRouteProp>().params;

    return (
        <ScrollView className="p-4 bg-white">
            <Text className="text-2xl font-bold mb-2">{club.name}</Text>
            <Text className="text-gray-600 mb-4">
                {club.city} — {club.teams} équipes
            </Text>
            <Text className="mb-4">
                Le {club.name} est un club historique fondé en 1920...
            </Text>

            <Text className="font-semibold mb-1">Catégories</Text>
            <View className="flex-row flex-wrap">
                {club.categories.map((c) => (
                    <View
                        key={c}
                        className="px-3 py-1 mr-2 mb-2 bg-gray-200 rounded-full"
                    >
                        <Text className="text-sm text-gray-700">{c}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
