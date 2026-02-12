// src/navigation/MainTabNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DeviceEventEmitter, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../../features/home/screens/HomeScreen";
import Search from "../../features/search/components/Search";
import ProfilJoueur from "../../features/profile/player/screens/ProfilJoueur";
import Match from "../../legacy/Match";
import CreatePostScreen from "../../features/profile/player/screens/Post/CreatePostScreen";

import { MainTabParamListJoueur } from "../../types";

const Tab = createBottomTabNavigator<MainTabParamListJoueur>();

export default function MainTabNavigatorJoueur() {
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
        height: 48 + insets.bottom,
        paddingBottom: 1 + insets.bottom,
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
            case "HomeScreen":
              iconName = "home-outline";
              break;
            case "Match":
              iconName = "basketball-outline";
              break;
            case "Publish":
              iconName = "add";
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
        name="Publish"
        component={CreatePostScreen}
        options={{ tabBarLabel: "Publier" }}
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
