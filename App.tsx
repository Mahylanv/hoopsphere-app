import "nativewind";
import "./global.css";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { StatusBar, ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { RootStackParamList } from "./src/types";

// --- Pages principales ---
import Home from "./src/Pages/Home";
import Connexion from "./src/Components/Connexion";
import InscriptionJoueurStep1 from "./src/Inscription/Joueurs/InscriptionJoueurStep1";
import InscriptionJoueurStep2 from "./src/Inscription/Joueurs/InscriptionJoueurStep2";
import InscriptionJoueurStep3 from "./src/Inscription/Joueurs/InscriptionJoueurStep3";
import InscriptionClub from "./src/Inscription/Clubs/InscriptionClub";
import InscriptionClubStep2 from "./src/Inscription/Clubs/InscriptionClubStep2";

// --- Navigations ---
import MainTabNavigatorJoueur from "./src/navigation/MainTabNavigatorJoueur";
import MainTabNavigatorClub from "./src/navigation/MainTabNavigatorClub";

// --- Autres pages ---
import ChatDetail from "./src/Pages/ChatDetail";
import OfferDetail from "./src/Pages/OfferDetail";
import Payment from "./src/Pages/Payment";
import EditOffer from "./src/Profil/Clubs/EditOffer";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Exemple : récupérer le type d'utilisateur stocké localement après connexion
    const fetchUserType = async () => {
      try {
        const type = await AsyncStorage.getItem("userType"); // "joueur" ou "club"
        setUserType(type);
      } catch (error) {
        console.error("Erreur chargement type utilisateur:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserType();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <NavigationContainer>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "#111827" }} // 🔧 fond noir anthracite
          edges={["left", "right"]} // ❌ on retire top/bottom pour éviter la marge blanche
        >
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Connexion" component={Connexion} />
            <Stack.Screen
              name="InscriptionJoueurStep1"
              component={InscriptionJoueurStep1}
            />
            <Stack.Screen
              name="InscriptionJoueurStep2"
              component={InscriptionJoueurStep2}
            />
            <Stack.Screen
              name="InscriptionJoueurStep3"
              component={InscriptionJoueurStep3}
            />
            <Stack.Screen name="InscriptionClub" component={InscriptionClub} />
            <Stack.Screen
              name="InscriptionClubStep2"
              component={InscriptionClubStep2}
            />

            {/* 🧭 Navigations principales */}
            <Stack.Screen name="MainTabs" component={MainTabNavigatorJoueur} />
            <Stack.Screen
              name="MainTabsClub"
              component={MainTabNavigatorClub}
            />

            {/* 🔁 Autres pages */}
            <Stack.Screen name="ChatDetail" component={ChatDetail} />
            <Stack.Screen name="OfferDetail" component={OfferDetail} />
            <Stack.Screen name="Payment" component={Payment} />
            <Stack.Screen
              name="EditOffer"
              component={EditOffer}
              options={{
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
