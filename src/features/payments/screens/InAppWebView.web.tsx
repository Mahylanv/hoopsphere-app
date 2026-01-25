import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { RootStackParamList } from "../../../types";

type NavProp = NativeStackNavigationProp<RootStackParamList, "InAppWebView">;
type RouteProps = RouteProp<RootStackParamList, "InAppWebView">;

export default function InAppWebView() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { title, url } = route.params;

  useEffect(() => {
    if (url) {
      Linking.openURL(url);
    }
  }, [url]);

  return (
    <SafeAreaView className="flex-1 bg-black items-center justify-center px-6">
      <View className="bg-[#111] border border-white/10 rounded-2xl p-4 w-full">
        <Text className="text-white text-base font-semibold mb-2">{title}</Text>
        <Text className="text-gray-300 text-sm mb-4">
          Ouverture du lien dans votre navigateur...
        </Text>
        <Pressable
          onPress={() => Linking.openURL(url)}
          className="bg-orange-500 rounded-xl py-3 items-center mb-3"
        >
          <Text className="text-white font-semibold">Ouvrir le lien</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-white/10 border border-white/10 rounded-xl py-3 items-center"
        >
          <Text className="text-white font-semibold">Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
