import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
    Alert,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../lib/firebase';
import { RootStackParamList } from '../../../types';
import { Feather } from '@expo/vector-icons';

type InscriptionStep1NavProp = NativeStackNavigationProp<
    RootStackParamList,
    'InscriptionJoueurStep1'
>;

export default function InscriptionJoueurStep1() {
    const navigation = useNavigation<InscriptionStep1NavProp>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isValidPassword = (pwd: string) => {
        const hasMinLength = pwd.length >= 8;
        const hasUppercase = /[A-Z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        return hasMinLength && hasUppercase && hasNumber;
    };

    const handleContinue = async () => {
        setSubmitted(true);
        if (!isValidEmail(email) || !isValidPassword(password)) return;

        setLoading(true);
        try {
            navigation.navigate('InscriptionJoueurStep2', { email, password });
        } catch (err: any) {
            Alert.alert('Erreur', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0E0D0D' }}>
            <StatusBar barStyle="light-content" translucent />

            {/* ⬅️ Header haut gauche */}
            <View className="px-6 mt-6">
                <Pressable
                    onPress={() => navigation.goBack()}
                    className="flex-row items-center space-x-3"
                >
                    <Image source={require('../../../assets/arrow-left.png')} className="w-9 h-9" />
                    <Text className="text-white text-xl ml-3">Inscription joueur</Text>
                </Pressable>
            </View>

            {/* 🧾 Formulaire centré */}
            <View className="flex-1 justify-center px-6 space-y-4">
                {/* E-mail */}
                <View>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="E-mail"
                        placeholderTextColor="#ccc"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="emailAddress"
                        className="border border-gray-400 rounded-md h-14 px-4 py-0 text-white text-lg"
                    />

                    {submitted && !isValidEmail(email) && (
                        <Text className="text-sm text-red-500 mt-1">
                            Format d'e-mail invalide
                        </Text>
                    )}
                </View>

                {/* Mot de passe */}
                <View className="relative mt-4">
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mot de passe"
                        placeholderTextColor="#ccc"
                        secureTextEntry={!showPassword}
                        className="border border-gray-400 rounded-md h-14 px-4 py-0 text-white pr-10 text-lg"
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-4"
                    >
                        <Feather
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={22}
                            color="#ccc"
                        />
                    </TouchableOpacity>
                </View>

                {/* Règles mot de passe */}
                {(!isValidPassword(password) && submitted) && (
                    <View className="space-y-1">
                        <Text className="text-sm text-red-500">• 8 caractères minimum</Text>
                        <Text className="text-sm text-red-500">• 1 majuscule</Text>
                        <Text className="text-sm text-red-500">• 1 chiffre</Text>
                    </View>
                )}

                {/* Bouton Continuer */}
                <Pressable
                    onPress={handleContinue}
                    disabled={loading}
                    className={`py-4 rounded-2xl items-center mt-4 ${!isValidEmail(email) || !isValidPassword(password)
                            ? 'bg-gray-600 opacity-60'
                            : 'bg-orange-500'
                        }`}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Chargement...' : 'Continuer'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
