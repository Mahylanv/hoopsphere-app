// src/features/home/screens/VideoFeedScreen.tsx

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  Share,
  Animated,
  Easing,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { PROFILE_PLACEHOLDER } from "../../../constants/images";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../types";
import * as Haptics from "expo-haptics";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

import LikeButton from "../components/LikeButton";
import { useVideoLikes } from "../hooks/useVideoLikes";
import VideoDescription from "../components/VideoDescription";
import { VideoItem } from "../../../types";


const { height, width } = Dimensions.get("window");

/* ============================================================
   TYPES
============================================================ */

type Props = {
  route: {
    params: {
      videos: VideoItem[];
      startIndex: number;
    };
  };
};

/* ============================================================
   SCREEN
============================================================ */
export default function VideoFeedScreen({ route }: Props) {
  const { startIndex, videos: initialVideos } = route.params;
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const flatListRef = useRef<FlatList<VideoItem>>(null);
  const videoRefs = useRef<(Video | null)[]>([]);

  /* ============================================================
     LIKE LOGIC (HOOK)
  ============================================================ */
  const { toggleLike } = useVideoLikes(videos, setVideos);

  /* ============================================================
     DOUBLE TAP / SINGLE TAP
  ============================================================ */
  const lastTap = useRef<number>(0);
  const singleTapTimeout = useRef<NodeJS.Timeout | null>(null);
  const DOUBLE_TAP_DELAY = 300;

  /* ============================================================
     ANIMATIONS
  ============================================================ */
  const pauseAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;

  const showPauseIcon = () => {
    Animated.timing(pauseAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const hidePauseIcon = () => {
    Animated.timing(pauseAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const triggerHeartAnimation = () => {
    setShowHeart(true);
    heartScale.setValue(0);

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 300,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHeart(false));
  };

  /* ============================================================
     AUTOPLAY
  ============================================================ */
  useEffect(() => {
    videoRefs.current.forEach(async (video, index) => {
      if (!video) return;

      try {
        if (index === activeIndex) {
          await video.setIsMutedAsync(false);
          await video.playAsync();
        } else {
          await video.pauseAsync();
        }
      } catch {}
    });

    setIsPaused(false);
    hidePauseIcon();
  }, [activeIndex]);

  /* ============================================================
     PAUSE WHEN LEAVING SCREEN
  ============================================================ */
  useFocusEffect(
    useCallback(() => {
      return () => {
        videoRefs.current.forEach(async (video) => {
          try {
            await video?.pauseAsync();
          } catch {}
        });
      };
    }, [])
  );

  /* ============================================================
     LOAD AVATARS (ONCE)
  ============================================================ */
  useEffect(() => {
    const fetchAvatars = async () => {
      const updated = await Promise.all(
        videos.map(async (video) => {
          if (video.avatar) return video;

          try {
            const snap = await getDoc(doc(db, "joueurs", video.playerUid));
            return {
              ...video,
              avatar: snap.exists() ? (snap.data().avatar ?? null) : null,
            };
          } catch {
            return video;
          }
        })
      );

      setVideos(updated);
    };

    fetchAvatars();
  }, []);

  /* ============================================================
     VIEWABLE ITEM
  ============================================================ */
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null && index !== undefined) {
        setActiveIndex(index);
      }
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  /* ============================================================
     ACTIONS
  ============================================================ */
  const handleVideoTap = (index: number) => {
    const now = Date.now();

    if (singleTapTimeout.current) {
      clearTimeout(singleTapTimeout.current);
      singleTapTimeout.current = null;
    }

    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      triggerHeartAnimation();
      toggleLike(index);
    } else {
      singleTapTimeout.current = setTimeout(() => {
        togglePlay(index);
        singleTapTimeout.current = null;
      }, DOUBLE_TAP_DELAY);
    }

    lastTap.current = now;
  };

  const togglePlay = async (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const status = (await video.getStatusAsync()) as AVPlaybackStatus;
    if (!status.isLoaded) return;

    await Haptics.selectionAsync();

    if (status.isPlaying) {
      await video.pauseAsync();
      setIsPaused(true);
      showPauseIcon();
    } else {
      await video.playAsync();
      setIsPaused(false);
      hidePauseIcon();
    }
  };

  const toggleMute = async () => {
    const video = videoRefs.current[activeIndex];
    if (!video) return;

    const status = (await video.getStatusAsync()) as AVPlaybackStatus;
    if (!status.isLoaded) return;

    await video.setIsMutedAsync(!status.isMuted);
    setIsMuted(!status.isMuted);
    Haptics.selectionAsync();
  };

  const handleShare = async (url: string) => {
    try {
      await Share.share({ message: url });
    } catch {}
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <FlatList
        ref={flatListRef}
        data={videos}
        pagingEnabled
        initialScrollIndex={startIndex}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        windowSize={5}
        removeClippedSubviews={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        renderItem={({ item, index }) => {
          const isImage = item.mediaType === "image";
          const mediaFit = item.mediaFit ?? "cover";
          return (
          <View style={{ height, width }}>
            <TouchableWithoutFeedback onPress={() => handleVideoTap(index)}>
              <View style={{ width: "100%", height: "100%" }}>
                {isImage ? (
                  <Image
                    source={{ uri: item.url }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Video
                    ref={(ref) => {
                      videoRefs.current[index] = ref;
                    }}
                    source={{ uri: item.cachedUrl || item.url }}
                    style={{ width: "100%", height: "100%", backgroundColor: "#000" }}
                    resizeMode={
                      mediaFit === "contain"
                        ? ResizeMode.CONTAIN
                        : ResizeMode.COVER
                    }
                    isLooping
                    shouldPlay={index === activeIndex} // 🔥 AUTOPLAY
                    isMuted={false}
                  />
                )}

                {isPaused && index === activeIndex && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: [
                        { translateX: -40 },
                        { translateY: -40 },
                        { scale: pauseAnim },
                      ],
                      opacity: pauseAnim,
                    }}
                  >
                    <Ionicons name="pause-circle" size={80} color="white" />
                  </Animated.View>
                )}

                {showHeart && index === activeIndex && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: [
                        { translateX: -50 },
                        { translateY: -50 },
                        { scale: heartScale },
                      ],
                    }}
                  >
                    <Ionicons name="heart" size={100} color="#ff2d55" />
                  </Animated.View>
                )}
              </View>
            </TouchableWithoutFeedback>

            {/* CLOSE */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ position: "absolute", top: 45, right: 20 }}
            >
              <Ionicons name="close" size={38} color="white" />
            </TouchableOpacity>

            {/* ACTIONS */}
            <View className="absolute right-4 top-[35%] items-center gap-6">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("JoueurDetail", {
                    uid: item.playerUid,
                  })
                }
              >
                <Image
                  source={
                    item.avatar &&
                    item.avatar.trim() !== "" &&
                    item.avatar !== "null" &&
                    item.avatar !== "undefined"
                      ? { uri: item.avatar }
                      : PROFILE_PLACEHOLDER
                  }
                  className="w-16 h-16 rounded-full border-2 border-white"
                />
              </TouchableOpacity>

              <LikeButton
                liked={item.isLikedByMe}
                likeCount={item.likeCount}
                onToggleLike={() => toggleLike(index)}
              />

              <TouchableOpacity onPress={() => handleShare(item.url)}>
                <Ionicons name="share-social-outline" size={26} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleMute}>
                <Ionicons
                  name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
            <VideoDescription
              description={item.description}
              location={item.location}
              createdAt={item.createdAt}
              skills={item.skills}
            />
          </View>
        );
        }}
      />
    </View>
  );
}
