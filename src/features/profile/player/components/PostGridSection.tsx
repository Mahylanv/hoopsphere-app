// src/Profil/Joueur/components/PostGridSection.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const ITEM_SIZE = width / 2 - 20;

/* ============================================================
   TYPES
============================================================ */
export type PostItem = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  postType: "highlight" | "match" | "training";
  visibility: "public" | "private";
};

type Props = {
  posts: PostItem[];
  onOpenPost: (post: PostItem, index: number) => void;
  onCreatePost: () => void;
};

/* ============================================================
   COMPONENT
============================================================ */
export default function PostGridSection({
  posts,
  onOpenPost,
  onCreatePost,
}: Props) {
  const isEmpty = !posts || posts.length === 0;

  return (
    <View className="mt-10 px-4">
      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-4 px-1">
        <View className="flex-row items-center">
          <Ionicons name="play-outline" size={22} color="white" />
          <Text className="text-xl font-bold text-white ml-2">
            Publications
          </Text>
        </View>

        {/* CREATE POST */}
        <TouchableOpacity
          onPress={onCreatePost}
          className="flex-row items-center bg-orange-500 px-4 py-2 rounded-full"
        >
          <Ionicons name="add" size={18} color="white" />
          <Text className="text-white font-semibold ml-1">
            Publier
          </Text>
        </TouchableOpacity>
      </View>

      {/* EMPTY STATE */}
      {isEmpty ? (
        <View className="items-center justify-center py-16 bg-[#151a20] rounded-3xl border border-gray-800">
          <Ionicons name="videocam-outline" size={42} color="#6b7280" />
          <Text className="text-gray-400 text-base mt-3 text-center">
            Aucune publication pour le moment
          </Text>
        </View>
      ) : (
        /* GRID */
        <FlatList
          data={posts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ gap: 14 }}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onOpenPost(item, index)}
              style={{
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: "#0f1115",
              }}
            >
              {/* MEDIA */}
              {item.mediaType === "image" ? (
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Video
                    source={{ uri: item.mediaUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isMuted
                  />

                  {/* VIDEO ICON */}
                  <View className="absolute top-3 right-3 bg-black/60 p-1.5 rounded-full">
                    <Ionicons name="play" size={18} color="white" />
                  </View>
                </>
              )}

              {/* GRADIENT OVERLAY */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 10,
                }}
              >
                <View className="flex-row items-center justify-between">
                  {/* POST TYPE */}
                  <View className="bg-black/60 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                      {item.postType.toUpperCase()}
                    </Text>
                  </View>

                  {/* PRIVATE */}
                  {item.visibility === "private" && (
                    <Ionicons
                      name="lock-closed"
                      size={14}
                      color="white"
                    />
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
