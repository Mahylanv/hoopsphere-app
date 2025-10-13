import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import MainJoueur from "../Profil/Joueurs/MainJoueur";
import Chat from "../Pages/Chat";
import Search from "../Components/Search";
import Profil from "../Pages/Profil";
import Match from "../Pages/Match"; // ✅ corrigé : avant c'était Home

import { MainTabParamList } from "../../types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
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
              iconName = "basketball-outline"; // ✅ icône corrigée
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
      <Tab.Screen
        name="MainJoueur"
        component={MainJoueur}
        options={{ tabBarLabel: "Accueil" }}
      />
      <Tab.Screen
        name="Match"
        component={Match}
        options={{ tabBarLabel: "Match" }}
      />
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{ tabBarLabel: "Messages" }}
      />
      <Tab.Screen
        name="Search"
        component={Search}
        options={{ tabBarLabel: "Recherche" }}
      />
      <Tab.Screen
        name="Profil"
        component={Profil}
        options={{ tabBarLabel: "Profil" }}
      />
    </Tab.Navigator>
  );
}
