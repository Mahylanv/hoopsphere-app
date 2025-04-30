// screens/InscriptionJoueurStep2.tsx
import React, { useState } from 'react';
import {
    ImageBackground,
    SafeAreaView,
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
    ScrollView,
    Alert,
} from 'react-native';
import {
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
    RouteProp,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import { RootStackParamList } from '../types';

type Route2Prop = RouteProp<
    RootStackParamList,
    'InscriptionJoueurStep2'
>;
type Nav2Prop = NativeStackNavigationProp<
    RootStackParamList,
    'InscriptionJoueurStep2'
>;

export default function InscriptionJoueurStep2() {
    const { params } = useRoute<Route2Prop>();
    const navigation = useNavigation<Nav2Prop>();
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [dob, setDob] = useState('');

    const handleContinue = () => {
        if (!nom || !prenom || !dob) {
            return; // bouton désactivé normalement
        }

        // passe à l’étape 3 en gardant email & password
        navigation.navigate('InscriptionJoueurStep3', {
            email: params.email,
            password: params.password,
            nom,
            prenom,
            dob,
        });
    };

    return (
        <ImageBackground
            source={require('../assets/background.jpg')}
            className="absolute inset-0 w-full h-full"
            imageStyle={{ opacity: 0.6 }}
            resizeMode="cover"
        >
            <SafeAreaView className="flex-1 px-8">
                <StatusBar barStyle="light-content" translucent />
                <ScrollView
                    contentContainerStyle={{ paddingVertical: 40 }}
                    className="space-y-6"
                >
                    <View className="bg-white/90 rounded-2xl p-6 space-y-4">
                        <Text className="text-2xl font-bold text-center">
                            Étape 2 : Identité
                        </Text>

                        <TextInput
                            value={nom}
                            onChangeText={setNom}
                            placeholder="Nom"
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        />
                        <TextInput
                            value={prenom}
                            onChangeText={setPrenom}
                            placeholder="Prénom"
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        />
                        <TextInput
                            value={dob}
                            onChangeText={setDob}
                            placeholder="Date de naissance (JJ/MM/AAAA)"
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        />

                        <Pressable
                            onPress={handleContinue}
                            disabled={!nom || !prenom || !dob}
                            className={`py-3 rounded-2xl items-center ${nom && prenom && dob
                                    ? 'bg-orange-500'
                                    : 'bg-gray-300'
                                }`}
                        >
                            <Text className="text-white font-bold">
                                Continuer
                            </Text>
                        </Pressable>

                        <Pressable
                            className="mt-4 items-center"
                            onPress={() => navigation.goBack()}
                        >
                            <Text className="text-blue-600">Retour</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}
