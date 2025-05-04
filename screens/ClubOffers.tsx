import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ClubProfile'>;

const dummyOffers: RootStackParamList['OfferDetail']['offer'][] = [
    {
        id: '1',
        title: 'Recherche Meneur U20',
        description: 'URGENT ! Cherche meneur en U20 homme pour notre club. Contactez-nous si intéressé ici par messages',
        position: 'Meneur',
        team: 'U20 Masculin ',
        publishedAt: '2025-04-20',
        gender: 'Mixte',
        ageRange: '18–20 ans',
        category: 'U20',
        location: 'Moscou',
    },
    {
        id: '2',
        title: 'Recrutement Pivot Senior',
        description: 'Nous recherchons un senior pour remplacer notre ancien pivot parti du club le mois dernier. Demande urgente car nous ne trouvons personne, réponse dans les 24h. Matchs les mardi et jeudi à Paris 18e',
        position: 'Pivot',
        team: 'Seniors',
        publishedAt: '2025-04-18',
        gender: 'Homme',
        ageRange: '25–30 ans',
        category: 'Seniors',
        location: 'Moscou',
    },
];

export default function ClubOffers() {
    const navigation = useNavigation<NavProp>();

    return (
        <FlatList
            contentContainerStyle={{ padding: 16 }}
            data={dummyOffers}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => (
                <Pressable
                    onPress={() =>
                        navigation.navigate('OfferDetail', { offer: item })
                    }
                    className="mb-4 p-4 bg-white rounded-lg shadow"
                >
                    <Text className="text-lg font-semibold mb-1">{item.title}</Text>
                    <Text className="text-gray-600 mb-2">{item.location}</Text>
                    <Pressable className="self-start px-4 py-2 bg-blue-600 rounded">
                        <Text className="text-white">Voir détails</Text>
                    </Pressable>
                </Pressable>
            )}
            ListEmptyComponent={
                <Text className="text-center mt-10">Aucune offre</Text>
            }
        />
    );
}
