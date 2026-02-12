import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { Animated, Pressable, Text, View } from "react-native";

import SearchJoueur from "../components/SearchJoueur";
import FavoriteJoueursTab from "./FavoriteJoueursTab";
import PremiumWall from "../../../shared/components/PremiumWall";
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";
import { useNavigation } from "@react-navigation/native";

const Tab = createMaterialTopTabNavigator();

export default function SearchJoueurTabs() {
  const { isPremium } = usePremiumStatus();
  const navigation = useNavigation();
  const goToPremium = () =>
    (navigation as any).navigate("Payment", { userType: "club" });

  return (
    <SafeAreaView
      className="flex-1 bg-[#0E0D0D]"
      edges={["top", "left", "right"]}
    >
      <View className="px-4 pt-5 pb-2">
        <LinearGradient
          colors={["#2563EB", "#0D1324", "#0E0D0D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(37,99,235,0.2)",
            overflow: "hidden",
          }}
        >
          <View
            className="absolute -right-10 -top-8 w-24 h-24 rounded-full"
            style={{ backgroundColor: "rgba(249,115,22,0.18)" }}
          />
          <View
            className="absolute -left-10 bottom-0 w-24 h-24 rounded-full"
            style={{ backgroundColor: "rgba(37,99,235,0.18)" }}
          />

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3">
              <Ionicons name="search-outline" size={18} color="#F8FAFC" />
            </View>
            <View>
              <Text className="text-white text-lg font-bold">
                Recherche Joueurs
              </Text>
              <Text className="text-gray-200 text-xs mt-0.5">
                Trouve des profils pour ton club
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      <Tab.Navigator
        tabBar={SearchJoueurTabsBar}
        screenOptions={{
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

function SearchJoueurTabsBar({
  state,
  descriptors,
  navigation,
}: MaterialTopTabBarProps) {
  const [tabsLayout, setTabsLayout] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const tabWidth =
    containerWidth && state.routes.length > 0
      ? containerWidth / state.routes.length
      : 0;

  useEffect(() => {
    const key = state.routes[state.index]?.key;
    const layout = key ? tabsLayout[key] : null;
    if (!layout || !containerWidth || !tabWidth) return;

    const centerX = layout.x + layout.width / 2;
    const targetX = Math.min(
      Math.max(centerX - tabWidth / 2, 0),
      containerWidth - tabWidth
    );

    Animated.spring(translateX, {
      toValue: targetX,
      speed: 18,
      bounciness: 6,
      useNativeDriver: false,
    }).start();
  }, [state.index, tabsLayout, translateX, containerWidth, tabWidth]);

  return (
    <View className="px-4 py-1 my-2">
      <View className="w-full bg-[#1f2937] rounded-full px-4 py-2 overflow-hidden border border-white/10">
        <View
          className="relative w-full"
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setContainerWidth((prev) => (prev === width ? prev : width));
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: 999,
              backgroundColor: "#F97316",
              width: tabWidth,
              transform: [{ translateX }],
            }}
          />

          <View className="w-full flex-row items-center justify-around">
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const options = descriptors[route.key]?.options ?? {};
              const label =
                typeof options.tabBarLabel === "string"
                  ? options.tabBarLabel
                  : options.title ?? route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({ type: "tabLongPress", target: route.key });
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setTabsLayout((prev) => {
                      const current = prev[route.key];
                      if (
                        current &&
                        current.x === x &&
                        current.width === width
                      ) {
                        return prev;
                      }
                      return { ...prev, [route.key]: { x, width } };
                    });
                  }}
                  className="py-1.5 px-6 rounded-full items-center"
                >
                  <Text
                    className={`text-[15px] font-semibold ${
                      isFocused ? "text-white" : "text-gray-200"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
