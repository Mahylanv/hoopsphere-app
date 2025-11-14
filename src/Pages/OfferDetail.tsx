import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StatusBar,
    ScrollView,
    Pressable,
    Animated,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type OfferDetailRouteProp = RouteProp<RootStackParamList, 'OfferDetail'>;

export default function OfferDetail() {
    const { offer } = useRoute<OfferDetailRouteProp>().params;

    const [applied, setApplied] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const iconScale = useRef(new Animated.Value(0)).current;

    const handleApply = () => {
        if (applied) return;

        // petit rebond du bouton
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 0.9,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // anime l’icône check
            Animated.spring(iconScale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();
            setApplied(true);
            // Alert.alert('Candidature envoyée', 'Votre candidature a bien été prise en compte !');
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-white mb-1">{offer.title}</Text>
                    <Text className="text-gray-400">Publié le {offer.publishedAt}</Text>
                </View>

                {[
                    { label: 'Poste recherché', value: offer.position },
                    { label: 'Équipe', value: offer.team },
                    { label: 'Description', value: offer.description },
                ].map(({ label, value }) => (
                    <View
                        key={label}
                        className="bg-gray-800 rounded-lg p-4 mb-4 shadow"
                    >
                        <Text className="font-semibold text-gray-200 mb-1">{label}</Text>
                        <Text className="text-gray-100">{value}</Text>
                    </View>
                ))}

                {/* Grille 2 colonnes */}
                <View className="flex-row flex-wrap -mx-2 mb-6">
                    {[
                        { label: 'Catégorie', value: offer.category },
                        { label: 'Âge', value: offer.ageRange },
                        { label: 'Sexe', value: offer.gender },
                        { label: 'Lieu', value: offer.location },
                    ].map(({ label, value }) => (
                        <View key={label} className="w-1/2 px-2 mb-4">
                            <View className="bg-gray-800 rounded-lg p-4 shadow">
                                <Text className="font-semibold text-gray-200 mb-1">{label}</Text>
                                <Text className="text-gray-100">{value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Pressable
                        onPress={handleApply}
                        disabled={applied}
                        className="bg-blue-600 rounded-full py-4 items-center shadow-lg"
                    >
                        {applied ? (
                            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                                <Ionicons name="checkmark" size={28} color="white" />
                            </Animated.View>
                        ) : (
                            <Text className="text-white text-lg font-bold">Postuler</Text>
                        )}
                    </Pressable>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}
