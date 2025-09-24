import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import clsx from 'clsx';

type ConnexionNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'Connexion'
>;

export default function Connexion() {
    const navigation = useNavigation<ConnexionNavProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const handleLogin = () => {
        if (!email || !password) return;
        setLoading(true);

        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0E0D0D] px-6 justify-center">
            <StatusBar barStyle="light-content" />
            <View className="space-y-6">
                <Text className="text-white text-3xl font-bold text-center mb-4">Connexion</Text>

                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    className={clsx(
                        'border-2 rounded-lg h-14 px-4 text-white text-base mb-5',
                        focusedInput === 'email' ? 'border-orange-500' : 'border-white'
                    )}
                />

                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mot de passe"
                    placeholderTextColor="#999"
                    secureTextEntry
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    className={clsx(
                        'border-2 rounded-lg h-14 px-4 text-white text-base mb-5',
                        focusedInput === 'password' ? 'border-orange-500' : 'border-white'
                    )}
                />

                <Pressable
                    onPress={handleLogin}
                    disabled={!email || !password || loading}
                    className={clsx(
                        'py-4 rounded-2xl items-center',
                        !email || !password || loading
                            ? 'bg-gray-600 opacity-60'
                            : 'bg-orange-500'
                    )}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Connexion…' : 'Se connecter'}
                    </Text>
                </Pressable>

                <Pressable
                    className="items-center mt-2"
                    onPress={() => navigation.goBack()}
                >
                    <Text className="text-white underline">Retour</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
