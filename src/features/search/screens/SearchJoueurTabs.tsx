import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import SearchJoueur from "../components/SearchJoueur";
import FavoriteJoueursTab from "./FavoriteJoueursTab";
import PremiumWall from "../../../shared/components/PremiumWall";
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";
import { useNavigation } from "@react-navigation/native";

const Tab = createMaterialTopTabNavigator();

export default function SearchJoueurTabs() {
  const { isPremium } = usePremiumStatus();
  const navigation = useNavigation();
  const goToPremium = () => (navigation as any).navigate("Payment");

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
        <Tab.Screen name="Favoris">
          {() =>
            isPremium ? (
              <FavoriteJoueursTab />
            ) : (
              <PremiumWall
                message="Les favoris joueurs sont réservés aux membres Premium."
                onPressUpgrade={goToPremium}
              />
            )
          }
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
}
