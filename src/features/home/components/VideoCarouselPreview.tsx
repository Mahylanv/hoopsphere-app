// src/features/home/components/VideoCarouselPreview.tsx
// Composant d'aperçu de carrousel vidéo avec miniatures générées

import React, { useRef, useMemo } from "react";
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

type Navigation = NativeStackNavigationProp<RootStackParamList, "Home">;

<<<<<<< HEAD
=======
/* ============================================================
   TYPES
============================================================ */
>>>>>>> 0b975af (merge de feature/like et feature/accueil)
type VideoItem = {
  id: string; // postId
  url: string;
  playerUid: string;
  avatar?: string;
  likeCount: number;
  isLikedByMe: boolean;
};
<<<<<<< HEAD
=======

>>>>>>> 0b975af (merge de feature/like et feature/accueil)

const { width } = Dimensions.get("window");

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function VideoCarouselPreview({
  videos,
}: {
  videos: VideoItem[];
}) {
  const navigation = useNavigation<Navigation>();

  /**
   * ✅ Sélection stable
   * (pas de random → meilleure UX)
   */
  const previewVideos = useMemo(() => {
    return videos.slice(0, 3);
  }, [videos]);

  if (previewVideos.length === 0) return null;

  return (
    <View className="mt-10 px-5">
      <Text className="text-white text-xl font-bold mb-4">
        Vidéos populaires
      </Text>

      <View className="flex-col">
        {previewVideos.map((video, index) => (
          <VideoPreviewItem
            key={video.id ?? `${video.playerUid}-${index}`}
            index={index}
            video={video}
            videos={videos}
            navigation={navigation}
          />
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
  /* -------------------------------
     Animation fade-in
  -------------------------------- */
  const fadeAnim = useRef(new Animated.Value(0)).current;

  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 350,
    useNativeDriver: true,
  }).start();

  return (
    <Animated.View
      style={{
        width: width - 40,
        height: 160,
        marginBottom: 20,
        opacity: fadeAnim,
      }}
      className="rounded-2xl overflow-hidden bg-[#111]"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        className="w-full h-full"
        onPress={() =>
          navigation.navigate("VideoFeed", {
            startIndex: index,
            videos,
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
    </Animated.View>
  );
}
