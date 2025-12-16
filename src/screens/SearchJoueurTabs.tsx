import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import SearchJoueur from "../Components/SearchJoueur";
import FavoriteJoueursTab from "./search/FavoriteJoueursTab";

const Tab = createMaterialTopTabNavigator();

export default function SearchJoueurTabs() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: "#1f2937" },
          tabBarIndicatorStyle: {
            backgroundColor: "#F97316",
            height: 3,
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
          tabBarLabelStyle: {
            fontWeight: "bold",
            textTransform: "none",
          },
          sceneStyle: { backgroundColor: "#000" },
        }}
      >
        <Tab.Screen name="Joueurs" component={SearchJoueur} />
        <Tab.Screen name="Favoris" component={FavoriteJoueursTab} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
