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
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { RootStackParamList } from "../../../types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { height, width } = Dimensions.get("window");

type LikedPost = {
  id: string;
  url: string;
  playerUid: string;
  likeCount: number;
};

type NavProp = NativeStackNavigationProp<RootStackParamList, "LikedPosts">;

export default function LikedPostsScreen() {
  const navigation = useNavigation<NavProp>();
  const auth = getAuth();
  const db = getFirestore();

  const [posts, setPosts] = useState<LikedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const likedRef = collection(db, "joueurs", user.uid, "likedPosts");
        const q = query(likedRef, orderBy("createdAt", "desc"));
        const likedSnap = await getDocs(q);

        const results: LikedPost[] = [];

        for (const likedDoc of likedSnap.docs) {
          const postId = likedDoc.id;
          const postRef = doc(db, "posts", postId);
          const postSnap = await getDoc(postRef);

          if (postSnap.exists()) {
            const data = postSnap.data();

            results.push({
              id: postId,
              url: data.mediaUrl,
              playerUid: data.playerUid,
              likeCount: data.likeCount || 0,
            });
          }
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
      <View className="flex-row items-center px-4 py-4 border-b border-gray-800">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-xl font-bold ml-4">
          Mes posts likés ❤️
        </Text>
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
          pagingEnabled
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
                height,
                width,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text className="text-white text-lg font-semibold mb-2">
                Post liké
              </Text>
              <Text className="text-gray-400">Likes : {item.likeCount}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
