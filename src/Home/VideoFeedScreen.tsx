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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import * as Haptics from "expo-haptics";

const { height, width } = Dimensions.get("window");

type VideoItem = {
  url: string;
  playerUid: string;
  avatar?: string;
};

type Props = {
  route: {
    params: {
      videos: VideoItem[];
      startIndex: number;
    };
  };
};

export default function VideoFeedScreen({ route }: Props) {
  const { videos, startIndex } = route.params;

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const flatListRef = useRef<FlatList<VideoItem>>(null);
  const videoRefs = useRef<(Video | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const pauseAnim = useRef(new Animated.Value(0)).current;

  /* ============================================================
     AUTOPLAY + PAUSE AUTO
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
     PAUSE QUAND ÉCRAN QUITTÉ
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
     ANIMATIONS
  ============================================================ */
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

  /* ============================================================
     ACTIONS
  ============================================================ */
  const handleShare = async (url: string) => {
    try {
      await Share.share({ message: url });
    } catch {}
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

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <FlatList
        ref={flatListRef}
        data={videos}
        initialScrollIndex={startIndex}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        windowSize={5}
        removeClippedSubviews={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={{ height, width }}>
            <TouchableWithoutFeedback onPress={() => togglePlay(index)}>
              <View style={{ width: "100%", height: "100%" }}>
                <Video
                  ref={(ref) => {
                    videoRefs.current[index] = ref;
                  }}
                  source={{ uri: item.url }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping
                  onLoad={() => {
                    if (index === activeIndex) {
                      videoRefs.current[index]?.playAsync();
                    }
                    // 🔥 preload implicite de la suivante
                    const nextVideo = videoRefs.current[index + 1];
                    nextVideo?.getStatusAsync();
                  }}
                />

                {isPaused && index === activeIndex && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: [
                        { translateX: -40 },
                        { translateY: -40 },
                        {
                          scale: pauseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                      opacity: pauseAnim,
                    }}
                  >
                    <Ionicons name="pause-circle" size={80} color="white" />
                  </Animated.View>
                )}
              </View>
            </TouchableWithoutFeedback>

            {/* CLOSE */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                position: "absolute",
                top: 45,
                right: 20,
                zIndex: 20,
              }}
            >
              <Ionicons name="close" size={38} color="white" />
            </TouchableOpacity>

            {/* ACTIONS */}
            <View className="absolute right-4 top-[35%] items-center gap-6">
              {/* AVATAR */}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("JoueurDetail", {
                    uid: item.playerUid,
                  })
                }
                className="bg-black/40 rounded-full p-1"
              >
                <Image
                  source={{
                    uri:
                      item.avatar ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  className="w-16 h-16 rounded-full border-2 border-white"
                />
              </TouchableOpacity>

              {/* SHARE */}
              <TouchableOpacity className="bg-black/40 rounded-full p-3">
                <Ionicons
                  name="share-social-outline"
                  size={26}
                  color="white"
                  onPress={() => handleShare(item.url)}
                />
              </TouchableOpacity>

              {/* MUTE / UNMUTE */}
              <TouchableOpacity
                onPress={toggleMute}
                className="bg-black/40 rounded-full p-3"
              >
                <Ionicons
                  name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
