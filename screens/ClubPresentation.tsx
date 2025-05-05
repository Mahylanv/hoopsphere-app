// screens/ClubPresentation.tsx
import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type ClubProfileRouteProp = RouteProp<RootStackParamList, 'ClubProfile'>;

export default function ClubPresentation() {
    const { club } = useRoute<ClubProfileRouteProp>().params;

    return (
        <ScrollView className="flex-1 bg-gray-900 p-4">
            <StatusBar barStyle="light-content" />

            {/* Nom et info principales */}
            <Text className="text-2xl font-bold mb-2 text-white">{club.name}</Text>
            <Text className="text-gray-400 mb-4">
                {club.city} — {club.teams} équipes
            </Text>

            {/* Description */}
            <Text className="text-gray-300 mb-4">
                Le {club.name} est un club historique fondé en 1920 qui a su par ses fans devenir un des clubs les plus populaires de son pays. Aujourd'hui le {club.name} est leader de son championnat et continue à porgresser vers l'élite. 
            </Text>

            {/* Catégories */}
            <Text className="text-white font-semibold mb-2">Catégories</Text>
            <View className="flex-row flex-wrap">
                {club.categories.map((c) => (
                    <View
                        key={c}
                        className="px-3 py-1 mr-2 mb-2 bg-gray-800 rounded-full"
                    >
                        <Text className="text-sm text-gray-300">{c}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
