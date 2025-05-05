import React, { useState } from 'react';
import {
    ImageBackground,
    SafeAreaView,
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
    Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { RootStackParamList } from '../types';

type InscriptionStep1NavProp = NativeStackNavigationProp<
    RootStackParamList,
    'InscriptionJoueurStep1'
>;

export default function InscriptionJoueurStep1() {
    const navigation = useNavigation<InscriptionStep1NavProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!email || !password) return;

        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigation.navigate('InscriptionJoueurStep2', { email, password });
        } catch (err: any) {
            Alert.alert('Erreur', err.message);
        } finally {
            setLoading(false);
        }
    };

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
                        Étape 1 : Identifiants
                    </Text>

                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    />

                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mot de passe"
                        secureTextEntry
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    />

                    <Pressable
                        className={`${!email || !password || loading
                                ? 'bg-gray-300'
                                : 'bg-orange-500'
                            } py-3 rounded-2xl items-center`}
                        onPress={handleContinue}
                        disabled={!email || !password || loading}
                    >
                        <Text className="text-white font-bold">
                            {loading ? 'Chargement...' : 'Continuer'}
                        </Text>
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
