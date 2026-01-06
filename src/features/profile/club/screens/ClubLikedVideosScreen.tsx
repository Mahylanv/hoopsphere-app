import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { RootStackParamList } from "../../../../types";
import { db } from "../../../../config/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ClubLikedVideos">;

export default function ClubLikedVideosScreen() {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"recent" | "likes">("recent");
  const [filterType, setFilterType] = useState<"all" | "video" | "image">("all");

  const fetchLiked = useCallback(async () => {
    const uid = (await import("firebase/auth")).getAuth().currentUser?.uid;
    if (!uid) return setLoading(false);
    setLoading(true);
    try {
      const likedRef = collection(db, "clubs", uid, "likedPosts");
      const likedSnap = await getDocs(likedRef);
      const likedIds = likedSnap.docs.map((d) => (d.data()?.postId as string) || d.id).filter(Boolean);
      const results: any[] = [];
      for (const postId of likedIds) {
        try {
          const snap = await getDoc(doc(db, "posts", postId));
          if (!snap.exists()) continue;
          results.push({ id: snap.id, ...snap.data() });
        } catch {}
      }
      setPosts(results);
    } catch (e) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredPosts = useMemo(() => {
    let data = [...posts];
    if (filterType !== "all") {
      data = data.filter((p) =>
        filterType === "video" ? p.mediaType === "video" : p.mediaType === "image"
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (p) =>
          (p.description || "").toLowerCase().includes(q) ||
          (p.playerName || "").toLowerCase().includes(q)
      );
    }
    if (sortKey === "likes") {
      data.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else {
      data.sort((a, b) => {
        const aDate = (a.createdAt?.toDate?.() as any) || 0;
        const bDate = (b.createdAt?.toDate?.() as any) || 0;
        return (bDate as number) - (aDate as number);
      });
    }
    return data;
  }, [posts, filterType, search, sortKey]);

  useEffect(() => {
    fetchLiked();
  }, [fetchLiked]);

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <View className="px-4 pt-4 pb-3 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Vidéos likées</Text>
          <View className="w-10" />
        </View>

        <View className="mt-4 bg-[#0f172a] border border-blue-500/25 rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-semibold text-lg">Bibliothèque club</Text>
              <Text className="text-gray-400 text-xs mt-1">
                {posts.length} contenus enregistrés
              </Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/40">
              <Text className="text-orange-300 text-xs font-semibold">Club</Text>
            </View>
          </View>

          <View className="mt-3 bg-white/10 rounded-xl px-3 py-2 flex-row items-center">
            <Ionicons name="search" size={18} color="#9ca3af" />
            <TextInput
              placeholder="Rechercher un descriptif..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              className="flex-1 text-white ml-2"
            />
          </View>

          <View className="flex-row flex-wrap gap-2 mt-3">
            {[
              { key: "recent", label: "Récents" },
              { key: "likes", label: "Populaires" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSortKey(item.key as any)}
                className={`px-3 py-1.5 rounded-full border ${
                  sortKey === item.key ? "bg-orange-500/20 border-orange-500/60" : "bg-white/5 border-white/10"
                }`}
              >
                <Text className="text-white text-xs font-semibold">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            {[
              { key: "all", label: "Tout" },
              { key: "video", label: "Vidéos" },
              { key: "image", label: "Images" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilterType(item.key as any)}
                className={`px-3 py-1.5 rounded-full border ${
                  filterType === item.key ? "bg-blue-500/20 border-blue-400/60" : "bg-white/5 border-white/10"
                }`}
              >
                <Text className="text-white text-xs font-semibold">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : filteredPosts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-400 text-center">Aucune vidéo likée.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("VideoFeed", {
                  videos: filteredPosts.map((p) => ({
                    id: p.id,
                    url: p.mediaUrl,
                    playerUid: p.playerUid,
                    likeCount: p.likeCount ?? 0,
                    isLikedByMe: true,
                  })),
                  startIndex: filteredPosts.findIndex((p) => p.id === item.id),
                })
              }
              className="bg-[#0f172a] border border-blue-500/15 rounded-2xl p-4 mb-3"
            >
              {item.thumbnailUrl || item.mediaUrl ? (
                <View className="rounded-xl overflow-hidden mb-3 border border-white/10">
                  <Image source={{ uri: item.thumbnailUrl || item.mediaUrl }} className="w-full h-44" />
                </View>
              ) : null}
              <Text className="text-white font-semibold" numberOfLines={2}>
                {item.description || "Post liké"}
              </Text>
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center">
                  <Ionicons name="heart" size={14} color="#F97316" />
                  <Text className="text-gray-300 text-xs ml-1">
                    {item.likeCount ?? 0} likes
                  </Text>
                </View>
                {item.mediaType && (
                  <View className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                    <Text className="text-gray-200 text-xs uppercase">
                      {item.mediaType === "video" ? "Vidéo" : "Image"}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
