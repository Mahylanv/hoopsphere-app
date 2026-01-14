// src/features/home/components/VideoCarouselPreview.tsx
// Composant d'aperçu de carrousel vidéo avec miniatures générées

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../types";
import { VideoItem } from "../../../types";
import { LinearGradient } from "expo-linear-gradient";


type Navigation = NativeStackNavigationProp<RootStackParamList, "Home">;

/* ============================================================
   TYPES
============================================================ */

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");
const PREVIEW_WIDTH = Math.min(width * 0.72, 360);
const PREVIEW_HEIGHT = PREVIEW_WIDTH * (15 / 9); // légèrement moins haut que 9:16
const PREVIEW_GAP = 20;
const SECTION_TOP_OFFSET = 96;

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function VideoCarouselPreview({
  videos,
  visibleCount = 3,
  scrollY,
  sectionOffset = 0,
}: {
  videos: VideoItem[];
  visibleCount?: number;
  scrollY?: Animated.Value;
  sectionOffset?: number;
}) {
  const navigation = useNavigation<Navigation>();
  const brand = {
    orange: "#F97316",
    blue: "#2563EB",
    surface: "#0E0D0D",
  } as const;

  const getAnimatedStyle = (index: number) => {
    if (!scrollY) {
      return {
        opacity: 1,
        transform: [{ translateY: 0 }],
      };
    }

    const itemTop =
      sectionOffset + SECTION_TOP_OFFSET + index * (PREVIEW_HEIGHT + PREVIEW_GAP);
    const inputRange = [
      itemTop - height * 0.65,
      itemTop - height * 0.4,
    ];

    return {
      opacity: scrollY.interpolate({
        inputRange,
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange,
            outputRange: [24, 0],
            extrapolate: "clamp",
          }),
        },
      ],
    };
  };

  if (videos.length === 0) return null;
  const previewVideos = videos.slice(0, visibleCount);

  return (
    <View className="mt-10 px-5">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <LinearGradient
            colors={[brand.orange, brand.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Ionicons name="play-circle" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text className="text-white text-xl font-bold">
              Vidéos populaires
            </Text>
            <Text className="text-gray-400 text-xs">Highlights en tendance</Text>
          </View>
        </View>
      </View>

      <View className="flex-col" style={{ alignItems: "center" }}>
        {previewVideos.map((video, index) => (
          <Animated.View
            key={video.id ?? `${video.playerUid}-${index}`}
            style={[
              {
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
                marginBottom: PREVIEW_GAP,
                alignSelf: "center",
              },
              getAnimatedStyle(index),
            ]}
          >
            <VideoPreviewItem
              index={index}
              video={video}
              videos={videos}
              navigation={navigation}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

/* ============================================================
   VIDEO PREVIEW ITEM
   👉 Premier frame vidéo (comme ProfilJoueur)
============================================================ */
function VideoPreviewItem({
  video,
  index,
  videos,
  navigation,
}: {
  video: VideoItem;
  index: number;
  videos: VideoItem[];
  navigation: Navigation;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="w-full h-full rounded-2xl overflow-hidden bg-[#111]"
      onPress={() =>
        navigation.navigate("VideoFeed", {
          startIndex: index,
          videos: videos.map((v) => ({
            id: v.id,
            url: v.url,
            playerUid: v.playerUid,
            avatar: v.avatar ?? null, // ✅ PROPAGATION EXPLICITE
            likeCount: v.likeCount ?? 0,
            isLikedByMe: v.isLikedByMe ?? false,
            description: v.description ?? null,
            location: v.location ?? null,
            createdAt: v.createdAt,
            skills: v.skills ?? [],
          })),
        })
      }
    >
      {/* ====================================================
          🎥 VIDEO PREVIEW (FRAME STATIQUE)
         ==================================================== */}
      <Video
        source={{ uri: video.url }}
        style={{ width: "100%", height: "100%" }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isMuted
      />

      {/* Overlay léger */}
      <View className="absolute inset-0 bg-black/25" />

      {/* Bouton Play central */}
      <View className="absolute top-1/2 left-1/2 -translate-x-7 -translate-y-7">
        <Ionicons name="play-circle" size={56} color="white" />
      </View>

      {/* Dégradé bas */}
      <View className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
    </TouchableOpacity>
  );
}
