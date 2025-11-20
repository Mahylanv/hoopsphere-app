import React from 'react';
import {
  ImageBackground,
  View,
  Image,
  Text,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function Home() {
  const navigation = useNavigation<HomeNavProp>();

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
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

        <View className="flex-1 justify-center items-center px-6 space-y-8">

          {/* 🔥 Correction taille du logo → responsive web + mobile */}
          <Image
            source={require("../../assets/hoopsphere-logo.png")}
            resizeMode="contain"
            className="
              w-40 h-40       /* mobile */
              md:w-52 md:h-52 /* tablettes */
              lg:w-64 lg:h-64 /* grand écran */
              mb-12
            "
            style={{
              maxWidth: 250,  // ← bloc Web pour éviter explosion
              maxHeight: 250, // ← bloc Web pour éviter explosion
            }}
          />

          <Pressable
            className="w-full bg-orange-500 border border-white py-5 rounded-2xl shadow-lg"
            onPress={() => navigation.navigate("InscriptionJoueurStep1")}
          >
            <Text className="text-white text-center text-xl font-bold">
              Je m’inscris comme un joueur
            </Text>
          </Pressable>

          <Pressable
            className="w-full my-4 bg-orange-400/90 border border-white py-5 rounded-2xl shadow-lg"
            onPress={() => navigation.navigate("InscriptionClub")}
          >
            <Text className="text-white text-center text-xl font-bold">
              Je m’inscris comme un club
            </Text>
          </Pressable>

          <Pressable
            className="w-full bg-blue-600 border border-white py-5 rounded-2xl shadow-lg"
            onPress={() => navigation.navigate("Connexion")}
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
