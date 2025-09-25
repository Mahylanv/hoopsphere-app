import 'nativewind';
import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import { RootStackParamList } from './types';

import Home from './src/Pages/Home';
import Connexion from './src/Components/Connexion';
import InscriptionJoueurStep1 from './src/Inscription/Joueurs/InscriptionJoueurStep1';
import InscriptionJoueurStep2 from './src/Inscription/Joueurs/InscriptionJoueurStep2';
import InscriptionJoueurStep3 from './src/Inscription/Joueurs/InscriptionJoueurStep3';
import InscriptionClub from './src/Inscription/Clubs/InscriptionClub';
import InscriptionClubStep2 from './src/Inscription/Clubs/InscriptionClubStep2';
import MainTabNavigator from './src/Components/MainTabNavigator';
import ChatDetail from './src/Pages/ChatDetail';
import ClubProfile from './src/Profil/Clubs/ClubProfile';
import OfferDetail from './src/Pages/OfferDetail';
import Payment from './src/Pages/Payment';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <NavigationContainer>
        {/* SafeArea global pour le haut/bas du device */}
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Connexion" component={Connexion} />
            <Stack.Screen name="InscriptionJoueurStep1" component={InscriptionJoueurStep1} />
            <Stack.Screen name="InscriptionJoueurStep2" component={InscriptionJoueurStep2} />
            <Stack.Screen name="InscriptionJoueurStep3" component={InscriptionJoueurStep3} />
            <Stack.Screen name="InscriptionClub" component={InscriptionClub} />
            <Stack.Screen name="InscriptionClubStep2" component={InscriptionClubStep2} />
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="ChatDetail" component={ChatDetail} />
            <Stack.Screen name="ClubProfile" component={ClubProfile} />
            <Stack.Screen name="OfferDetail" component={OfferDetail} />
            <Stack.Screen name="Payment" component={Payment} />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}