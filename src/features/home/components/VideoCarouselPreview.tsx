import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions, Animated, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Video, ResizeMode } from "expo-av";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../types";

type Navigation = NativeStackNavigationProp<RootStackParamList, "Home">;

interface VideoItem {
  url: string;
  playerUid: string;
}

const { width } = Dimensions.get("window");

export default function VideoCarouselPreview({ videos }: { videos: VideoItem[] }) {
  const navigation = useNavigation<Navigation>();

  const previewVideos = videos.sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <View className="mt-10 px-5">
      <Text className="text-white text-xl font-bold mb-4">Vidéos populaires</Text>

      <View className="flex-col">
        {previewVideos.map((v, index) => (
          <VideoPreviewItem
            key={index}
            index={index}
            video={v}
            videos={videos}
            navigation={navigation}
          />
        ))}
      </View>
    </View>
  );
}

/* ---------------------------------------------
 🔥 Composant individuel avec miniature générée
----------------------------------------------*/
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
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loadingThumb, setLoadingThumb] = useState(true);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 400,
    useNativeDriver: true,
  }).start();

  // 🔥 Génération de la miniature automatique
  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(video.url, {
          time: 500, // ms → 0.5s dans la vidéo
        });
        setThumbnail(uri);
      } catch (e) {
        console.log("Erreur miniature:", e);
        setThumbnail(null);
      } finally {
        setLoadingThumb(false);
      }
    };

    generateThumbnail();
  }, []);

  return (
    <Animated.View
      style={{
        width: width - 40,
        height: 160,
        marginBottom: 20,
        opacity: fadeAnim,
      }}
      className="rounded-2xl overflow-hidden bg-black"
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
        {/* Si miniature OK → on l'affiche */}
        {!loadingThumb && thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          // Fallback loading
          <View className="w-full h-full bg-gray-800 items-center justify-center">
            <Ionicons name="image" size={40} color="#aaa" />
          </View>
        )}

        {/* Overlay sombre */}
        <View className="absolute inset-0 bg-black/20" />

        {/* Bouton Play */}
        <View className="absolute top-1/2 left-1/2 -translate-x-6 -translate-y-6">
          <Ionicons name="play-circle" size={48} color="white" />
        </View>

        {/* Dégradé bas */}
        <View className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
      </TouchableOpacity>
    </Animated.View>
  );
}
