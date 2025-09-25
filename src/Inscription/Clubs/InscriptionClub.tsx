import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
    Image,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    TouchableOpacity,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { Feather } from '@expo/vector-icons';
import { TextInput as RNTextInput } from 'react-native';
// Firebase
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig'; 

type InscriptionClubNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'InscriptionClub'
>;

export default function InscriptionClub() {
    const navigation = useNavigation<InscriptionClubNavProp>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const passwordInputRef = useRef<RNTextInput>(null);

    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isValidPassword = (value: string) => /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(value);

    const trimmedEmail = email.trim().toLowerCase();
    const formValid = isValidEmail(trimmedEmail) && isValidPassword(password);

    const handleContinue = async () => {
        if (!formValid || loading) return;
        setErr(null);
        setLoading(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

            navigation.navigate('InscriptionClubStep2', {
                uid: cred.user.uid,
                email: cred.user.email ?? trimmedEmail,
            });
        } catch (e: any) {
            const code = e?.code || '';
            if (code === 'auth/email-already-in-use') setErr("Cet e-mail est déjà utilisé.");
            else if (code === 'auth/invalid-email') setErr("E-mail invalide.");
            else if (code === 'auth/weak-password') setErr("Mot de passe trop faible.");
            else if (code === 'auth/operation-not-allowed') setErr("Méthode d'auth désactivée dans Firebase.");
            else setErr("Erreur d'inscription. Réessaie.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../../assets/background2.jpg')}
            resizeMode="cover"
            className="flex-1"
            imageStyle={{ opacity: 1 }}
        >
            <SafeAreaView className="flex-1 bg-black/50">
                <StatusBar barStyle="light-content" />
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 px-6"
                    >
                        {/* Header */}
                        <View className="flex-row items-center mt-4 mb-8">
                            <Pressable onPress={() => navigation.goBack()}>
                                <Image
                                    source={require('../../../assets/arrow-left.png')}
                                    className="w-9 h-9"
                                    resizeMode="contain"
                                />
                            </Pressable>
                            <Text className="text-white text-xl ml-3">Inscription club</Text>
                        </View>

                        {/* Formulaire */}
                        <View className="flex-1 justify-center items-center px-4">
                            <View className="w-full max-w-md space-y-6">
                                <TextInput
                                    placeholder="E-mail"
                                    placeholderTextColor="#ccc"
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className={`w-full px-4 py-0 rounded-lg h-14 text-white text-lg border-2 mb-2 ${emailFocused ? 'border-orange-500' : 'border-gray-500'
                                        }`}
                                />

                                <View
                                    className={`w-full flex-row items-center border-2 rounded-lg px-4 py-3 ${passwordFocused ? 'border-orange-500' : 'border-gray-500'
                                        }`}
                                >
                                    <TextInput
                                        ref={passwordInputRef}
                                        placeholder="Mot de passe"
                                        placeholderTextColor="#ccc"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        className="flex-1 text-white text-base py-0 text-lg"
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                    />
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowPassword((prev) => !prev);
                                            setTimeout(() => passwordInputRef.current?.focus(), 0);
                                        }}
                                        className="ml-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        disabled={loading}
                                    >
                                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#ccc" />
                                    </TouchableOpacity>
                                </View>

                                {err ? <Text className="text-red-400 mt-2">{err}</Text> : null}
                            </View>

                            <View className="w-full max-w-md mt-6">
                                <Pressable
                                    disabled={!formValid || loading}
                                    onPress={handleContinue}
                                    className={`py-4 rounded-xl items-center w-full ${formValid ? 'bg-orange-500' : 'bg-gray-600'
                                        } ${loading ? 'opacity-70' : ''}`}
                                >
                                    <Text className="text-white font-bold text-base">
                                        {loading ? '...' : 'Continuer'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </ImageBackground>
    );
}
