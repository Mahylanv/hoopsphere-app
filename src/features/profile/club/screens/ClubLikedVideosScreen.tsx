import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { RootStackParamList } from "../../../../types";
import { db } from "../../../../config/firebaseConfig";
import { toggleLikePost } from "../../../home/services/likeService";

type NavProp = NativeStackNavigationProp<
  RootStackParamList,
  "ClubLikedVideos"
>;

const { width } = Dimensions.get("window");
const H_PADDING = 12;
const GAP = 4;
const TILE_SIZE = (width - H_PADDING * 2 - GAP * 3) / 3;
const INITIAL_COUNT = 9;

type LikedPost = {
  id: string;
  url: string;
  playerUid: string;
  likeCount: number;
  playerAvatar?: string | null;
  likedAt?: any | null;
  postCreatedAt?: any | null;
  mediaType?: "video" | "image";
  thumbnailUrl?: string | null;
  description?: string | null;
};

export default function ClubLikedVideosScreen() {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<LikedPost[]>([]);
  const [showAll, setShowAll] = useState(false);

  const fetchLiked = useCallback(async () => {
    const uid = (await import("firebase/auth")).getAuth().currentUser?.uid;
    if (!uid) return setLoading(false);
    setLoading(true);
    try {
      const likedRef = collection(db, "clubs", uid, "likedPosts");
      const likedSnap = await getDocs(likedRef);
      const likedItems = likedSnap.docs
        .map((d) => ({
          postId: (d.data()?.postId as string) || d.id,
          likedAt: d.data()?.createdAt ?? null,
        }))
        .filter((item) => item.postId);

      const results: LikedPost[] = [];
      for (const liked of likedItems) {
        const postId = liked.postId;
        try {
          const snap = await getDoc(doc(db, "posts", postId));
          if (!snap.exists()) continue;
          const data = snap.data() as any;
          if (!data?.mediaUrl || !data?.playerUid) continue;

          let avatar: string | null = null;
          try {
            const playerSnap = await getDoc(
              doc(db, "joueurs", data.playerUid)
            );
            avatar = (playerSnap.data() as any)?.avatar ?? null;
          } catch {}

          results.push({
            id: snap.id,
            url: data.mediaUrl,
            playerUid: data.playerUid,
            likeCount: data.likeCount ?? 0,
            playerAvatar: avatar,
            likedAt: liked.likedAt,
            postCreatedAt: data.createdAt ?? null,
            mediaType: data.mediaType === "image" ? "image" : "video",
            thumbnailUrl: data.thumbnailUrl ?? null,
            description: data.description ?? null,
          });
        } catch {}
      }
      setPosts(results);
    } catch (e) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiked();
  }, [fetchLiked]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View pointerEvents="none" className="absolute inset-0">
        <LinearGradient
          colors={["#0f172a", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260 }}
        />
        <View
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full"
          style={{ backgroundColor: "rgba(249,115,22,0.18)" }}
        />
        <View
          className="absolute top-16 -left-16 w-36 h-36 rounded-full"
          style={{ backgroundColor: "rgba(37,99,235,0.18)" }}
        />
        <View
          className="absolute bottom-24 left-1/2 w-44 h-44 rounded-full"
          style={{
            backgroundColor: "rgba(249,115,22,0.1)",
            transform: [{ translateX: -88 }],
          }}
        />
        <View
          className="absolute -bottom-16 -left-14 w-40 h-40 rounded-full"
          style={{ backgroundColor: "rgba(249,115,22,0.12)" }}
        />
        <View
          className="absolute -bottom-24 right-6 w-48 h-48 rounded-full"
          style={{ backgroundColor: "rgba(37,99,235,0.12)" }}
        />
      </View>

      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <View className="flex-row items-center ml-4">
            <Text className="text-white text-xl font-bold">
              Vidéos aimées
            </Text>
          </View>
        </View>

        <View className="bg-orange-500/20 border border-orange-500 rounded-full px-3 py-1">
          <Text className="text-orange-400 font-semibold">
            {posts.length} vidéo{posts.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-400 text-center">
            Le club n'a encore aimé aucun post.
          </Text>
        </View>
      ) : (
        <FlatList
          data={showAll ? posts : posts.slice(0, INITIAL_COUNT)}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ justifyContent: "flex-start" }}
          contentContainerStyle={{
            paddingHorizontal: H_PADDING,
            paddingTop: 12,
            paddingBottom: showAll ? 16 : 0,
          }}
          ListHeaderComponent={
            <View className="px-2 pb-3">
              <Text className="text-white text-base font-semibold">
                Vidéos aimées
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isImage = item.mediaType === "image";
            const previewUrl = item.thumbnailUrl || item.url;
            const showImage = isImage || !!item.thumbnailUrl;
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate("VideoFeed", {
                    videos: posts.map((p) => ({
                      id: p.id,
                      url: p.url,
                      playerUid: p.playerUid,
                      likeCount: p.likeCount,
                      isLikedByMe: true,
                      mediaType: p.mediaType,
                      thumbnailUrl: p.thumbnailUrl ?? undefined,
                    })),
                    startIndex: posts.findIndex((p) => p.id === item.id),
                  })
                }
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  marginBottom: GAP,
                  marginHorizontal: GAP / 2,
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: "#111",
                }}
              >
                {previewUrl ? (
                  showImage ? (
                    <Image
                      source={{ uri: previewUrl }}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#000",
                      }}
                    />
                  ) : (
                    <Video
                      source={{ uri: item.url }}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#000",
                      }}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      isMuted
                      isLooping
                    />
                  )
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#000",
                    }}
                  />
                )}
                {!isImage && (
                  <View className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1">
                    <Ionicons name="play" size={12} color="#fff" />
                  </View>
                )}
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    const previous = posts;
                    setPosts((prev) => prev.filter((p) => p.id !== item.id));
                    toggleLikePost(item.id, item.playerUid).catch(() => {
                      setPosts(previous);
                    });
                  }}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                >
                  <Ionicons name="heart-dislike" size={12} color="#f97316" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            posts.length > INITIAL_COUNT ? (
              <View className="items-center pt-4 pb-16">
                <TouchableOpacity
                  onPress={() => setShowAll((prev) => !prev)}
                  className="px-6 py-2 rounded-full bg-orange-500/20 border border-orange-500/40"
                  activeOpacity={0.85}
                >
                  <Text className="text-orange-300 font-semibold">
                    {showAll ? "Voir moins" : "Voir plus"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
