import 'nativewind';
import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { RootStackParamList } from './types';

import Home from './screens/Home';
import Connexion from './screens/Connexion';
import InscriptionJoueurStep1 from './screens/InscriptionJoueurStep1';
import InscriptionJoueurStep2 from './screens/InscriptionJoueurStep2';
import InscriptionJoueurStep3 from './screens/InscriptionJoueurStep3';
import InscriptionClub from './screens/InscriptionClub';
import MainTabNavigator from './navigation/MainTabNavigator';
import ChatDetail from './screens/ChatDetail';
import ClubProfile from 'screens/ClubProfile';


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
        <Stack.Screen name="InscriptionJoueurStep1" component={InscriptionJoueurStep1} />
        <Stack.Screen name="InscriptionJoueurStep2" component={InscriptionJoueurStep2} />
        <Stack.Screen name="InscriptionJoueurStep3" component={InscriptionJoueurStep3} />
        <Stack.Screen name="InscriptionClub" component={InscriptionClub} />

        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="ChatDetail" component={ChatDetail} />
        <Stack.Screen name="ClubProfile" component={ClubProfile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
