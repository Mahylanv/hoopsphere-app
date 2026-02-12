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
import { StatusBar, ActivityIndicator, View, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MenuProvider } from "react-native-popup-menu";
import * as NavigationBar from "expo-navigation-bar";

import { AuthProvider, useAuth } from "./src/features/auth/context/AuthContext";
import { RootStackParamList } from "./src/types";

import Home from "./src/legacy/Home";
import Connexion from "./src/features/auth/screens/Connexion";
import InscriptionJoueurStep1 from "./src/features/auth/screens/register/joueur/InscriptionJoueurStep1";
import InscriptionJoueurStep2 from "./src/features/auth/screens/register/joueur/InscriptionJoueurStep2";
import InscriptionJoueurStep3 from "./src/features/auth/screens/register/joueur/InscriptionJoueurStep3";
import InscriptionClub from "./src/features/auth/screens/register/club/InscriptionClub";
import InscriptionClubStep2 from "./src/features/auth/screens/register/club/InscriptionClubStep2";
import MainTabNavigatorJoueur from "./src/navigation/tabs/PlayerTabs";
import MainTabNavigatorClub from "./src/navigation/tabs/ClubTabs";
import ChatDetail from "./src/legacy/ChatDetail";
import OfferDetail from "./src/legacy/OfferDetail";
import Payment from "./src/legacy/Payment";
import StripeCheckout from "./src/features/payments/screens/StripeCheckout";
import SubscriptionSettings from "./src/features/payments/screens/SubscriptionSettings";
import AnnualUpgrade from "./src/features/payments/screens/AnnualUpgrade";
import InAppWebView from "./src/features/payments/screens/InAppWebView";
import EditOffer from "./src/features/profile/club/screens/EditOffer";
import JoueurDetail from "./src/features/profile/player/screens/JoueurDetail";
import EditClubProfile from "./src/features/profile/club/screens/EditClubProfile";
import ClubTeamsList from "./src/features/profile/club/screens/ClubTeamsList";
import ProfilClub from "./src/features/profile/club/screens/ProfilClub";
import ClubLikedVideosScreen from "./src/features/profile/club/screens/ClubLikedVideosScreen";
import ClubVisitorsScreen from "./src/features/profile/club/screens/ClubVisitorsScreen";
import FullMediaViewerScreen from "./src/features/profile/player/screens/FullMediaViewerScreen";
import ManageCandidatures from "./src/features/profile/club/screens/candidatures/ManageCandidatures";
import ForgotPassword from "./src/features/auth/screens/ForgotPassword";
import VideoFeedScreen from "./src/features/home/screens/VideoFeedScreen";
import VisitorsScreen from "./src/features/profile/player/screens/VisitorsScreen";
import TestPrenium from "./src/legacy/TestPrenium";
import CreatePostScreen from "./src/features/profile/player/screens/Post/CreatePostScreen";
import EditPostScreen from "./src/features/profile/player/screens/Post/EditPostScreen";
import LikedPostsScreen from "./src/features/home/screens/LikedPostsScreen";
import PostLikesScreen from "./src/features/home/screens/PostLikesScreen";
import StripeWrapper from "./src/providers/StripeWrapper";

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
        // console.log("Erreur de restauration navigation :", e);
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
        <Stack.Screen
          name="ClubLikedVideos"
          component={ClubLikedVideosScreen}
        />
        <Stack.Screen name="ClubVisitors" component={ClubVisitorsScreen} />

        <Stack.Screen
          name="LikedPosts"
          component={LikedPostsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostLikes"
          component={PostLikesScreen}
          options={{ headerShown: false }}
        />

        {/* Navigation principale */}
        <Stack.Screen name="MainTabs" component={MainTabNavigatorJoueur} />
        <Stack.Screen name="MainTabsClub" component={MainTabNavigatorClub} />

        {/* Pages */}
        {/* <Stack.Screen name="ChatDetail" component={ChatDetail} /> */}
        <Stack.Screen name="TestPrenium" component={TestPrenium} />
        <Stack.Screen name="OfferDetail" component={OfferDetail} />
        <Stack.Screen name="Payment" component={Payment} />
        <Stack.Screen
          name="SubscriptionSettings"
          component={SubscriptionSettings}
        />
        <Stack.Screen name="AnnualUpgrade" component={AnnualUpgrade} />
        <Stack.Screen name="StripeCheckout" component={StripeCheckout} />
        <Stack.Screen name="InAppWebView" component={InAppWebView} />
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
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen
          name="EditPost"
          component={EditPostScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    const run = async () => {
      try {
        await NavigationBar.setBackgroundColorAsync("#0E0D0D");
        await NavigationBar.setButtonStyleAsync("light");
        await NavigationBar.setVisibilityAsync("visible");
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  return (
    <StripeWrapper>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0E0D0D" }}>
        <AuthProvider>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <StatusBar
              translucent
              backgroundColor="transparent"
              barStyle="light-content"
            />

            <MenuProvider skipInstanceCheck>
              <PersistedNavContainer>
                <RootNavigator />
              </PersistedNavContainer>
            </MenuProvider>
          </SafeAreaProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </StripeWrapper>
  );
}
