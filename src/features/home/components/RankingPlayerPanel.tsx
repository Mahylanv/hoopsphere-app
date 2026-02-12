// src/Home/components/RankingPlayerPanel.tsx

import React, { useEffect } from "react";
import {
  Dimensions,
  Modal,
  Platform,
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
import AvatarSection from "../../profile/player/components/AvatarSection";
import { RankingPlayer } from "../hooks/usePlayerRanking";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");
const isAndroid =
  (Platform as unknown as { OS: string }).OS === "android";

const IS_SMALL_PHONE = width <= 360 || height <= 700;

// ⭐ CONFIG MODIFIABLES PAR TOI
const IOS_PANEL_HEIGHT_RATIO = 0.85;
const ANDROID_PANEL_HEIGHT_RATIO = 0.88;
const ANDROID_PANEL_TOP = height * (1 - ANDROID_PANEL_HEIGHT_RATIO);
const PANEL_HEIGHT = isAndroid ? 0.9 : IOS_PANEL_HEIGHT_RATIO; // Android: plus haut
const PANEL_TOP = isAndroid
  ? height * 0.1
  : height * (1 - IOS_PANEL_HEIGHT_RATIO); // iOS: ouvre à 75% max (panel démarre à 25%)
const CLOSE_THRESHOLD = height * 0.22; // Distance pour fermer le panel en glissant

// Carte responsive (plus compacte)
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = CARD_WIDTH * 0.75;
const CARD_SCALE = Math.min(1, (width * 0.75) / 420); // reduit un peu plus sur petits ecrans
const SMALL_PHONE_CARD_SCALE = Math.min(0.74, (width - 20) / 460);

const ANDROID_SMALL_CARD_SCALE = IS_SMALL_PHONE
  ? SMALL_PHONE_CARD_SCALE
  : CARD_SCALE;
const AVATAR_LAYOUT_HEIGHT = 632;
const SMALL_PHONE_CARD_OFFSET_TOP = -86;
const SMALL_PHONE_CARD_MARGIN_BOTTOM = -Math.round(
  AVATAR_LAYOUT_HEIGHT * (1 - ANDROID_SMALL_CARD_SCALE)
);
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

  let navigation: any = null;
  try {
    navigation = useNavigation();
  } catch {
    navigation = null;
  }

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
    premium: player.premium,
    cardStyle:
      player.cardStyle ?? (player.premium ? "premium" : "normal"),
  };

  if (isAndroid) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <View
          className="flex-1 bg-black"
          style={{ paddingTop: ANDROID_PANEL_TOP }}
        >
          <View className="flex-1 bg-black rounded-t-3xl overflow-hidden">
            <View className="px-4 py-3 border-b border-white/10 flex-row items-center">
              <Pressable onPress={onClose} className="p-2">
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </Pressable>
              <Text className="text-white text-base font-semibold ml-2">
                Profil du Joueur
              </Text>
            </View>

            <Animated.ScrollView
              scrollEnabled={!IS_SMALL_PHONE}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: IS_SMALL_PHONE ? 8 : 0,
                paddingBottom: IS_SMALL_PHONE ? 16 : 24,
                alignItems: "center",
                flexGrow: IS_SMALL_PHONE ? 1 : 0,
              }}
            >
            <View
              style={{
                transform: [
                  {
                    scale: Math.min(
                      1,
                      ANDROID_SMALL_CARD_SCALE + (IS_SMALL_PHONE ? 0.04 : 0.06)
                    ),
                  },
                ],
                alignItems: "center",
                marginTop: IS_SMALL_PHONE ? SMALL_PHONE_CARD_OFFSET_TOP : 8,
                marginBottom: IS_SMALL_PHONE ? SMALL_PHONE_CARD_MARGIN_BOTTOM : 0,
              }}
            >
                <AvatarSection
                  user={{
                    avatar: joueurFull.avatar ?? null,
                    prenom: joueurFull.prenom ?? "",
                    nom: joueurFull.nom ?? "",
                    dob: joueurFull.dob,
                    taille: joueurFull.taille,
                    poids: joueurFull.poids,
                    poste: joueurFull.poste,
                    main: joueurFull.main,
                    departement: joueurFull.departement,
                    club: joueurFull.club,
                    premium: joueurFull.premium,
                    cardStyle: joueurFull.cardStyle,
                  }}
                  onEditAvatar={async () => {}}
                  avatarLoading={false}
                  stats={player.stats}
                  rating={player.rating}
                  editable={false}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  if (navigation?.navigate) {
                    setTimeout(() => {
                      navigation.navigate("JoueurDetail", {
                        uid: player.uid,
                      });
                    }, 200);
                  }
                }}
                className="px-5 py-3 rounded-full bg-orange-500/90 flex-row items-center justify-center shadow-lg shadow-orange-500/30"
              style={{
                marginTop: IS_SMALL_PHONE ? 60 : 16,
              }}
                activeOpacity={0.9}
              >
                <Ionicons name="person" size={18} color="#fff" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Voir profil complet
                </Text>
              </TouchableOpacity>
            </Animated.ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <GestureHandlerRootView className="absolute inset-0 z-[9999]">
      {/* -------------------------------------------------- */}
      {/* ⭐ BACKDROP (clic extérieur = ferme le panel) */}
      {/* -------------------------------------------------- */}
      <Pressable className="absolute inset-0" onPress={onClose}>
        <Animated.View style={backdropStyle} className="absolute inset-0">
          {isAndroid ? (
            <View className="absolute inset-0 bg-black/70" />
          ) : (
            <BlurView intensity={30} tint="dark" className="absolute inset-0" />
          )}
        </Animated.View>
      </Pressable>

      {/* -------------------------------------------------- */}
      {/* ⭐ BOTTOM SHEET PANEL */}
      {/* -------------------------------------------------- */}
      <PanGestureHandler onGestureEvent={onGesture} onEnded={onGestureEnd}>
        <Animated.View
          style={[
            panelStyle,
            {
              height: height * PANEL_HEIGHT,
              ...(isAndroid
                ? {}
                : { maxHeight: height * IOS_PANEL_HEIGHT_RATIO }),
            },
            isAndroid
              ? { backgroundColor: "rgba(8, 8, 8, 0.96)" }
              : null,
          ]}
          className="absolute left-0 right-0 rounded-t-3xl shadow-2xl shadow-black/70 p-4 overflow-hidden"
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

          <Text className="text-white text-xl font-bold text-center" numberOfLines={1}>
            Profil du Joueur
          </Text>

          {/* ⭐ CONTENU ANIMÉ */}
          <Animated.ScrollView
            style={contentStyle}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 0,
              alignItems: "center",
              gap: 0,
            }}
          >
            <View
              style={{
                transform: [{ scale: CARD_SCALE }],
                alignItems: "center",
                marginTop: -80,
              }}
            >
              <AvatarSection
                user={{
                  avatar: joueurFull.avatar ?? null,
                  prenom: joueurFull.prenom ?? "",
                  nom: joueurFull.nom ?? "",
                  dob: joueurFull.dob,
                  taille: joueurFull.taille,
                  poids: joueurFull.poids,
                  poste: joueurFull.poste,
                  main: joueurFull.main,
                  departement: joueurFull.departement,
                  club: joueurFull.club,
                  premium: joueurFull.premium,
                  cardStyle: joueurFull.cardStyle,
                }}
                onEditAvatar={async () => {}}
                avatarLoading={false}
                stats={player.stats}
                rating={player.rating}
                editable={false}
              />
            </View>

            {/* ⭐ Bouton profil */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                if (navigation?.navigate) {
                  setTimeout(() => {
                    navigation.navigate("JoueurDetail", {
                      uid: player.uid,
                    });
                  }, 200);
                }
              }}
              className="mt-[-30px] px-5 py-3 rounded-full bg-orange-500/90 flex-row items-center justify-center shadow-lg shadow-orange-500/30"
              activeOpacity={0.9}
            >
              <Ionicons name="person" size={18} color="#fff" />
              <Text className="text-white font-semibold text-lg ml-2">
                Voir profil complet
              </Text>
            </TouchableOpacity>
          </Animated.ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}





