import 'nativewind';
import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './screens/Home';
import Connexion from './screens/Connexion';
import InscriptionJoueurStep1 from './screens/InscriptionJoueurStep1';
import InscriptionJoueurStep2 from './screens/InscriptionJoueurStep2';
import InscriptionJoueurStep3 from './screens/InscriptionJoueurStep3';
import InscriptionClub from './screens/InscriptionClub';
import MainJoueur from './screens/MainJoueur';

type RootStackParamList = {
  Home: undefined;
  Connexion: undefined;
  InscriptionJoueurStep1: undefined;
  InscriptionJoueurStep2: { email: string; password: string };
  InscriptionJoueurStep3: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    dob: string;
  };
  InscriptionClub: undefined;
  MainJoueur: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Connexion" component={Connexion} />
        <Stack.Screen name="InscriptionJoueurStep1" component={InscriptionJoueurStep1}/>
        <Stack.Screen name="InscriptionJoueurStep2" component={InscriptionJoueurStep2}/>
        <Stack.Screen name="InscriptionJoueurStep3" component={InscriptionJoueurStep3}/>
        <Stack.Screen name="InscriptionClub" component={InscriptionClub} />
        <Stack.Screen name="MainJoueur" component={MainJoueur} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
