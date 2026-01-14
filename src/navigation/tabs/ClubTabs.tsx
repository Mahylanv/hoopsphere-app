// src/navigation/MainTabNavigatorClub.tsx
// 🏢 Navigation principale — réservée aux CLUBS

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// --- Import des pages du club ---
import HomeScreen from "../../features/home/screens/HomeScreen";
import ManageCandidatures from "../../features/profile/club/screens/candidatures/ManageCandidatures";
// import SearchJoueur from "../Components/SearchJoueur";
import ProfilClub from "../../features/profile/club/screens/ProfilClub";
import SearchJoueurTabs from "../../features/search/screens/SearchJoueurTabs";
import ClubPremiumScreen from "../../features/profile/club/screens/ClubPremiumScreen";

import { MainTabParamListClub } from "../../types";

const Tab = createBottomTabNavigator<MainTabParamListClub>();

export default function MainTabNavigatorClub() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0E0D0D",
          borderTopColor: "#0E0D0D",
          height: 70,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>["name"];

          switch (route.name) {
            case "Home":
              iconName = "home-outline";
              break;
            case "Candidatures":
              iconName = "document-text-outline";
              break;
            case "SearchJoueurTabs":
              iconName = "search-outline";
              break;
            case "ClubPremium":
              iconName = "star-outline";
              break;
            case "ProfilClub":
              iconName = "business-outline";
              break;
            default:
              iconName = "ellipse-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <>
        {/* 🏠 Accueil club */}
        <Tab.Screen name="Home" options={{ tabBarLabel: "Accueil" }}>
          {() => <HomeScreen forClub />}
        </Tab.Screen>

        {/* 📄 Candidatures */}
        <Tab.Screen
          name="Candidatures"
          component={ManageCandidatures}
          options={{ tabBarLabel: "Candidatures" }}
        />

        {/* 🔍 Recherche de joueurs */}
        <Tab.Screen
          name="SearchJoueurTabs"
          component={SearchJoueurTabs}
          options={{ tabBarLabel: "Joueurs" }}
        />

        {/* ⭐ Espace Premium Club */}
        <Tab.Screen
          name="ClubPremium"
          component={ClubPremiumScreen}
          options={{ tabBarLabel: "Premium" }}
        />

        {/* 🏢 Profil du club */}
        <Tab.Screen
          name="ProfilClub"
          component={ProfilClub}
          options={{ tabBarLabel: "Profil" }}
        />
      </>
    </Tab.Navigator>
  );
}
