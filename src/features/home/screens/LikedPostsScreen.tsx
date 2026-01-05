// src/features/home/screens/LikedPostsScreen.tsx
// Écran Premium – Posts likés par l'utilisateur

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { toggleLikePost } from "../services/likeService";
import { RootStackParamList } from "../../../types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { height, width } = Dimensions.get("window");
const tileSize = (width - 32) / 2; // 2 colonnes avec marges

type LikedPost = {
  id: string;
  url: string;
  playerUid: string;
  likeCount: number;
  likedAt?: any | null;
  postCreatedAt?: any | null;
};

type NavProp = NativeStackNavigationProp<RootStackParamList, "LikedPosts">;

const toDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (value: any) => {
  const d = toDate(value);
  if (!d) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function LikedPostsScreen() {
  const navigation = useNavigation<NavProp>();
  const auth = getAuth();
  const db = getFirestore();

  const [posts, setPosts] = useState<LikedPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchLikedPosts = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      try {
        const results: LikedPost[] = [];

        // 1️⃣ Essai via sous-collection likedPosts (autorisée par les règles)
        try {
          const likedRef = collection(db, "joueurs", user.uid, "likedPosts");
          const likedSnap = await getDocs(likedRef);

          if (!likedSnap.empty) {
            for (const likedDoc of likedSnap.docs) {
              const data = likedDoc.data();
              const postId = likedDoc.id;
              const postRef = doc(db, "posts", postId);
              const postSnap = await getDoc(postRef);
              if (!postSnap.exists()) continue;

              const postData = postSnap.data();
              results.push({
                id: postId,
                url: postData.mediaUrl,
                playerUid: postData.playerUid,
                likeCount: postData.likeCount || 0,
                likedAt: data.createdAt ?? null,
                postCreatedAt: postData.createdAt ?? null,
              });
            }
          }
        } catch (err) {
          console.log("⚠️ Sous-collection likedPosts inaccessible :", err);
        }

        // 2️⃣ Fallback : query sur posts avec likedBy + visibility public (compatible règles)
        if (results.length === 0) {
          const postsRef = collection(db, "posts");
          const q = query(
            postsRef,
            where("visibility", "==", "public"),
            where("likedBy", "array-contains", user.uid)
          );
          const snap = await getDocs(q);
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            results.push({
              id: docSnap.id,
              url: data.mediaUrl,
              playerUid: data.playerUid,
              likeCount: data.likeCount || 0,
              postCreatedAt: data.createdAt ?? null,
            });
          });
        }

        setPosts(results);
      } catch (e) {
        console.log("Erreur récupération posts likés :", e);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-bold ml-4">
            Mes posts likés ❤️
          </Text>
        </View>

        <View className="bg-orange-500/20 border border-orange-500 rounded-full px-3 py-1">
          <Text className="text-orange-400 font-semibold">
            {posts.length} vidé{posts.length > 1 ? "os" : "o"}
          </Text>
        </View>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-400 text-center">
            Tu n’as encore liké aucun post.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => (
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
                  })),
                  startIndex: posts.findIndex((p) => p.id === item.id),
                })
              }
              style={{
                width: tileSize,
                margin: 8,
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: "#111",
              }}
            >
              <Video
                source={{ uri: item.url }}
                style={{
                  width: "100%",
                  height: tileSize * 1.3,
                  backgroundColor: "#000",
                }}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isMuted
                isLooping
              />
              <View className="p-3">
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={async () => {
                      const previous = posts;
                      setPosts((prev) => prev.filter((p) => p.id !== item.id));
                      try {
                        await toggleLikePost(item.id, item.playerUid);
                      } catch (e) {
                        console.log("❌ Unlike error :", e);
                        setPosts(previous);
                      }
                    }}
                    className="flex-row items-center bg-black/60 px-2 py-1 rounded-full"
                  >
                    <Ionicons name="heart-dislike" size={16} color="#f97316" />
                    <Text className="text-orange-400 text-xs ml-1">
                      Retirer
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-400 text-xs mt-1">
                  {formatDate(item.likedAt) ||
                    formatDate(item.postCreatedAt) ||
                    "Date inconnue"}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Appuie pour ouvrir le feed
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
