// src/navigation/MainTabNavigatorClub.tsx
// 🏢 Navigation principale — réservée aux CLUBS

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// --- Import des pages du club ---
import Home from "../Pages/Home";
import ManageCandidatures from "../Profil/Clubs/Candidatures/ManageCandidatures";
// import Chat from "../Pages/Chat";
import SearchJoueur from "../Components/SearchJoueur";
import ProfilClub from "../Profil/Clubs/ProfilClub";

import { MainTabParamListClub } from "../types";

const Tab = createBottomTabNavigator<MainTabParamListClub>();

export default function MainTabNavigatorClub() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1f2937",
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
            case "Home":
              iconName = "home-outline";
              break;
            case "Candidatures":
              iconName = "document-text-outline"; // 📄 icône pour candidatures
              break;
            // case "Chat":
            //   iconName = "chatbubble-outline";
            //   break;
            case "SearchJoueur":
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
      {/* 🏠 Accueil club */}
      <Tab.Screen
        name="Home"
        component={Home}
        options={{ tabBarLabel: "Accueil" }}
      />

      {/* 📄 Candidatures */}
      <Tab.Screen
        name="Candidatures"
        component={ManageCandidatures}
        options={{ tabBarLabel: "Candidatures" }}
      />

      {/* 💬 Messagerie club
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{ tabBarLabel: "Messages" }}
      /> */}

      {/* 🔍 Recherche de joueurs */}
      <Tab.Screen
        name="SearchJoueur"
        component={SearchJoueur}
        options={{ tabBarLabel: "Joueurs" }}
      />

      {/* 🏢 Profil du club */}
      <Tab.Screen
        name="ProfilClub"
        component={ProfilClub}
        options={{ tabBarLabel: "Profil" }}
      />
    </Tab.Navigator>
  );
}
