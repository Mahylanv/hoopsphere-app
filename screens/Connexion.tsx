import React from 'react';
import { ImageBackground, SafeAreaView, View, Text, TextInput, Pressable, StatusBar } from 'react-native';

export default function Connexion() {
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
                    <Text className="text-2xl font-bold text-center">Connexion</Text>

                    <TextInput
                        placeholder="Email"
                        keyboardType="email-address"
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    />
                    <TextInput
                        placeholder="Mot de passe"
                        secureTextEntry
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    />

                    <Pressable className="bg-blue-600 py-3 rounded-2xl items-center">
                        <Text className="text-white font-bold">Se connecter</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}
