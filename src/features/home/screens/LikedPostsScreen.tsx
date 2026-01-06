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
  Image,
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
const H_PADDING = 12;
const GAP = 12;
const tileSize = (width - H_PADDING * 2 - GAP) / 2; // 2 colonnes avec espacements homogènes

type LikedPost = {
  id: string;
  url: string;
  playerUid: string;
  likeCount: number;
  playerAvatar?: string;
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
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const fetchLikedPosts = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      try {
        const results: LikedPost[] = [];
        const isClubUser = (await getDoc(doc(db, "clubs", user.uid))).exists();
        let shouldFallback = false;

        // 1️⃣ Essai via sous-collection likedPosts (autorisée par les règles)
        try {
          const likedRef = collection(
            db,
            isClubUser ? "clubs" : "joueurs",
            user.uid,
            "likedPosts"
          );
          const likedSnap = await getDocs(likedRef);

          if (!likedSnap.empty) {
            for (const likedDoc of likedSnap.docs) {
              try {
                const data = likedDoc.data();
                const postId = likedDoc.id;
                const postRef = doc(db, "posts", postId);
                const postSnap = await getDoc(postRef);
                if (!postSnap.exists()) continue;

                const postData = postSnap.data();
                let avatar: string | undefined;
                try {
                  const playerSnap = await getDoc(
                    doc(db, "joueurs", postData.playerUid)
                  );
                  avatar = (playerSnap.data() as any)?.avatar;
                } catch {}

                results.push({
                  id: postId,
                  url: postData.mediaUrl,
                  playerUid: postData.playerUid,
                  likeCount: postData.likeCount || 0,
                  playerAvatar: avatar,
                  likedAt: data.createdAt ?? null,
                  postCreatedAt: postData.createdAt ?? null,
                });
              } catch (innerErr) {
                shouldFallback = true;
              }
            }
          }
        } catch (err) {
          console.log("⚠️ Sous-collection likedPosts inaccessible :", err);
          shouldFallback = true;
        }

        // 2️⃣ Fallback : query sur posts publics avec likedBy + visibility public
        if (results.length === 0 && (!isClubUser || shouldFallback)) {
          const postsRef = collection(db, "posts");
          const q = query(
            postsRef,
            where("visibility", "==", "public"),
            where("likedBy", "array-contains", user.uid)
          );
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            let avatar: string | undefined;
            try {
              const playerSnap = await getDoc(
                doc(db, "joueurs", data.playerUid)
              );
              avatar = (playerSnap.data() as any)?.avatar;
            } catch {}

            results.push({
              id: docSnap.id,
              url: data.mediaUrl,
              playerUid: data.playerUid,
              likeCount: data.likeCount || 0,
              playerAvatar: avatar,
              postCreatedAt: data.createdAt ?? null,
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
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <View className="flex-row items-center ml-4">
            <Text className="text-white text-xl font-bold">
              Mes posts likés
            </Text>
            <Ionicons name="heart" size={20} color="#f97316" style={{ marginLeft: 6 }} />
          </View>
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
        <>
          <FlatList
            data={showAll ? posts : posts.slice(0, 6)}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: H_PADDING,
              paddingTop: 12,
              paddingBottom: showAll ? 16 : 0,
            }}
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
                  marginBottom: 12,
                  marginHorizontal: GAP / 2,
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
                      onPress={() =>
                        navigation.navigate("JoueurDetail", { uid: item.playerUid })
                      }
                      className="flex-row items-center"
                      activeOpacity={0.8}
                    >
                      <View className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                        {item.playerAvatar ? (
                          <Image
                            source={{ uri: item.playerAvatar }}
                            className="w-full h-full"
                          />
                        ) : (
                          <Ionicons
                            name="person-circle-outline"
                            size={28}
                            color="#fff"
                            style={{ alignSelf: "center" }}
                          />
                        )}
                      </View>
                      <Text className="text-white text-xs ml-2" numberOfLines={1}>
                        Voir profil
                      </Text>
                    </TouchableOpacity>
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
            ListFooterComponent={
              posts.length > 6 ? (
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
        </>
      )}
    </SafeAreaView>
  );
}
