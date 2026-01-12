// src/features/home/screens/LikedPostsScreen.tsx
// Écran Premium – Posts aimés par l'utilisateur

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
import { LinearGradient } from "expo-linear-gradient";
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
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";
import { PostLikesContent } from "../components/PostLikesContent";

const { width } = Dimensions.get("window");
const H_PADDING = 12;
const GAP = 4;
const tileSize = (width - H_PADDING * 2 - GAP * 3) / 3; // 3 colonnes façon grille
const INITIAL_COUNT = 9;

type LikedPost = {
  id: string;
  url: string;
  playerUid: string;
  likeCount: number;
  playerAvatar?: string;
  likedAt?: any | null;
  postCreatedAt?: any | null;
  mediaType?: "video" | "image";
  thumbnailUrl?: string | null;
};

type NavProp = NativeStackNavigationProp<RootStackParamList, "LikedPosts">;

export default function LikedPostsScreen() {
  const navigation = useNavigation<NavProp>();
  const auth = getAuth();
  const db = getFirestore();
  const { isPremium, loading: premiumLoading } = usePremiumStatus();

  const [posts, setPosts] = useState<LikedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<"liked" | "likes">("liked");
  const showLikesTab = isPremium && !premiumLoading;
  const [likesCount, setLikesCount] = useState(0);
  useEffect(() => {
    const fetchLikedPosts = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      try {
        const results: LikedPost[] = [];
        const clubSnap = await getDoc(doc(db, "clubs", user.uid));
        const clubUser = clubSnap.exists();
        let shouldFallback = false;

        // 1️⃣ Essai via sous-collection likedPosts (autorisée par les règles)
        try {
          const likedRef = collection(
            db,
            clubUser ? "clubs" : "joueurs",
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
                  mediaType: postData.mediaType ?? "video",
                  thumbnailUrl: postData.thumbnailUrl ?? null,
                });
              } catch (innerErr) {
                shouldFallback = true;
              }
            }
          }
        } catch (err) {
          // console.log("⚠️ Sous-collection likedPosts inaccessible :", err);
          shouldFallback = true;
        }

        // 2️⃣ Fallback : query sur posts publics avec likedBy + visibility public
        if (results.length === 0 && (!clubUser || shouldFallback)) {
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
              mediaType: data.mediaType ?? "video",
              thumbnailUrl: data.thumbnailUrl ?? null,
            });
          }
        }

        setPosts(results);
      } catch (e) {
        // console.log("Erreur récupération posts aimés :", e);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, []);

  useEffect(() => {
    if (!showLikesTab && activeTab === "likes") {
      setActiveTab("liked");
    }
  }, [activeTab, showLikesTab]);

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

      {/* HEADER */}
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
      </View>

      <View className="px-4 pt-3">
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity
            onPress={() => setActiveTab("liked")}
            activeOpacity={0.9}
            className={`px-4 py-2 rounded-full border ${
              activeTab === "liked"
                ? "bg-orange-500/20 border-orange-500/40"
                : "bg-white/5 border-white/10"
            }`}
          >
            <Text
              className={
                activeTab === "liked"
                  ? "text-orange-200 font-semibold"
                  : "text-gray-300"
              }
            >
              Mes vidéos aimées ({posts.length})
            </Text>
          </TouchableOpacity>
          {showLikesTab ? (
            <TouchableOpacity
              onPress={() => setActiveTab("likes")}
              activeOpacity={0.9}
              className={`px-4 py-2 rounded-full border ${
                activeTab === "likes"
                  ? "bg-blue-500/20 border-blue-500/40"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <Text
                className={
                  activeTab === "likes"
                    ? "text-blue-200 font-semibold"
                    : "text-gray-300"
                }
              >
                Ceux qui ont aimé mes vidéos ({likesCount})
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* CONTENT */}
      {activeTab === "likes" ? (
        <PostLikesContent
          title="Ceux qui ont aimé mes vidéos"
          onCountChange={setLikesCount}
        />
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-400 text-center">
            Tu n'as encore aimé aucun post.
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
                  width: tileSize,
                  height: tileSize,
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
