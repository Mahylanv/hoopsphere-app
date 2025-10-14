import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    Image,
    StatusBar,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList, Club } from '../../types';

type ClubProfileRouteProp = RouteProp<RootStackParamList, 'ClubProfile'>;

type Team = {
    id: string;
    label: string;
};

const TEAMS: Team[] = [
    { id: 'u18f', label: 'U18 Féminin (Régional 3)' },
    { id: 'u20m', label: 'U20 Masculin (Régionale 2)' },
    { id: 'seniors', label: 'Seniors (Départementale 2)' },
];

const DETAILS: Record<
    string,
    {
        roster: { name: string; role: string }[];
        results: {
            opponent: string;
            opponentLogo: any;
            score: string;
            win: boolean;
        }[];
    }
> = {
    u18f: {
        roster: [
            { name: 'Alice Martin', role: 'Meneuse' },
            { name: 'Solene Bilou', role: 'Pivot' },
            { name: 'Emma Grosse', role: 'Aillier' },
            { name: 'Julie Dupont', role: 'Aillier Fort' },
            { name: 'Camille Durand', role: 'Arrière' },
        ],
        results: [
            {
                opponent: 'Paris Basket',
                opponentLogo: require('../../../assets/paris.png'),
                score: '45–60',
                win: false,
            },
            {
                opponent: 'Monaco',
                opponentLogo: require('../../../assets/monaco.png'),
                score: '55–50',
                win: true,
            },
        ],
    },
    u20m: {
        roster: [
            { name: 'Antoine Mahymain', role: 'Meneur' },
            { name: 'Lucas Bernard', role: 'Ailier' },
            { name: 'Romain Petit', role: 'Pivot' },
            { name: 'Florent Balou', role: 'Aillier Fort' },
            { name: 'Luca Delazi', role: 'Arrière' },
        ],
        results: [
            {
                opponent: 'CSP Limoges',
                opponentLogo: require('../../../assets/csp.png'),
                score: '70–68',
                win: true,
            },
            {
                opponent: 'CSKA Moscou',
                opponentLogo: require('../../../assets/paris.png'),
                score: '82–79',
                win: true,
            },
        ],
    },
    seniors: {
        roster: [
            { name: 'Thomas Lefevre', role: 'Ailier Fort' },
            { name: 'Martin Roux', role: 'Arrière' },
            { name: 'Helio Kroos', role: 'Meneur' },
            { name: 'Cedric Cederick', role: 'Ailier' },
            { name: 'Pierre Noel', role: 'Pivot' },
        ],
        results: [
            {
                opponent: 'CSP Limoges',
                opponentLogo: require('../../../assets/monaco.png'),
                score: '90–92',
                win: false,
            },
            {
                opponent: 'Paris Basket',
                opponentLogo: require('../../../assets/paris.png'),
                score: '88–82',
                win: true,
            },
        ],
    },
};

export default function ClubTeams() {
    const { club } = useRoute<ClubProfileRouteProp>().params as { club: Club };
    const [expanded, setExpanded] = useState<string | null>(null);

    const toggle = (id: string) =>
        setExpanded(prev => (prev === id ? null : id));

    return (
        <View className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" />
            <FlatList
                contentContainerStyle={{ padding: 16 }}
                data={TEAMS}
                keyExtractor={t => t.id}
                renderItem={({ item }) => {
                    const isOpen = expanded === item.id;
                    const details = DETAILS[item.id];
                    if (!details) return null;

                    return (
                        <View className="mb-6 rounded-lg overflow-hidden border border-gray-700">
                            <Pressable
                                onPress={() => toggle(item.id)}
                                className="px-4 py-3 flex-row items-center justify-between bg-gray-800"
                            >
                                <View className="flex-row items-center">
                                    <Image
                                        source={club.logo}
                                        className="w-10 h-10 rounded-full mr-3 border border-gray-600"
                                    />
                                    <Text className="text-lg font-semibold text-white">
                                        {item.label}
                                    </Text>
                                </View>
                                <Text className="text-white text-2xl font-bold">
                                    {isOpen ? '−' : '+'}
                                </Text>
                            </Pressable>

                            {/* Contenu dépliable */}
                            {isOpen && (
                                <View className="px-4 py-3 bg-gray-800">
                                    {/* Effectif */}
                                    <Text className="text-md font-semibold text-white mb-2">
                                        Effectif
                                    </Text>
                                    {details.roster.map(player => (
                                        <Text
                                            key={player.name}
                                            className="ml-2 mb-1 text-gray-300"
                                        >
                                            • {player.name} —{' '}
                                            <Text className="font-medium text-gray-100">
                                                {player.role}
                                            </Text>
                                        </Text>
                                    ))}

                                    {/* Historique */}
                                    <Text className="text-md font-semibold text-white mt-4 mb-2">
                                        Derniers résultats
                                    </Text>
                                    {details.results.map((r, idx) => (
                                        <View
                                            key={idx}
                                            className="flex-row items-center mb-2"
                                        >
                                            <View className="items-center">
                                                <Image
                                                    source={club.logo}
                                                    className="w-8 h-8 rounded-full border border-gray-600"
                                                />
                                                <Text className="text-xs text-gray-400">
                                                    {club.name}
                                                </Text>
                                            </View>

                                            <Text className="mx-2 font-medium text-gray-200">vs</Text>

                                            <View className="items-center">
                                                <Image
                                                    source={r.opponentLogo}
                                                    className="w-8 h-8 rounded-full border border-gray-600"
                                                />
                                                <Text className="text-xs text-gray-400">
                                                    {r.opponent}
                                                </Text>
                                            </View>

                                            <Text
                                                className={`ml-auto font-bold ${r.win ? 'text-green-400' : 'text-red-400'
                                                    }`}
                                            >
                                                {r.score}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <Text className="text-center mt-10 text-gray-400">
                        Aucune équipe.
                    </Text>
                }
            />
        </View>
    );
}
