// src/Home/components/RankingPlayerPanel.tsx

import React, { useEffect } from "react";
import {
  Dimensions,
  Text,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import { BlurView } from "expo-blur";
import JoueurCard from "../../Components/JoueurCard";
import { RankingPlayer } from "../../hooks/usePlayerRanking";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

// ⭐ CONFIG MODIFIABLES PAR TOI
const PANEL_HEIGHT = 0.88; // 88% d'écran → modifie pour changer la hauteur
const PANEL_TOP = height * 0.1; // Position d’ouverture → 10% du haut
const CLOSE_THRESHOLD = height * 0.22; // Distance pour fermer le panel en glissant

export default function RankingPlayerPanel({
  visible,
  player,
  onClose,
}: {
  visible: boolean;
  player: RankingPlayer | null;
  onClose: () => void;
}) {
  // -------------------------------------
  // SHARED VALUES
  // -------------------------------------
  const translateY = useSharedValue(height);
  const dragY = useSharedValue(0);

  const backdropOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);

  const navigation = useNavigation();

  // -------------------------------------
  // OPEN / CLOSE ANIMATIONS
  // -------------------------------------
  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(PANEL_TOP, {
        duration: 280,
        easing: Easing.out(Easing.exp),
      });
      contentOpacity.value = withTiming(1, { duration: 250 });
      contentScale.value = withTiming(1, { duration: 250 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      contentOpacity.value = withTiming(0, { duration: 150 });
      contentScale.value = withTiming(0.9, { duration: 150 });

      translateY.value = withTiming(
        height,
        { duration: 250, easing: Easing.in(Easing.exp) },
        () => runOnJS(onClose)()
      );
    }
  }, [visible]);

  // -------------------------------------
  // UNIQUE DRAG HANDLER → PANEL SUIT LE DOIGT
  // -------------------------------------
  const onGesture = (event: PanGestureHandlerGestureEvent) => {
    const t = event.nativeEvent.translationY;

    // Empêche de monter plus haut que l'ouverture
    if (t < 0) {
      dragY.value = 0;
      translateY.value = PANEL_TOP;
      return;
    }

    dragY.value = t;
    translateY.value = PANEL_TOP + dragY.value;
  };

  const onGestureEnd = () => {
    if (dragY.value > CLOSE_THRESHOLD) {
      // Fermer panel
      translateY.value = withTiming(height, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
      runOnJS(onClose)();
    } else {
      // Revenir en place
      translateY.value = withTiming(PANEL_TOP, {
        duration: 250,
        easing: Easing.out(Easing.exp),
      });
    }
    dragY.value = 0;
  };

  // -------------------------------------
  // ANIMATED STYLES
  // -------------------------------------
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  // -------------------------------------
  // NE PAS RENDRE SI PAS VISIBLE
  // -------------------------------------
  if (!visible || !player) return null;

  // Joueur complet
  const joueurFull = {
    uid: player.uid,
    prenom: player.prenom,
    nom: player.nom,
    avatar: player.avatar,
    poste: player.poste,
    email: player.email ?? "",
    dob: player.dob ?? "",
    taille: player.taille ?? "",
    poids: player.poids ?? "",
    main: player.main ?? "",
    departement: player.departement ?? "",
    club: player.club ?? "",
    genre: player.genre ?? "",
    createdAt: player.createdAt ?? null,
  };

  return (
    <GestureHandlerRootView className="absolute inset-0 z-[9999]">
      {/* -------------------------------------------------- */}
      {/* ⭐ BACKDROP (clic extérieur = ferme le panel) */}
      {/* -------------------------------------------------- */}
      <Pressable className="absolute inset-0" onPress={onClose}>
        <Animated.View style={backdropStyle} className="absolute inset-0">
          <BlurView intensity={30} tint="dark" className="absolute inset-0" />
        </Animated.View>
      </Pressable>

      {/* -------------------------------------------------- */}
      {/* ⭐ BOTTOM SHEET PANEL */}
      {/* -------------------------------------------------- */}
      <PanGestureHandler onGestureEvent={onGesture} onEnded={onGestureEnd}>
        <Animated.View
          style={panelStyle}
          className="absolute left-0 right-0 rounded-t-3xl shadow-2xl shadow-black/70 p-4"
        >
          {/* ⭐ BARRE DE DRAG */}
          <TouchableOpacity
            onPress={onClose}
            className="self-center mt-1 mb-3 w-12 h-1.5 bg-gray-400/70 rounded-full"
          />

          {/*  AVANT le TEST Partie correct  */}
          {/* <Text className="text-white text-xl font-bold text-center mb-4">
            Profil du Joueur
          </Text> */}

          {/* APRES POUR TEST VERSION WEB */}

          <View className="flex-row items-center justify-between mb-4 px-2">
            <View className="flex-1" />

            <Text className="text-white text-xl font-bold text-center flex-1">
              Profil du Joueur
            </Text>

            <TouchableOpacity
              onPress={() => {
                onClose();
                setTimeout(() => {
                  (navigation as any).navigate("JoueurDetail", {
                    uid: player.uid,
                  });
                }, 200);
              }}
              className="flex-1 items-end"
            >
              <Ionicons name="open-outline" size={22} color="#F97316" />
            </TouchableOpacity>
          </View>

          {/* ⭐ CONTENU ANIMÉ */}
          <Animated.View style={contentStyle} className="flex-1">
            <JoueurCard
              joueur={joueurFull}
              stats={player.stats}
              rating={player.rating}
              showActionsButton={false}
            />

            {/* ⭐ Bouton profil */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                setTimeout(() => {
                  (navigation as any).navigate("JoueurDetail", {
                    uid: player.uid,
                  });
                }, 200);
              }}
              className="mt-5 bg-orange-500 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">
                Voir Profil Complet
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}
