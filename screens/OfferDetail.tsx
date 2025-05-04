import React, { useRef } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
    ScrollView,
    Pressable,
    Animated,
    Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type OfferDetailRouteProp = RouteProp<RootStackParamList, 'OfferDetail'>;

export default function OfferDetail() {
    const { offer } = useRoute<OfferDetailRouteProp>().params;

    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const handleApply = () => {
        Alert.alert('Candidature envoyée', "Votre candidature a bien été prise en compte !");
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-6">
                    <Text className="text-2xl font-bold mb-1">{offer.title}</Text>
                    <Text className="text-gray-500">
                        Publié le {offer.publishedAt}
                    </Text>
                </View>

                <View className="bg-gray-50 rounded-lg p-4 mb-4 shadow">
                    <Text className="font-semibold mb-1">Poste recherché</Text>
                    <Text>{offer.position}</Text>
                </View>

                <View className="bg-gray-50 rounded-lg p-4 mb-4 shadow">
                    <Text className="font-semibold mb-1">Équipe</Text>
                    <Text>{offer.team}</Text>
                </View>

                <View className="bg-gray-50 rounded-lg p-4 mb-4 shadow">
                    <Text className="font-semibold mb-1">Description</Text>
                    <Text>{offer.description}</Text>
                </View>

                <View className="grid grid-cols-2 gap-4 mb-4">
                    <View className="bg-gray-50 rounded-lg p-4 shadow">
                        <Text className="font-semibold mb-1">Catégorie</Text>
                        <Text>{offer.category}</Text>
                    </View>
                    <View className="bg-gray-50 rounded-lg p-4 shadow">
                        <Text className="font-semibold mb-1">Âge</Text>
                        <Text>{offer.ageRange}</Text>
                    </View>
                    <View className="bg-gray-50 rounded-lg p-4 shadow">
                        <Text className="font-semibold mb-1">Sexe</Text>
                        <Text>{offer.gender}</Text>
                    </View>
                    <View className="bg-gray-50 rounded-lg p-4 shadow">
                        <Text className="font-semibold mb-1">Lieu</Text>
                        <Text>{offer.location}</Text>
                    </View>
                </View>

                <Animated.View
                    style={{ transform: [{ scale: scaleAnim }] }}
                    className="mt-6"
                >
                    <Pressable
                        onPress={handleApply}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        className="bg-blue-600 rounded-full py-4 items-center shadow-lg"
                    >
                        <Text className="text-white text-lg font-bold">Postuler</Text>
                    </Pressable>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}
