// src/navigation/MainTabNavigator.tsx
// 🔥 Navigation principale — réservée aux JOUEURS

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// --- Import des écrans destinés aux joueurs ---
import MainJoueur from "../Profil/Joueurs/MainJoueur";
import Chat from "../Pages/Chat";
import Search from "../Components/Search";
import Profil from "../Pages/Profil";
import Match from "../Pages/Match";

import { MainTabParamListJoueur } from "../types";

const Tab = createBottomTabNavigator<MainTabParamListJoueur>();

export default function MainTabNavigatorJoueur() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1f2937", // gris foncé
          borderTopColor: "#111827",
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
            case "MainJoueur":
              iconName = "home-outline";
              break;
            case "Match":
              iconName = "basketball-outline";
              break;
            case "Chat":
              iconName = "chatbubble-outline";
              break;
            case "Search":
              iconName = "search-outline";
              break;
            case "Profil":
              iconName = "person-outline";
              break;
            default:
              iconName = "ellipse-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* 🏠 Accueil joueur */}
      <Tab.Screen
        name="MainJoueur"
        component={MainJoueur}
        options={{ tabBarLabel: "Accueil" }}
      />

      {/* 🏀 Matchs du joueur */}
      <Tab.Screen
        name="Match"
        component={Match}
        options={{ tabBarLabel: "Matchs" }}
      />

      {/* 💬 Messagerie */}
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{ tabBarLabel: "Messages" }}
      />

      {/* 🔍 Recherche joueurs / clubs */}
      <Tab.Screen
        name="Search"
        component={Search}
        options={{ tabBarLabel: "Recherche" }}
      />

      {/* 👤 Profil joueur */}
      <Tab.Screen
        name="Profil"
        component={Profil}
        options={{ tabBarLabel: "Profil" }}
      />
    </Tab.Navigator>
  );
}
