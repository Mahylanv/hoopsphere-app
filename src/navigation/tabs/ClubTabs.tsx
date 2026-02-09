// src/navigation/MainTabNavigatorClub.tsx
// 🏢 Navigation principale — réservée aux CLUBS

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Import des pages du club ---
import HomeScreen from "../../features/home/screens/HomeScreen";
import ManageCandidatures from "../../features/profile/club/screens/candidatures/ManageCandidatures";
// import SearchJoueur from "../Components/SearchJoueur";
import ProfilClub from "../../features/profile/club/screens/ProfilClub";
import SearchJoueurTabs from "../../features/search/screens/SearchJoueurTabs";

import { MainTabParamListClub } from "../../types";

const Tab = createBottomTabNavigator<MainTabParamListClub>();

export default function MainTabNavigatorClub() {
  const insets = useSafeAreaInsets();
  const hasBottomNavButtons =
    Platform.OS === "android" && insets.bottom >= 20;
  const baseTabBarStyle = {
    backgroundColor: "#0E0D0D",
    borderTopColor: "#0E0D0D",
    height: 70,
    paddingBottom: 8,
  };
  const tabBarStyle = hasBottomNavButtons
    ? {
        ...baseTabBarStyle,
        height: 70 + insets.bottom,
        paddingBottom: 8 + insets.bottom,
      }
    : baseTabBarStyle;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle,
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
