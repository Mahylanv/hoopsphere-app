import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
    Image,
    TouchableOpacity,
    ScrollView,
    TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

export default function Profil() {
    const [images, setImages] = useState<string[]>([]);
    const [editMode, setEditMode] = useState(false);

    // Biographie state
    const [birthYear, setBirthYear] = useState('2001');
    const [height, setHeight] = useState('180');
    const [weight, setWeight] = useState('70 kg');
    const [position, setPosition] = useState('Meneur');
    const [strongHand, setStrongHand] = useState('Droite');

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert("L'autorisation d'accéder à la galerie est requise !");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0E0D0D' }}>
            <StatusBar barStyle="light-content" />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={true}>

                {/* Header avec icônes en haut à droite */}
                <View className="flex-row justify-end items-center px-6 mt-6 space-x-6 absolute right-0">
                    <TouchableOpacity>
                        <Image source={require('../assets/setting.png')} className="w-6 h-6 mr-3" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image source={require('../assets/share.png')} className="w-6 h-6" />
                    </TouchableOpacity>
                </View>

                {/* Photo de profil */}
                <View className="items-center mt-12">
                    <View className="relative">
                        <Image
                            source={require('../assets/profil_img.jpg')}
                            className="w-32 h-32 rounded-full"
                        />
                        <TouchableOpacity
                            className="absolute bottom-0 right-0 rounded-full p-2 border border-gray-300"
                            style={{ backgroundColor: '#83A8FF' }}
                        >
                            <Feather name="edit-2" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text className="mt-4 text-xl font-semibold text-white">Alex Dupont</Text>
                </View>

                {/* Biographie */}
                <View className="mt-8 px-6">
                    <Text className="text-xl font-bold mb-4 text-white">Biographie</Text>

                    {/* Ligne 1 */}
                    <View className="flex-row justify-between mb-4 gap-x-4">
                        <View className="w-1/2">
                            <Text className="text-base text-gray-400">Année de naissance</Text>
                            {editMode ? (
                                <TextInput
                                    value={birthYear}
                                    onChangeText={setBirthYear}
                                    keyboardType="numeric"
                                    className="text-lg text-white border-b border-gray-500"
                                />
                            ) : (
                                <Text className="text-lg text-white">{birthYear}</Text>
                            )}
                        </View>
                        <View className="w-1/2">
                            <Text className="text-base text-gray-400">Taille</Text>
                            {editMode ? (
                                <TextInput
                                    value={height}
                                    onChangeText={setHeight}
                                    keyboardType="numeric"
                                    className="text-lg text-white border-b border-gray-500"
                                />
                            ) : (
                                <Text className="text-lg text-white">{height}</Text>
                            )}
                        </View>
                    </View>

                    {/* Ligne 2 */}
                    <View className="flex-row justify-between mb-4 gap-x-4">
                        <View className="w-1/2">
                            <Text className="text-base text-gray-400">Poids</Text>
                            {editMode ? (
                                <TextInput
                                    value={weight}
                                    onChangeText={setWeight}
                                    className="text-lg text-white border-b border-gray-500"
                                />
                            ) : (
                                <Text className="text-lg text-white">{weight}</Text>
                            )}
                        </View>
                        <View className="w-1/2">
                            <Text className="text-base text-gray-400">Poste</Text>
                            {editMode ? (
                                <TextInput
                                    value={position}
                                    onChangeText={setPosition}
                                    className="text-lg text-white border-b border-gray-500"
                                />
                            ) : (
                                <Text className="text-lg text-white">{position}</Text>
                            )}
                        </View>
                    </View>

                    {/* Ligne 3 */}
                    <View className="mb-6">
                        <Text className="text-base text-gray-400">Main forte</Text>
                        {editMode ? (
                            <TextInput
                                value={strongHand}
                                onChangeText={setStrongHand}
                                className="text-lg text-white border-b border-gray-500"
                            />
                        ) : (
                            <Text className="text-lg text-white">{strongHand}</Text>
                        )}
                    </View>

                    {/* Bouton "Complète ta bio" */}
                    <View className="items-start">
                        <TouchableOpacity
                            onPress={() => setEditMode(!editMode)}
                            className="py-3 px-6 rounded-lg mb-6"
                            style={{ backgroundColor: '#2E4E9C' }}
                        >
                            <Text className="text-white text-base font-semibold">
                                {editMode ? 'Enregistrer' : 'Complète ta bio'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Statistiques */}
                    <View className="mt-6">
                        <Text className="text-xl font-bold text-white mb-1">Statistiques</Text>
                        <Text className="text-sm text-gray-400 mb-4">Moyenne par match (saison)</Text>

                        {/* Ligne 1 */}
                        <View className="flex-row justify-between mb-4 gap-x-4">
                            <View className="w-1/2">
                                <Text className="text-base text-gray-400">Points</Text>
                                <Text className="text-lg text-white">24,1</Text>
                            </View>
                            <View className="w-1/2">
                                <Text className="text-base text-gray-400">Rebonds</Text>
                                <Text className="text-lg text-white">7,8</Text>
                            </View>
                        </View>

                        {/* Ligne 2 */}
                        <View className="flex-row justify-between mb-4 gap-x-4 border-t border-gray-600 pt-4">
                            <View className="w-1/2">
                                <Text className="text-base text-gray-400">Passes décisives</Text>
                                <Text className="text-lg text-white">8,1</Text>
                            </View>
                            <View className="w-1/2">
                                <Text className="text-base text-gray-400">Contres</Text>
                                <Text className="text-lg text-white">2,1 / 1,6</Text>
                            </View>
                        </View>
                    </View>

                    {/* Galerie */}
                    <View className="mt-4">
                        <Text className="text-xl font-bold text-white mb-2">Galerie</Text>

                        <Image
                            source={require('../assets/basketteur.jpg')}
                            className="w-full h-48 rounded-xl mb-4"
                            resizeMode="cover"
                        />

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-4">
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="w-32 h-32 rounded-xl bg-gray-800 justify-center items-center"
                                >
                                    <Text className="text-4xl text-white">+</Text>
                                </TouchableOpacity>

                                <Image
                                    source={require('../assets/galerie3.png')}
                                    className="w-32 h-32 rounded-xl"
                                    resizeMode="cover"
                                />
                                <Image
                                    source={require('../assets/galerie2.jpg')}
                                    className="w-32 h-32 rounded-xl"
                                    resizeMode="cover"
                                />

                                {images.map((uri, index) => (
                                    <Image
                                        key={index}
                                        source={{ uri }}
                                        className="w-32 h-32 rounded-xl"
                                        resizeMode="cover"
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Footer
                <View className="items-center mt-10">
                    <Text className="text-2xl font-bold text-white">Mon Profil</Text>
                </View> */}
            </ScrollView>
        </SafeAreaView>
    );
}
