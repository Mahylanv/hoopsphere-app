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
import { useNavigation } from '@react-navigation/native';
import {
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { RootStackParamList } from '../types';

type ConnexionNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'Connexion'
>;

export default function Connexion() {
    const navigation = useNavigation<ConnexionNavProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return;

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);

            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (err: any) {
            Alert.alert('Erreur de connexion', err.message);
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
                        Connexion
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
                        onPress={handleLogin}
                        disabled={!email || !password || loading}
                        className={`py-3 rounded-2xl items-center ${!email || !password || loading
                                ? 'bg-gray-300'
                                : 'bg-blue-600'
                            }`}
                    >
                        <Text className="text-white font-bold">
                            {loading ? 'Connexion…' : 'Se connecter'}
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
