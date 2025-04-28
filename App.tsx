// App.tsx
import "nativewind";
import "./global.css";
import React from 'react';
import {
  ImageBackground,
  SafeAreaView,
  View,
  Image,
  Text,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent />

      <ImageBackground
        source={require('./assets/background.jpg')}
        className="absolute inset-0 w-full h-full"
        imageStyle={{ opacity: 0.6 }}
        resizeMode="cover"
      >
        {/* Conteneur centré avec padding */}
        <View className="flex-1 justify-center items-center px-8 space-y-8">
          {/* Logo */}
          <Image
            source={require('./assets/hoopsphere-logo.png')}
            className="w-60 h-60 mb-16"
            resizeMode="contain"
          />

          {/* Bouton Joueur */}
          <Pressable
            onPress={() => { }}
            className="w-full bg-orange-500 border border-white py-5 rounded-2xl shadow-lg"
          >
            <Text className="text-white text-center text-xl font-bold">
              Je m’inscris comme un joueur
            </Text>
          </Pressable>

          {/* Bouton Club */}
          <Pressable
            onPress={() => { }}
            className="w-full bg-orange-400/90 border border-white py-5 rounded-2xl shadow-lg my-4"
          >
            <Text className="text-white text-center text-xl font-bold">
              Je m’inscris comme un club
            </Text>
          </Pressable>

          {/* Bouton Connexion */}
          <Pressable
            onPress={() => { }}
            className="w-full bg-blue-600 border border-white py-5 rounded-2xl shadow-lg"
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
