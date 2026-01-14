// src/features/home/screens/PostLikesScreen.tsx
// Liste les posts du joueur et affiche les personnes qui les ont aimés

import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../../types";
import { PostLikesContent } from "../components/PostLikesContent";

type NavProp = NativeStackNavigationProp<RootStackParamList, "PostLikes">;

export default function PostLikesScreen() {
  const navigation = useNavigation<NavProp>();
  const [postCount, setPostCount] = useState(0);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">
            J'aime sur mes posts
          </Text>
        </View>
        <View className="bg-orange-500/20 border border-orange-500 rounded-full px-3 py-1">
          <Text className="text-orange-400 font-semibold">
            {postCount} post{postCount > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <PostLikesContent onCountChange={setPostCount} />
    </SafeAreaView>
  );
}
