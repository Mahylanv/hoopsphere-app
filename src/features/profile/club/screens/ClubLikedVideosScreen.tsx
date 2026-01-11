import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image, ScrollView } from "react-native";
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
import { toggleLikePost } from "../../../home/services/likeService";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ClubLikedVideosScreen() {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [sortKey, setSortKey] = useState<"recent" | "likes">("recent");
  const [filterType, setFilterType] = useState<"all" | "video" | "image">("all");
  const [profiles, setProfiles] = useState<Record<string, { name: string; avatar?: string }>>({});

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
      const playerUids = new Set<string>();
      for (const postId of likedIds) {
        try {
          const snap = await getDoc(doc(db, "posts", postId));
          if (!snap.exists()) continue;
          const data = snap.data() as any;
          if (data?.playerUid) playerUids.add(data.playerUid);
          results.push({ id: snap.id, ...data });
        } catch {}
      }
      if (playerUids.size) {
        const entries = await Promise.all(
          Array.from(playerUids).map(async (uid) => {
            try {
              const userSnap = await getDoc(doc(db, "joueurs", uid));
              if (!userSnap.exists()) return [uid, { name: "Joueur inconnu" } as const];
              const u = userSnap.data() as any;
              const name = [u.prenom, u.nom].filter(Boolean).join(" ").trim() || "Joueur";
              return [uid, { name, avatar: u.avatar }] as const;
            } catch {
              return [uid, { name: "Joueur inconnu" }] as const;
            }
          })
        );
        setProfiles(Object.fromEntries(entries));
      } else {
        setProfiles({});
      }
      setPosts(results);
    } catch (e) {
      setPosts([]);
      setProfiles({});
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
  }, [posts, filterType, sortKey]);

  const handleUnlike = async (postId: string, ownerUid?: string) => {
    const previous = posts;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await toggleLikePost(postId, ownerUid || "");
    } catch (e) {
      console.log("❌ toggleLikePost error:", e);
      setPosts(previous);
    }
  };

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

              <View className="px-5 mt-5 mb-5">
                <LinearGradient
                  colors={[brand.blue, "#0E0D0D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 18, padding: 1.5 }}
                >
                  <View className="bg-[#0E0D0D] rounded-[16px] p-4 shadow-lg shadow-black/30">
                    <Text className="text-white font-semibold text-base mb-3">
                      Filtres rapides
                    </Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 10, paddingRight: 6 }}
                    >
                      {[
                        { key: "recent", label: "Récents", type: "sort", icon: "time-outline" },
                        { key: "likes", label: "Populaires", type: "sort", icon: "flame-outline" },
                        { key: "all", label: "Tout", type: "filter", icon: "layers-outline" },
                        { key: "video", label: "Vidéos", type: "filter", icon: "play" },
                        { key: "image", label: "Images", type: "filter", icon: "image-outline" },
                      ].map((item) => {
                        const active =
                          item.type === "sort" ? sortKey === item.key : filterType === item.key;
                        const onPress =
                          item.type === "sort"
                            ? () => setSortKey(item.key as any)
                            : () => setFilterType(item.key as any);
                        const borderColor =
                          item.type === "sort"
                            ? active
                              ? "rgba(249,115,22,0.65)"
                              : "rgba(255,255,255,0.14)"
                            : active
                            ? "rgba(37,99,235,0.65)"
                            : "rgba(255,255,255,0.14)";
                        const bgColor =
                          item.type === "sort"
                            ? active
                              ? "rgba(249,115,22,0.18)"
                              : "rgba(255,255,255,0.05)"
                            : active
                            ? "rgba(37,99,235,0.18)"
                            : "rgba(255,255,255,0.05)";

                        return (
                          <TouchableOpacity
                            key={item.key}
                            onPress={onPress}
                            activeOpacity={0.9}
                            className="px-4 py-2 rounded-full border flex-row items-center"
                            style={{
                              borderColor,
                              backgroundColor: bgColor,
                            }}
                          >
                            <Ionicons name={item.icon as any} size={16} color="#e5e7eb" />
                            <Text className="text-white text-sm font-semibold ml-2">
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </LinearGradient>
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
                <View className="flex-row items-center justify-between mt-3 gap-2">
                  <TouchableOpacity
                    onPress={() => navigation.navigate("JoueurDetail", { uid: item.playerUid })}
                    className="flex-row items-center"
                    activeOpacity={0.85}
                  >
                    <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                      {profiles[item.playerUid]?.avatar ? (
                        <Image source={{ uri: profiles[item.playerUid]?.avatar }} className="w-full h-full" />
                      ) : (
                        <Ionicons name="person-circle-outline" size={36} color="#e5e7eb" />
                      )}
                    </View>
                    <View className="ml-2">
                      <Text className="text-white text-sm font-semibold" numberOfLines={1}>
                        {profiles[item.playerUid]?.name || item.playerName || "Joueur"}
                      </Text>
                      <Text className="text-gray-400 text-xs">Voir profil</Text>
                    </View>
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      <Ionicons name="heart" size={14} color={brand.orange} />
                      <Text className="text-white text-xs ml-1">
                        {item.likeCount ?? 0}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnlike(item.id, item.playerUid)}
                      activeOpacity={0.85}
                      className="flex-row items-center bg-black/60 px-3 py-1.5 rounded-full border border-white/15"
                    >
                      <Ionicons name="heart-dislike-outline" size={16} color="#f97316" />
                      <Text className="text-orange-300 text-xs ml-1.5 font-semibold">
                        Retirer
                      </Text>
                    </TouchableOpacity>
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
