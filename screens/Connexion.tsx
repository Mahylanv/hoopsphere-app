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

type ConnexionNavProp = NativeStackNavigationProp<RootStackParamList, 'Connexion'>;

export default function Connexion() {
    const navigation = useNavigation<ConnexionNavProp>();

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

                    {/* navigation.navigate n’accepte plus l’erreur “never” */}
                    <Pressable
                        className="bg-blue-600 py-3 rounded-2xl items-center"
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text className="text-white font-bold">Se connecter</Text>
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
