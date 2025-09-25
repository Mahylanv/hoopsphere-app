import React, { useState } from 'react';
import {
    ImageBackground,
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { RootStackParamList } from '../../../types';

type Route3Prop = RouteProp<RootStackParamList, 'InscriptionJoueurStep3'>;
type Nav3Prop = NativeStackNavigationProp<RootStackParamList, 'InscriptionJoueurStep3'>;

export default function InscriptionJoueurStep3() {
    const { params } = useRoute<Route3Prop>();
    const navigation = useNavigation<Nav3Prop>();
    const { email, nom, prenom, dob } = params;

    const [taille, setTaille] = useState('');
    const [poids, setPoids] = useState('');
    const [main, setMain] = useState<'Droite' | 'Gauche'>('Droite');
    const [poste, setPoste] = useState('Meneur');
    const [departement, setDepartement] = useState('01 - Ain');
    const [club, setClub] = useState('Club Fictif A');

    const DEPARTEMENTS = ['01 - Ain', '02 - Aisne' /* … */];
    const POSTES = ['Meneur', 'Arrière', 'Ailier', 'Ailier fort', 'Pivot'];
    const CLUBS = ['Club Fictif A', 'Club Fictif B', 'Club Fictif C'];

    const canFinish = taille.trim() !== '' && poids.trim() !== '';

    const handleFinish = async (forceSave: boolean) => {
        // Vérifier l'authentification
        const user = auth.currentUser;
        if (!user) {
            return Alert.alert('Erreur', 'Utilisateur non authentifié');
        }
        if (!forceSave && !canFinish) {
            return Alert.alert(
                'Champs manquants',
                'Veuillez renseigner la taille et le poids ou cliquer sur "Plus tard".'
            );
        }

        const payload = {
            uid: user.uid,
            email,
            nom,
            prenom,
            dob,
            taille: forceSave ? null : taille,
            poids: forceSave ? null : poids,
            main,
            poste,
            departement,
            club,
        };

        try {
            //Enregistrement BDD
            await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
            Alert.alert('Succès', 'Profil enregistré !');
            navigation.navigate('Home');
        } catch (err: any) {
            Alert.alert('Erreur', err.message);
        }
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
                <ScrollView contentContainerStyle={{ paddingVertical: 40 }} className="space-y-6">
                    <View className="bg-white/90 rounded-2xl p-6 space-y-4">
                        <Text className="text-2xl font-bold text-center">
                            Étape 3 : Caractéristiques
                        </Text>

                        <TextInput
                            value={taille} onChangeText={setTaille}
                            placeholder="Taille (cm)" keyboardType="numeric"
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        />
                        <TextInput
                            value={poids} onChangeText={setPoids}
                            placeholder="Poids (kg)" keyboardType="numeric"
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        />

                        <Text className="font-semibold">Main forte</Text>
                        <Picker selectedValue={main} onValueChange={v => setMain(v as any)}>
                            <Picker.Item label="Droite" value="Droite" />
                            <Picker.Item label="Gauche" value="Gauche" />
                        </Picker>

                        <Text className="font-semibold">Poste</Text>
                        <Picker selectedValue={poste} onValueChange={v => setPoste(v as string)}>
                            {POSTES.map(p => <Picker.Item key={p} label={p} value={p} />)}
                        </Picker>

                        <Text className="font-semibold">Département</Text>
                        <Picker selectedValue={departement} onValueChange={v => setDepartement(v as string)}>
                            {DEPARTEMENTS.map(d => <Picker.Item key={d} label={d} value={d} />)}
                        </Picker>

                        <Text className="font-semibold">Club</Text>
                        <Picker selectedValue={club} onValueChange={v => setClub(v as string)}>
                            {CLUBS.map(c => <Picker.Item key={c} label={c} value={c} />)}
                        </Picker>

                        <Pressable
                            onPress={() => handleFinish(false)}
                            disabled={!canFinish}
                            className={`${canFinish ? 'bg-orange-500' : 'bg-gray-300'} py-3 rounded-2xl items-center`}
                        >
                            <Text className="text-white font-bold">Terminer</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => handleFinish(true)}
                            className="bg-gray-400/70 py-3 rounded-2xl items-center"
                        >
                            <Text className="text-white font-bold">Plus tard</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => navigation.goBack()}
                            className="mt-4 items-center"
                        >
                            <Text className="text-blue-600">Retour</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}
