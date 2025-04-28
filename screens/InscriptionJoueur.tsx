import React from 'react';
import { ImageBackground, SafeAreaView, View, Text, TextInput, Pressable, StatusBar } from 'react-native';

export default function InscriptionJoueur() {
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
                    <Text className="text-2xl font-bold text-center">Inscription Joueur</Text>

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

                    <Pressable className="bg-orange-500 py-3 rounded-2xl items-center">
                        <Text className="text-white font-bold">Valider</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}
