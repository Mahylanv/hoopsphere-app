// src/navigation/MainTabNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DeviceEventEmitter } from "react-native";

import HomeScreen from "../Home/HomeScreen";
import Chat from "../Pages/Chat";
import Search from "../Components/Search";
import ProfilJoueur from "../Profil/Joueurs/ProfilJoueur";
import Match from "../Pages/Match";

import { MainTabParamListJoueur } from "../types";
import TestPrenium from "../Pages/TestPrenium";

const Tab = createBottomTabNavigator<MainTabParamListJoueur>();

export default function MainTabNavigatorJoueur() {
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
            case "HomeScreen":
              iconName = "home-outline";
              break;
            case "Match":
              iconName = "basketball-outline";
              break;
            case "TestPrenium":
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
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ tabBarLabel: "Accueil" }}
        listeners={({ route }) => ({
          tabPress: () => DeviceEventEmitter.emit("tab-pressed", route.name),
        })}
      />

      <Tab.Screen
        name="Match"
        component={Match}
        options={{ tabBarLabel: "Matchs" }}
        listeners={({ route }) => ({
          tabPress: () => DeviceEventEmitter.emit("tab-pressed", route.name),
        })}
      />

      <Tab.Screen
        name="TestPrenium"
        component={TestPrenium}
        options={{ tabBarLabel: "Messages" }}
        listeners={({ route }) => ({
          tabPress: () => DeviceEventEmitter.emit("tab-pressed", route.name),
        })}
      />

      <Tab.Screen
        name="Search"
        component={Search}
        options={{ tabBarLabel: "Recherche" }}
        listeners={({ route }) => ({
          tabPress: () => DeviceEventEmitter.emit("tab-pressed", route.name),
        })}
      />

      <Tab.Screen
        name="Profil"
        component={ProfilJoueur}
        options={{ tabBarLabel: "Profil" }}
        listeners={({ route }) => ({
          tabPress: () => DeviceEventEmitter.emit("tab-pressed", route.name),
        })}
      />
    </Tab.Navigator>
  );
}
