import React from 'react';
import {
    ImageBackground,
    SafeAreaView,
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type InscriptionJoueurNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'InscriptionJoueur'
>;

export default function InscriptionJoueur() {
    const navigation = useNavigation<InscriptionJoueurNavProp>();

    return (
        <ImageBackground
            source={require('../assets/background.jpg')}
            className="absolute inset-0 w-full h-full"
            imageStyle={{ opacity: 0.6 }}
            resizeMode="cover"
        >
            <SafeAreaView className="flex-1 justify-center px-8">
                <StatusBar barStyle="light-content" translucent />

                <View className="bg-white/90 rounded-2xl p-6 space-y-4">
                    <Text className="text-2xl font-bold text-center">
                        Inscription Joueur
                    </Text>

                    <TextInput
                        placeholder="Nom complet"
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    />
                    <TextInput
                        placeholder="Âge"
                        keyboardType="numeric"
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    />
                    <TextInput
                        placeholder="Poste préféré"
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    />

                    <Pressable
                        className="bg-orange-500 py-3 rounded-2xl items-center"
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text className="text-white font-bold">Valider</Text>
                    </Pressable>

                    <Pressable
                        className="mt-4 items-center"
                        onPress={() => navigation.goBack()}
                    >
                        <Text className="text-blue-600">Retour</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}
