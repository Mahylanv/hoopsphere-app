import React from 'react';
import {
  ImageBackground,
  View,
  Image,
  Text,
  Pressable,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function Home() {
  const navigation = useNavigation<HomeNavProp>();

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent />

      {/* 🔥 Correction ImageBackground web-friendly */}
      <ImageBackground
        source={require("../../assets/background2.jpg")}
        resizeMode="cover"
        className="absolute inset-0 w-full h-full"
        imageStyle={{
          opacity: 0.6,
          objectFit: "cover",    // ← essentiel pour web
        }}
      >
        <View className="absolute inset-0 bg-black/60" />
        <View className="absolute -left-16 top-20 h-40 w-40 rounded-full border border-orange-500/40 bg-orange-500/10" />
        <View className="absolute right-6 top-16 h-6 w-6 rounded-full bg-orange-500/40" />
        <View className="absolute -right-20 bottom-20 h-44 w-44 rounded-full border border-blue-500/40 bg-blue-500/10" />
        <View className="absolute left-10 bottom-16 h-8 w-8 rounded-full bg-blue-500/40" />

        <View className="flex-1 justify-center items-center px-6">
          <View className="w-full">
            <View className="self-center px-4 py-1 rounded-full bg-orange-500/20 border border-orange-500/40">
              <Text className="text-orange-200 text-xs font-semibold tracking-widest">
                HOOPSPHERE
              </Text>
            </View>

            {/* 🔥 Correction taille du logo → responsive web + mobile */}
            <Image
              source={require("../../assets/hoopsphere-logo.png")}
              resizeMode="contain"
              className="
                w-44 h-44       /* mobile */
                md:w-56 md:h-56 /* tablettes */
                lg:w-64 lg:h-64 /* grand écran */
                mt-6 mb-4 self-center
              "
              style={{
                maxWidth: 250,  // ← bloc Web pour éviter explosion
                maxHeight: 250, // ← bloc Web pour éviter explosion
              }}
            />

            <Text className="text-white text-center text-3xl font-extrabold">
              Entrez dans l’arene
            </Text>
            <Text className="text-gray-300 text-center mt-2 mb-8">
              Joueurs, clubs, recruteurs. La visibilite commence ici.
            </Text>

            <Pressable
              className="w-full bg-orange-500 border border-white/20 py-5 rounded-2xl shadow-lg shadow-black/60"
              onPress={() => navigation.navigate("InscriptionJoueurStep1")}
            >
              <Text className="text-white text-center text-xl font-bold tracking-wide">
                Je m’inscris comme un joueur
              </Text>
            </Pressable>

            <Pressable
              className="w-full my-4 bg-black/50 border border-orange-500/60 py-5 rounded-2xl shadow-lg shadow-black/60"
              onPress={() => navigation.navigate("InscriptionClub")}
            >
              <Text className="text-orange-100 text-center text-xl font-bold tracking-wide">
                Je m’inscris comme un club
              </Text>
            </Pressable>

            <Text className="text-gray-400 text-center mb-3">
              Deja un compte ?
            </Text>
            <Pressable
              className="w-full bg-blue-600 border border-white/30 py-5 rounded-2xl shadow-lg shadow-black/60"
              onPress={() => navigation.navigate("Connexion")}
            >
              <Text className="text-white text-center text-xl font-bold tracking-wide">
                Connexion
              </Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
