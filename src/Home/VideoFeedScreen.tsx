import React, { useRef } from "react";
import {
  View,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  Share,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";

const { height, width } = Dimensions.get("window");

export default function VideoFeedScreen({ route }: any) {
  const { videos, startIndex } = route.params;

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<(Video | null)[]>([]);

  const handleShare = async (url: string) => {
    try {
      await Share.share({ message: url });
    } catch {}
  };

  const togglePlay = async (index: number) => {
    const ref = videoRefs.current[index];
    if (!ref) return;

    const status = await ref.getStatusAsync();
    if (!status.isLoaded) return;

    status.isPlaying ? ref.pauseAsync() : ref.playAsync();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <FlatList
        ref={flatListRef}
        data={videos}
        initialScrollIndex={startIndex}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        windowSize={3}
        removeClippedSubviews
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: info.index * height,
              animated: true,
            });
          }, 250);
        }}
        renderItem={({ item, index }) => (
          <View style={{ height, width }}>
            <TouchableWithoutFeedback onPress={() => togglePlay(index)}>
              <Video
                ref={(ref) => {
                  videoRefs.current[index] = ref;
                }}
                source={{ uri: item.url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                shouldPlay={index === startIndex}
                isLooping
              />
            </TouchableWithoutFeedback>

            {/* FERME */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                position: "absolute",
                top: 45,
                right: 20,
                padding: 5,
                zIndex: 20,
              }}
            >
              <Ionicons name="close" size={38} color="white" />
            </TouchableOpacity>

            {/* ACTIONS CÔTÉ DROIT */}
            <View
              style={{
                position: "absolute",
                right: 20,
                top: height * 0.35,
                alignItems: "center",
                gap: 30,
              }}
            >
              {/* AVATAR */}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("JoueurDetail", {
                    uid: item.playerUid,
                  })
                }
              >
                <Image
                  source={{
                    uri:
                      item.avatar ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={{
                    width: 65,
                    height: 65,
                    borderRadius: 40,
                    borderWidth: 2,
                    borderColor: "white",
                    backgroundColor: "#222",
                  }}
                />
              </TouchableOpacity>

              {/* SHARE */}
              <TouchableOpacity onPress={() => handleShare(item.url)}>
                <Ionicons name="share-social-outline" size={40} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
