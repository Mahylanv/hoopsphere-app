import React from 'react';
import { ImageBackground, SafeAreaView, View, Text, TextInput, Pressable, StatusBar, ScrollView } from 'react-native';

export default function InscriptionClub() {
    return (
        <ImageBackground
            source={require('../assets/background.jpg')}
            className="absolute inset-0 w-full h-full"
            imageStyle={{ opacity: 0.6 }}
            resizeMode="cover"
        >
            <SafeAreaView className="flex-1 px-8">
                <StatusBar barStyle="light-content" translucent />
                <ScrollView contentContainerStyle={{ paddingVertical: 40 }} className="space-y-6">
                    <View className="bg-white/90 rounded-2xl p-6 space-y-4">
                        <Text className="text-2xl font-bold text-center">Inscription Club</Text>

                        <TextInput
                            placeholder="Nom du club"
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        />
                        <TextInput
                            placeholder="Ville"
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        />
                        <TextInput
                            placeholder="Nombre d’équipes"
                            keyboardType="numeric"
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        />

                        <Pressable className="bg-orange-500 py-3 rounded-2xl items-center">
                            <Text className="text-white font-bold">Valider</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}
