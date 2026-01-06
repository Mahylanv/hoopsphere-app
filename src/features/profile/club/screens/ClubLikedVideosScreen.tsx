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

  const brand = {
    orange: "#F97316",
    orangeLight: "#fb923c",
    blue: "#2563EB",
    blueDark: "#1D4ED8",
    surface: "#0E0D0D",
    card: "#111827",
  } as const;

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
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 28 }}
          ListHeaderComponent={
            <View>
              <View className="px-5 pt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                  </TouchableOpacity>
                  <Text className="text-white text-xl font-bold">Vidéos likées</Text>
                  <View className="w-8" />
                </View>

                <LinearGradient
                  colors={[brand.blue, "#0D1324", brand.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 22,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: "rgba(37,99,235,0.25)",
                    overflow: "hidden",
                  }}
                >
                  <View
                    className="absolute -right-12 -top-12 w-48 h-48 rounded-full"
                    style={{ backgroundColor: "rgba(249,115,22,0.16)" }}
                  />
                  <View
                    className="absolute -left-10 bottom-0 w-36 h-36 rounded-full"
                    style={{ backgroundColor: "rgba(37,99,235,0.14)" }}
                  />
                  <View
                    className="absolute right-4 top-10 w-16 h-16 rounded-full"
                    style={{ backgroundColor: "rgba(249,115,22,0.28)" }}
                  />

                  <View className="flex-row items-center justify-between">
                    <View className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40">
                      <Text className="text-orange-200 text-xs font-semibold uppercase">
                        Club
                      </Text>
                    </View>
                    <View className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
                      <Ionicons name="heart" size={16} color="#F97316" />
                      <Text className="text-white text-sm font-semibold ml-2">
                        {posts.length} likes
                      </Text>
                    </View>
                  </View>

                  <Text className="text-2xl font-bold text-white tracking-tight mt-3">
                    Bibliothèque likée
                  </Text>
                  <Text className="text-gray-200 mt-1 text-sm leading-relaxed">
                    Retrouve les contenus sauvegardés par ton club avec la même ambiance que l'accueil.
                  </Text>

                  <View className="flex-row flex-wrap gap-2 mt-4">
                    <View className="flex-row items-center px-3 py-2 rounded-2xl bg-white/10 border border-white/15">
                      <Ionicons name="time-outline" size={16} color="#e5e7eb" />
                      <Text className="text-gray-100 text-sm font-semibold ml-2">
                        {sortKey === "recent" ? "Tri: récents" : "Tri: populaires"}
                      </Text>
                    </View>
                    <View className="flex-row items-center px-3 py-2 rounded-2xl bg-white/10 border border-white/15">
                      <Ionicons name="play" size={16} color="#e5e7eb" />
                      <Text className="text-gray-100 text-sm font-semibold ml-2">
                        {filterType === "all"
                          ? "Tous formats"
                          : filterType === "video"
                          ? "Vidéos"
                          : "Images"}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View className="px-5 mt-5">
                <View className="bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30">
                  <View className="bg-white/5 rounded-xl px-3 py-2.5 flex-row items-center">
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
                    ].map((item) => {
                      const active = sortKey === item.key;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() => setSortKey(item.key as any)}
                          activeOpacity={0.9}
                          className="px-3 py-1.5 rounded-full border"
                          style={{
                            borderColor: active ? "rgba(249,115,22,0.65)" : "rgba(255,255,255,0.12)",
                            backgroundColor: active ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.06)",
                          }}
                        >
                          <Text className="text-white text-xs font-semibold">
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {[
                      { key: "all", label: "Tout" },
                      { key: "video", label: "Vidéos" },
                      { key: "image", label: "Images" },
                    ].map((item) => {
                      const active = filterType === item.key;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() => setFilterType(item.key as any)}
                          activeOpacity={0.9}
                          className="px-3 py-1.5 rounded-full border"
                          style={{
                            borderColor: active ? "rgba(37,99,235,0.65)" : "rgba(255,255,255,0.12)",
                            backgroundColor: active ? "rgba(37,99,235,0.20)" : "rgba(255,255,255,0.06)",
                          }}
                        >
                          <Text className="text-white text-xs font-semibold">
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {filteredPosts.length === 0 && (
                <View className="px-6 py-14 items-center">
                  <View className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mb-3">
                    <Ionicons name="heart-outline" size={26} color="#F97316" />
                  </View>
                  <Text className="text-white text-lg font-semibold">
                    Aucune vidéo likée
                  </Text>
                  <Text className="text-gray-400 text-center mt-2">
                    Quand tu likes un contenu, il apparait ici pour le club.
                  </Text>
                </View>
              )}
            </View>
          }
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
              activeOpacity={0.92}
              className="mx-4 mb-4 rounded-2xl overflow-hidden border border-white/10 bg-[#111827] shadow-lg shadow-black/40"
            >
              {item.thumbnailUrl || item.mediaUrl ? (
                <View className="relative">
                  <Image
                    source={{ uri: item.thumbnailUrl || item.mediaUrl }}
                    className="w-full h-48"
                  />
                  <LinearGradient
                    colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120 }}
                  />
                  <View className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/50 border border-white/20 flex-row items-center">
                    <Ionicons name="heart" size={14} color={brand.orange} />
                    <Text className="text-white text-xs ml-1">
                      {item.likeCount ?? 0}
                    </Text>
                  </View>
                  {item.mediaType && (
                    <View className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/15 border border-white/25">
                      <Text className="text-white text-xs font-semibold uppercase">
                        {item.mediaType === "video" ? "Vidéo" : "Image"}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              <View className="p-4">
                <Text className="text-white font-semibold text-base" numberOfLines={2}>
                  {item.description || "Post liké"}
                </Text>
                <View className="flex-row items-center justify-between mt-3">
                  <View className="flex-row items-center">
                    <Ionicons name="person-circle-outline" size={18} color="#e5e7eb" />
                    <Text className="text-gray-300 text-xs ml-1.5" numberOfLines={1}>
                      {item.playerName || "Joueur inconnu"}
                    </Text>
                  </View>
                  <View className="flex-row items-center px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Ionicons name="flame" size={14} color={brand.orange} />
                    <Text className="text-white text-xs font-semibold ml-1">
                      Populaire
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
