import React, { useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../types";

type NavProp = NativeStackNavigationProp<RootStackParamList, "InAppWebView">;
type RouteProps = RouteProp<RootStackParamList, "InAppWebView">;

export default function InAppWebView() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { title, url } = route.params;
  const portalReturnUrl =
    "https://hoopsphere-df315.firebaseapp.com/billing-return";
  const [loading, setLoading] = useState(true);
  const isPdf =
    /\.pdf($|\?)/i.test(url) || url.toLowerCase().includes("invoice_pdf");
  const displayUrl =
    isPdf && Platform.OS === "android"
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
          url
        )}`
      : url;

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
        <Pressable onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text className="text-white text-base font-semibold">{title}</Text>
        <View className="w-8" />
      </View>

      <WebView
        source={{ uri: displayUrl }}
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={(request) => {
          const nextUrl = request?.url ?? "";
          if (nextUrl.startsWith(portalReturnUrl)) {
            navigation.goBack();
            return false;
          }
          return true;
        }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1 }}
      />

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      )}
    </SafeAreaView>
  );
}
