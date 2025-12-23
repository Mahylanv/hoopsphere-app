// src/features/home/components/LikeButton.tsx

import React, { useRef } from "react";
import { TouchableOpacity, Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
};

export default function LikeButton({
  liked,
  likeCount,
  onToggleLike,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animate = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPress = () => {
    animate();
    onToggleLike();
  };

  return (
    <View className="items-center gap-1">
      <TouchableOpacity
        onPress={onPress}
        className="bg-black/40 rounded-full p-3"
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
        {likeCount > 0 ? likeCount : ""}
      </Text>
    </View>
  );
}
