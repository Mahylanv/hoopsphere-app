import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type ClubProfileRouteProp = RouteProp<RootStackParamList, 'ClubProfile'>;

const dummyOffers = [
    { id: '1', title: 'Recherche Meneur U20', desc: 'Contactez-nous si intéressé' },
    { id: '2', title: 'Recrutement Pivot Senior', desc: 'Salaire motivant' },
];

export default function ClubOffers() {

    return (
        <FlatList
            contentContainerStyle={{ padding: 16 }}
            data={dummyOffers}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => (
                <View className="mb-4 p-4 bg-white rounded-lg shadow">
                    <Text className="text-lg font-semibold mb-1">{item.title}</Text>
                    <Text className="text-gray-600 mb-2">{item.desc}</Text>
                    <Pressable className="self-start px-4 py-2 bg-blue-600 rounded">
                        <Text className="text-white">Postuler</Text>
                    </Pressable>
                </View>
            )}
            ListEmptyComponent={<Text className="text-center mt-10">Aucune offre</Text>}
        />
    );
}
