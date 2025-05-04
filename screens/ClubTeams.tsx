import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type ClubProfileRouteProp = RouteProp<RootStackParamList, 'ClubProfile'>;

const makeTeams = (clubId: string) => [
    { id: `${clubId}-u18f`, label: 'U18 Féminin (Régional 3)' },
    { id: `${clubId}-u20h`, label: 'U20 Masculin (National 2)' },
];

export default function ClubTeams() {
    const { club } = useRoute<ClubProfileRouteProp>().params;
    const teams = makeTeams(club.id);

    return (
        <FlatList
            contentContainerStyle={{ padding: 16 }}
            data={teams}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
                <View className="mb-4 p-4 bg-white rounded-lg shadow">
                    <Text className="text-lg font-semibold">{item.label}</Text>
                </View>
            )}
            ListEmptyComponent={<Text className="text-center mt-10">Aucune équipe</Text>}
        />
    );
}
