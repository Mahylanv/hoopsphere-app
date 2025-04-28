import "nativewind";
import "./global.css";
import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./screens/Home";
import InscriptionJoueur from "./screens/InscriptionJoueur";
import InscriptionClub from "./screens/InscriptionClub";
import Connexion from "./screens/Connexion";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" translucent />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen
          name="InscriptionJoueur"
          component={InscriptionJoueur}
        />
        <Stack.Screen name="InscriptionClub" component={InscriptionClub} />
        <Stack.Screen name="Connexion" component={Connexion} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
