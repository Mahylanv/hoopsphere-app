// App.tsx

import "./global.css";
import "nativewind";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationContainer,
  InitialState,
  NavigationState,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { StatusBar, ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { RootStackParamList } from "./src/types";

import Home from "./src/Pages/Home";
import Connexion from "./src/Components/Connexion";
import InscriptionJoueurStep1 from "./src/Inscription/Joueurs/InscriptionJoueurStep1";
import InscriptionJoueurStep2 from "./src/Inscription/Joueurs/InscriptionJoueurStep2";
import InscriptionJoueurStep3 from "./src/Inscription/Joueurs/InscriptionJoueurStep3";
import InscriptionClub from "./src/Inscription/Clubs/InscriptionClub";
import InscriptionClubStep2 from "./src/Inscription/Clubs/InscriptionClubStep2";
import MainTabNavigatorJoueur from "./src/navigation/MainTabNavigatorJoueur";
import MainTabNavigatorClub from "./src/navigation/MainTabNavigatorClub";
import ChatDetail from "./src/Pages/ChatDetail";
import OfferDetail from "./src/Pages/OfferDetail";
import Payment from "./src/Pages/Payment";
import EditOffer from "./src/Profil/Clubs/EditOffer";
import JoueurDetail from "./src/Profil/Joueurs/JoueurDetail";
import EditClubProfile from "./src/Profil/Clubs/EditClubProfile";
import ClubTeamsList from "./src/Profil/Clubs/ClubTeamsList";
import ProfilClub from "./src/Profil/Clubs/ProfilClub";
import FullMediaViewerScreen from "./src/Profil/Joueurs/screens/FullMediaViewerScreen";
import ManageCandidatures from "./src/Profil/Clubs/Candidatures/ManageCandidatures";
import ForgotPassword from "./src/Pages/ForgotPassword";
import VideoFeedScreen from "./src/Home/VideoFeedScreen";
import VisitorsScreen from "./src/Profil/Joueurs/screens/VisitorsScreen";
import TestPrenium from "./src/Pages/TestPrenium";

const Stack = createNativeStackNavigator<RootStackParamList>();

const NAV_STATE_KEY = "NAVIGATION_STATE_V1";

function PersistedNavContainer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState<InitialState>();

  React.useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(NAV_STATE_KEY);
        if (savedState) {
          setInitialState(JSON.parse(savedState));
        }
      } catch (e) {
        console.log("Erreur de restauration navigation :", e);
      }
      setIsReady(true);
    };

    loadState();
  }, []);

  if (!isReady) return null;

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={async (state?: NavigationState) => {
        try {
          await AsyncStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
        } catch {}
      }}
    >
      {children}
    </NavigationContainer>
  );
}

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#111827" }}
      edges={["left", "right"]}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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

        <Stack.Screen
          name="ManageCandidatures"
          component={ManageCandidatures}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FullMediaViewer"
          component={FullMediaViewerScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Visitors"
          component={VisitorsScreen} // on le créera à l'étape suivante
          options={{ title: "Visiteurs du Profil" }}
        />

        {/* Navigation principale */}
        <Stack.Screen name="MainTabs" component={MainTabNavigatorJoueur} />
        <Stack.Screen name="MainTabsClub" component={MainTabNavigatorClub} />

        {/* Pages */}
        {/* <Stack.Screen name="ChatDetail" component={ChatDetail} /> */}
        <Stack.Screen name="TestPrenium" component={TestPrenium} />
        <Stack.Screen name="OfferDetail" component={OfferDetail} />
        <Stack.Screen name="Payment" component={Payment} />
        <Stack.Screen name="EditOffer" component={EditOffer} />
        <Stack.Screen name="JoueurDetail" component={JoueurDetail} />
        <Stack.Screen
          name="EditClubProfile"
          component={EditClubProfile}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="ProfilClub" component={ProfilClub} />
        <Stack.Screen name="ClubTeamsList" component={ClubTeamsList} />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="VideoFeed" component={VideoFeedScreen} />
      </Stack.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
          />

          <PersistedNavContainer>
            <RootNavigator />
          </PersistedNavContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
