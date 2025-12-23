import React, { useRef, useState } from "react";
import { TouchableOpacity, Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { toggleLikePost } from "../services/likeService";

type Props = {
  postId: string;
  postOwnerUid: string;
  initialLiked: boolean;
  initialLikeCount: number;
};

export default function LikeButton({
  postId,
  postOwnerUid,
  initialLiked,
  initialLikeCount,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikeCount);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateLike = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.4,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPress = async () => {
    animateLike();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic UI
    setLiked((prev) => !prev);
    setCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      await toggleLikePost(postId, postOwnerUid);
    } catch (error) {
      // rollback en cas d’erreur
      setLiked(initialLiked);
      setCount(initialLikeCount);
      console.error("Like error:", error);
    }
  };

  return (
    <View className="items-center gap-1">
      <TouchableOpacity
        onPress={onPress}
        className="bg-black/40 rounded-full p-3"
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={28}
            color={liked ? "#ff2d55" : "white"}
          />
        </Animated.View>
      </TouchableOpacity>

      <Text className="text-white text-xs font-semibold">
        {count > 0 ? count : ""}
      </Text>
    </View>
  );
}
