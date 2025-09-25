import React from 'react';
import { ImageBackground, View, Image, Text, Pressable, StatusBar,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function Home() {
    const navigation = useNavigation<HomeNavProp>();

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" translucent />
            <ImageBackground
                source={require('../../assets/background2.jpg')}
                className="absolute inset-0 w-full h-full"
                imageStyle={{ opacity: 0.6 }}
                resizeMode="cover"
            >
                <View className="flex-1 justify-center items-center px-8 space-y-8">
                    <Image
                        source={require('../../assets/hoopsphere-logo.png')}
                        className="w-60 h-60 mb-16"
                        resizeMode="contain"
                    />

                    <Pressable
                        className="w-full bg-orange-500 border border-white py-5 rounded-2xl shadow-lg"
                        onPress={() => navigation.navigate('InscriptionJoueurStep1')}
                    >
                        <Text className="text-white text-center text-xl font-bold">
                            Je m’inscris comme un joueur
                        </Text>
                    </Pressable>

                    <Pressable
                        className="w-full my-4 bg-orange-400/90 border border-white py-5 rounded-2xl shadow-lg"
                        onPress={() => navigation.navigate('InscriptionClub')}
                    >
                        <Text className="text-white text-center text-xl font-bold">
                            Je m’inscris comme un club
                        </Text>
                    </Pressable>

                    <Pressable
                        className="w-full bg-blue-600 border border-white py-5 rounded-2xl shadow-lg"
                        onPress={() => navigation.navigate('Connexion')}
                    >
                        <Text className="text-white text-center text-xl font-bold">
                            Connexion
                        </Text>
                    </Pressable>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
}
