import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
    TouchableOpacity,
    Image,
    ScrollView,
    Platform,
    Modal,
} from 'react-native';
import {
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    RouteProp,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import { RootStackParamList } from '../../../types';
import DateTimePicker from '@react-native-community/datetimepicker';

type Route2Prop = RouteProp<RootStackParamList, 'InscriptionJoueurStep2'>;
type Nav2Prop = NativeStackNavigationProp<RootStackParamList, 'InscriptionJoueurStep2'>;

export default function InscriptionJoueurStep2() {
    const { params } = useRoute<Route2Prop>();
    const navigation = useNavigation<Nav2Prop>();

    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [dobDate, setDobDate] = useState<Date>(new Date(2005, 0, 1));
    const [dob, setDob] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [genre, setGenre] = useState('');
    const [showGenreModal, setShowGenreModal] = useState(false);

    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const isValid = nom && prenom && dob && genre;

    const handleContinue = () => {
        if (!isValid) return;

        navigation.navigate('InscriptionJoueurStep3', {
            email: params.email,
            password: params.password,
            nom,
            prenom,
            dob,
            genre,
        });
    };

    const formatDate = (date: Date) => {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0E0D0D' }}>
            <StatusBar barStyle="light-content" />

            <View className="flex-row items-center justify-between px-6 mt-10 mb-6">
                {/* Flèche à gauche */}
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image source={require('../../../assets/arrow-left.png')} className="w-9 h-9" />
                </TouchableOpacity>

                {/* Titre centré */}
                <View className="flex-1 items-center ml-9">
                    <Text className="text-white text-3xl font-bold">Tes infos</Text>
                </View>

                {/* Espace à droite pour équilibrer */}
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
                <View>
                    {/* Nom */}
                    <TextInput
                        value={nom}
                        onChangeText={setNom}
                        placeholder="Nom"
                        placeholderTextColor="#999"
                        onFocus={() => setFocusedInput('nom')}
                        onBlur={() => setFocusedInput(null)}
                        style={{
                            borderWidth: 2,
                            borderColor: focusedInput === 'nom' ? '#F97316' : '#9CA3AF', // orange-500 or gray-400
                            borderRadius: 8,
                            height: 56,
                            paddingHorizontal: 16,
                            color: 'white',
                            fontSize: 18,
                            marginBottom: 24,
                        }}
                    />

                    {/* Prénom */}
                    <TextInput
                        value={prenom}
                        onChangeText={setPrenom}
                        placeholder="Prénom"
                        placeholderTextColor="#999"
                        onFocus={() => setFocusedInput('prenom')}
                        onBlur={() => setFocusedInput(null)}
                        style={{
                            borderWidth: 2,
                            borderColor: focusedInput === 'prenom' ? '#F97316' : '#9CA3AF',
                            borderRadius: 8,
                            height: 56,
                            paddingHorizontal: 16,
                            color: 'white',
                            fontSize: 18,
                            marginBottom: 24,
                        }}
                    />

                    {/* Date de naissance */}
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={{
                            borderWidth: 2,
                            borderColor: '#9CA3AF',
                            borderRadius: 8,
                            height: 56,
                            paddingHorizontal: 16,
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                            marginBottom: 24,
                        }}
                    >
                        <Text style={{ fontSize: 18, color: dob ? 'white' : '#999' }}>
                            {dob ? dob : 'Date de naissance (JJ/MM/AAAA)'}
                        </Text>
                    </TouchableOpacity>

                    {/* Modal Date */}
                    <Modal visible={showDatePicker} animationType="slide" transparent>
                        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000000aa' }}>
                            <View className="bg-[#1E1E1E] rounded-xl mx-6 p-4">
                                <DateTimePicker
                                    value={dobDate}
                                    mode="date"
                                    locale="fr-FR"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    themeVariant="dark"
                                    maximumDate={new Date()}
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            setDobDate(selectedDate);
                                            setDob(formatDate(selectedDate));
                                        }
                                    }}
                                />
                                <TouchableOpacity
                                    className="mt-4 bg-orange-500 py-3 rounded-xl items-center"
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <Text className="text-white font-semibold text-base">Valider</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Sélecteur genre */}
                    <TouchableOpacity
                        onPress={() => setShowGenreModal(true)}
                        className="border-2 border-gray-400 rounded-md h-14 px-4 justify-center mb-6 bg-[#1C1C1E]"
                    >
                        <Text className={`text-lg ${genre ? 'text-white' : 'text-gray-400'}`}>
                            {genre ? genre : 'Sélectionne ton équipe'}
                        </Text>
                    </TouchableOpacity>

                    {/* Modal genre */}
                    <Modal visible={showGenreModal} transparent animationType="fade">
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000aa' }}>
                            <View className="bg-[#1E1E1E] rounded-xl p-6 w-[80%]">
                                <Text className="text-white text-lg font-semibold mb-4 text-center">Choisis ton équipe</Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        setGenre('Je joue dans une équipe masculine');
                                        setShowGenreModal(false);
                                    }}
                                    className="bg-gray-700 rounded-lg p-3 mb-3 items-center"
                                >
                                    <Text className="text-white">Équipe masculine</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setGenre('Je joue dans une équipe féminine');
                                        setShowGenreModal(false);
                                    }}
                                    className="bg-gray-700 rounded-lg p-3 items-center"
                                >
                                    <Text className="text-white">Équipe féminine</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setShowGenreModal(false)}
                                    className="mt-4 items-center"
                                >
                                    <Text className="text-blue-400 text-sm">Annuler</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Bouton continuer */}
                    <Pressable
                        onPress={handleContinue}
                        disabled={!isValid}
                        className={`py-4 rounded-2xl items-center ${!isValid ? 'bg-gray-600 opacity-60' : 'bg-orange-500'}`}
                    >
                        <Text className="text-white font-bold text-lg">Continuer</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
