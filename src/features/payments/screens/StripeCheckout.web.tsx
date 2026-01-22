import React from "react";
import { View, Text, StatusBar, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../types";

type NavProp = NativeStackNavigationProp<RootStackParamList, "StripeCheckout">;

export default function StripeCheckoutWeb() {
  const navigation = useNavigation<NavProp>();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-xl font-bold mb-3">
          Paiement non disponible sur web
        </Text>
        <Text className="text-gray-400 text-center mb-6">
          Merci d'ouvrir l'application mobile pour vous abonner.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-orange-600 px-5 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
