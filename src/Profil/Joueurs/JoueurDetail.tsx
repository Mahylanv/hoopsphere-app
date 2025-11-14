import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

import JoueurCard from "../../Components/JoueurCard";

const CARD_WIDTH = Dimensions.get("window").width * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 0.68;

type JoueurDetailRouteProp = RouteProp<RootStackParamList, "JoueurDetail">;
type NavProp = NativeStackNavigationProp<RootStackParamList, "JoueurDetail">;

export default function JoueurDetail() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<JoueurDetailRouteProp>();
  const { joueur } = route.params;

  /* -----------------------------------------------------
     🔥 REF POUR LA CAPTURE
  ----------------------------------------------------- */
  const cardRef = useRef<ViewShot>(null);

  /* -----------------------------------------------------
     🔥 ANIMATIONS SCROLL
  ----------------------------------------------------- */
  const scrollY = useRef(new Animated.Value(0)).current;

  const scale = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [1, 0.6],
    extrapolate: "clamp",
  });

  const translateY = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [0, -40],
    extrapolate: "clamp",
  });

  const adjustedTranslate = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [0, CARD_HEIGHT * 0.55],
    extrapolate: "clamp",
  });

  const opacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  /* -----------------------------------------------------
     🔥 BOTTOM SHEET
  ----------------------------------------------------- */
  const sheetY = useRef(new Animated.Value(300)).current;
  const [isSheetOpen, setSheetOpen] = useState(false);

  const openSheet = () => {
    setSheetOpen(true);
    Animated.timing(sheetY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () =>
    Animated.timing(sheetY, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSheetOpen(false));

  /* -----------------------------------------------------
     🔥 CAPTURE LOGIQUEr
  ----------------------------------------------------- */

  const captureCard = async () => {
    try {
      const uri = await cardRef.current?.capture?.();
      return uri ?? null;
    } catch (e) {
      console.log("❌ Erreur capture :", e);
      return null;
    }
  };

  const downloadCard = async () => {
    const uri = await captureCard();
    if (!uri) return;

    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorise l’accès à la galerie.");
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert("Succès", "La carte est enregistrée !");
  };

  const shareCard = async () => {
    const uri = await captureCard();
    if (!uri) return;
    await Sharing.shareAsync(uri);
  };

  const addFavorite = () => Alert.alert("Favoris", "Joueur ajouté !");

  /* -----------------------------------------------------
     🔥 RENDER
  ----------------------------------------------------- */
  return (
    <SafeAreaView className="flex-1 bg-[#0d0d0f]">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800 bg-[#0d0d0f]">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full bg-gray-800"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold ml-3">
          Profil du joueur
        </Text>
      </View>

      {/* SCROLLVIEW */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: CARD_HEIGHT * 2.15,
          paddingBottom: 120,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* 🔥 CARTE (ANIMÉE ET CAPTURABLE) */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            alignItems: "center",
            transform: [
              { scale },
              { translateY: Animated.add(translateY, adjustedTranslate) },
            ],
            opacity,
          }}
        >
          <ViewShot
            ref={cardRef}
            options={{ format: "png", quality: 1 }}
            style={{ borderRadius: 20, overflow: "hidden" }}
          >
            <JoueurCard
              joueur={joueur}
              onPressActions={openSheet}
              showActionsButton={false} // 🔥 pas de bouton dans l'image capturée
            />
          </ViewShot>

          {/* VERSION AVEC BOUTON POUR L’UI */}
          <View style={{ position: "absolute" }}>
            <JoueurCard joueur={joueur} onPressActions={openSheet} />
          </View>
        </Animated.View>

        {/* INFORMATIONS */}
        <View className="px-5 mt-4">
          <Text className="text-white text-xl font-semibold mb-2">
            Informations personnelles
          </Text>

          <View className="bg-[#111] rounded-2xl p-5 border border-gray-800 shadow-lg shadow-black/40">
            <InfoRow icon="mail" label="Email" value={joueur.email} />
            <InfoRow icon="calendar" label="Naissance" value={joueur.dob} />
            <InfoRow icon="location" label="Département" value={joueur.departement} />
            <InfoRow icon="basketball" label="Club" value={joueur.club} />
            <InfoRow icon="body" label="Taille" value={joueur.taille} />
            <InfoRow icon="barbell" label="Poids" value={joueur.poids} />
            <InfoRow icon="male-female" label="Genre" value={joueur.genre} />
            <InfoRow icon="hand-right" label="Main" value={joueur.main} />
          </View>
        </View>

        {/* BOUTON CONTACT */}
        <View className="px-5 mt-10 mb-16">
          <TouchableOpacity className="bg-[#ff6600] py-4 rounded-2xl items-center shadow-lg shadow-[#ff6600]/40">
            <Text className="text-white text-lg font-semibold">
              Contacter le joueur
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* OVERLAY */}
      {isSheetOpen && (
        <TouchableOpacity
          onPress={closeSheet}
          activeOpacity={1}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* BOTTOM SHEET */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          padding: 20,
          backgroundColor: "#111",
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          transform: [{ translateY: sheetY }],
        }}
      >
        <Text className="text-white text-xl font-bold mb-4">Actions</Text>

        <Option icon="download-outline" label="Télécharger" onPress={downloadCard} />
        <Option icon="share-social-outline" label="Partager" onPress={shareCard} />
        <Option icon="star-outline" label="Favoris" onPress={addFavorite} />
      </Animated.View>
    </SafeAreaView>
  );
}

/* -----------------------------------------------------
   🔧 COMPONENT OPTION
----------------------------------------------------- */
type OptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

const Option = ({ icon, label, onPress }: OptionProps) => (
  <TouchableOpacity className="flex-row items-center py-3" onPress={onPress}>
    <View className="w-10 h-10 rounded-full bg-[#222] items-center justify-center mr-4">
      <Ionicons name={icon} size={22} color="#ff6600" />
    </View>
    <Text className="text-white text-base">{label}</Text>
  </TouchableOpacity>
);

/* -----------------------------------------------------
   🔧 INFO ROW
----------------------------------------------------- */
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) => (
  <View className="flex-row items-center mb-4">
    <View className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-3">
      <Ionicons name={icon} size={20} color="#fff" />
    </View>

    <View className="flex-1">
      <Text className="text-gray-400 text-xs">{label}</Text>
      <Text className="text-white text-base font-medium">{value ?? "-"} </Text>
    </View>
  </View>
);
