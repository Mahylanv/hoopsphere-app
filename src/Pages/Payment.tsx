import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StatusBar,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type PaymentNavProp = NativeStackNavigationProp<RootStackParamList, 'Payment'>;

const FEATURES = [
    'Badge certifié',
    'Trophées de récompenses spéciaux',
    'Filtres avancés',
    'Meilleur référecement & apparaition dans le classement de la semaine',
    'Suppresion des publicités',
    'Nombre illimité de publication de vidéos',
    'Suivi des statistiques amélioré',
    'Alertes personnalisées',
    'Savoir qui me consulte'
];

export default function Payment() {
    const navigation = useNavigation<PaymentNavProp>();

    const handleSubscribe = () => {
        // TODO : lancer ta flow de paiement (Stripe, In-App Purchase…)
        // pour l’exemple on fait juste un retour
        navigation.goBack();
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-6 items-center">
                    <Text className="text-3xl text-gray-200 font-bold">Pass Pro Annuel</Text>
                    <Text className="text-gray-200 mt-1">4,99 € / an</Text>
                </View>

                {/* Liste des fonctionnalités */}
                <View className="mb-8">
                    {FEATURES.map((feat) => (
                        <View
                            key={feat}
                            className="flex-row items-center mb-4 bg-gray-800 rounded-lg px-4 py-3"
                        >
                            <Ionicons
                                name="checkmark-circle"
                                size={24}
                                color="#10B981"
                                className="mr-3"
                            />
                            <Text className="flex-1 text-white text-base">{feat}</Text>
                        </View>
                    ))}
                </View>

                <Pressable
                    onPress={handleSubscribe}
                    className="bg-green-600 rounded-full py-4 items-center shadow-lg"
                >
                    <Text className="text-white text-lg font-bold">Je m’abonne</Text>
                </Pressable>

                {/* Lien retour */}
                <Pressable
                    onPress={() => navigation.goBack()}
                    className="mt-4 items-center"
                >
                    <Text className="text-blue-600">← Retour</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
