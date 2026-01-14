// src/features/profile/club/screens/ClubPremiumScreen.tsx
// Espace Premium Club : activation + vues profil (30j) + posts aimés

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  query,
  limit,
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../types";
import { toggleLikePost } from "../../../home/services/likeService";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export default function ClubPremiumScreen() {
  const auth = getAuth();
  const db = getFirestore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(false);
  const [views, setViews] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [viewsBlocked, setViewsBlocked] = useState(false);
  const [viewerProfiles, setViewerProfiles] = useState<Record<string, { name: string; avatar?: string }>>({});
  const uniqueViews = useMemo(() => {
    const seen = new Set<string>();
    return views.filter((v) => {
      const uid = v.viewerUid;
      if (!uid || seen.has(uid)) return false;
      seen.add(uid);
      return true;
    });
  }, [views]);
  const totalViews = uniqueViews.length;
  const totalLikes = likedPosts.length;

  const user = auth.currentUser;
  const isOwner = !!user?.uid;

  const formatViewerBadge = (viewerUid: string) =>
    viewerUid ? viewerUid.slice(0, 2).toUpperCase() : "??";

  const ensureMonthlyViewsReset = useCallback(
    async (uid: string) => {
      const monthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
      const clubRef = doc(db, "clubs", uid);
      const snap = await getDoc(clubRef);
      if (!snap.exists()) return;
      const lastReset = (snap.data() as any)?.viewsResetMonth;
      if (lastReset === monthKey) return;

      const viewsRef = collection(db, "clubs", uid, "views");
      let hasMore = true;
      while (hasMore) {
        const chunk = await getDocs(query(viewsRef, limit(300)));
        if (chunk.empty) {
          hasMore = false;
          break;
        }
        const batch = writeBatch(db);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      await updateDoc(clubRef, { viewsResetMonth: monthKey });
      setViews([]);
    },
    [db]
  );

  const fetchLikedPosts = useCallback(
    async (uid: string) => {
      try {
        const likedRef = collection(db, "clubs", uid, "likedPosts");
        const likedIdsSnap = await getDocs(likedRef);
        const likedIds = likedIdsSnap.docs
          .map((d) => (d.data()?.postId as string) || d.id)
          .filter(Boolean);

        if (likedIds.length === 0) {
          setLikedPosts([]);
          return;
        }

        const results = await Promise.allSettled(
          likedIds.map(async (postId) => {
            try {
              const snap = await getDoc(doc(db, "posts", postId));
              if (!snap.exists()) return null;
              return { id: snap.id, ...snap.data() };
            } catch {
              return null; // ignore unreadable posts silently
            }
          })
        );

        setLikedPosts(
          results
            .filter((r) => r.status === "fulfilled" && r.value)
            .map((r: any) => r.value)
        );
      } catch {
        // Permissions or other errors: fallback to empty without surfacing
        setLikedPosts([]);
      }
    },
    [db]
  );

  const loadPremiumState = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "clubs", user.uid));
      setPremium(!!snap.data()?.premium);
    } catch (e) {
      // console.log("⚠️ Lecture premium club impossible", e);
      setPremium(false);
    }
  }, [db, user]);

  const loadData = useCallback(async () => {
    if (!user || !premium) {
      setViews([]);
      setLikedPosts([]);
      setViewerProfiles({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Vues 30 derniers jours
      setViewsBlocked(false);
      try {
        await ensureMonthlyViewsReset(user.uid);

        const since = new Date(Date.now() - MONTH_MS);
        const viewsRef = collection(db, "clubs", user.uid, "views");
        const viewsSnap = await getDocs(viewsRef);
        const recent = viewsSnap.docs
          .map((d) => d.data())
          .filter((v) => {
            const ts = v.viewedAt?.toDate ? v.viewedAt.toDate() : null;
            return ts && ts >= since;
          });
        setViews(recent);

        // Récupération des profils joueurs (nom + avatar) liés aux vues
        const viewerUids = Array.from(new Set(recent.map((v) => v.viewerUid).filter(Boolean)));
        const profilesEntries = await Promise.all(
          viewerUids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "joueurs", uid));
              if (!snap.exists()) return [uid, { name: uid } as const];
              const data = snap.data() as any;
              const name = [data.prenom, data.nom].filter(Boolean).join(" ").trim() || uid;
              return [uid, { name, avatar: data.avatar }] as const;
            } catch {
              return [uid, { name: uid }] as const;
            }
          })
        );
        setViewerProfiles(Object.fromEntries(profilesEntries));
      } catch (e) {
        // console.log("⚠️ Vues club non accessibles (permissions)", e);
        setViewsBlocked(true);
        setViews([]);
        setViewerProfiles({});
      }

      // Posts aimés par le club
      await fetchLikedPosts(user.uid);
    } catch (e) {
      // console.log("❌ Erreur chargement Premium club :", e);
    } finally {
      setLoading(false);
    }
  }, [db, premium, user, fetchLikedPosts, ensureMonthlyViewsReset]);

  useEffect(() => {
    loadPremiumState().then(() => setLoading(false));
  }, [loadPremiumState]);

  useEffect(() => {
    if (premium) {
      loadData();
    }
  }, [premium, loadData]);

  useEffect(() => {
    if (user?.uid) {
      ensureMonthlyViewsReset(user.uid).catch(() => {});
    }
  }, [user?.uid, ensureMonthlyViewsReset]);

  useFocusEffect(
    useCallback(() => {
      if (!premium || !user) return;
      loadData();
    }, [premium, user, loadData])
  );

  const handleUnlike = async (postId: string, ownerUid: string) => {
    const previous = likedPosts;
    setLikedPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await toggleLikePost(postId, ownerUid);
    } catch (e) {
      setLikedPosts(previous);
      Alert.alert("Erreur", "Impossible de retirer le j'aime pour le moment.");
    }
  };

  const handleToggle = async (value: boolean) => {
    if (!user) return;
    setPremium(value);
    try {
      await updateDoc(doc(db, "clubs", user.uid), { premium: value });
      Alert.alert(
        "Premium",
        value ? "Le club est désormais Premium." : "Premium désactivé."
      );
      if (value) {
        loadData();
      } else {
        setViews([]);
        setLikedPosts([]);
      }
    } catch (e) {
      // console.log("❌ Maj premium club :", e);
      setPremium(!value);
      Alert.alert("Erreur", "Impossible de mettre à jour le statut Premium.");
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-6">
        <Text className="text-white text-center">
          Connectez-vous avec un compte club.
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <Ionicons name="star" size={22} color="#FBBF24" />
          <Text className="text-white text-xl font-bold ml-2">Premium</Text>
        </View>

        <View className="flex-row items-center bg-[#1A1A1A] px-4 py-2 rounded-xl border border-white/10">
          <Text className="text-white font-semibold mr-2">Activer</Text>
          <Switch
            value={premium}
            onValueChange={handleToggle}
            thumbColor={premium ? "#F97316" : "#888"}
            trackColor={{ false: "#555", true: "#FBBF24" }}
          />
        </View>
      </View>

      {premium ? (
        <ScrollView
          className="flex-1 bg-black"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="px-4 py-4">
            <Text className="text-white text-lg font-bold mb-3">
              Vues du profil (1 mois) · <Text className="text-orange-400">{totalViews}</Text>
            </Text>
            {viewsBlocked ? (
              <Text className="text-gray-400">
                Impossible d'afficher les vues (permissions Firestore).
              </Text>
            ) : views.length === 0 ? (
              <Text className="text-gray-400">Aucune vue récente.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
                contentContainerStyle={{ paddingRight: 12 }}
              >
                {uniqueViews.map((v, idx) => (
                  <TouchableOpacity
                    key={idx}
                    className="items-center mr-3"
                    onPress={() =>
                      navigation.navigate("JoueurDetail", {
                        uid: v.viewerUid,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <View className="w-16 h-16 rounded-full border-2 border-orange-500 bg-[#0C1C34] items-center justify-center overflow-hidden">
                      {viewerProfiles[v.viewerUid]?.avatar ? (
                        <Image
                          source={{ uri: viewerProfiles[v.viewerUid].avatar }}
                          className="w-full h-full"
                        />
                      ) : (
                        <Text className="text-white font-semibold">
                          {formatViewerBadge(v.viewerUid)}
                        </Text>
                      )}
                    </View>
                    <Text className="text-gray-200 text-xs mt-1" numberOfLines={1}>
                      {viewerProfiles[v.viewerUid]?.name || v.viewerUid}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View className="px-4 py-2 mt-2">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-white text-lg font-bold">Vidéos aimées</Text>
                <Text className="text-blue-300 text-sm">{totalLikes} au total</Text>
              </View>
              <View className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40">
                <Text className="text-orange-400 text-xs font-semibold">Playlist</Text>
              </View>
            </View>

            {likedPosts.length === 0 ? (
              <Text className="text-gray-400">Aucune vidéo aimée pour le moment.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 12 }}
              >
                {likedPosts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() =>
                      navigation.navigate("VideoFeed", {
                        videos: likedPosts.map((p) => ({
                          id: p.id,
                          url: p.mediaUrl,
                          playerUid: p.playerUid,
                          likeCount: p.likeCount ?? 0,
                          isLikedByMe: true,
                        })),
                        startIndex: likedPosts.findIndex((p) => p.id === item.id),
                      })
                    }
                    className="w-52 mr-3 rounded-3xl overflow-hidden bg-[#0B1220] border border-white/10"
                    activeOpacity={0.9}
                  >
                    <TouchableOpacity
                      onPress={() => handleUnlike(item.id, item.playerUid)}
                      className="absolute z-10 right-2 top-2 bg-black/60 rounded-full p-1.5 border border-white/20"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="heart-dislike" size={16} color="#F97316" />
                    </TouchableOpacity>
                    <View className="h-32 bg-[#0C2347]">
                      <View
                        className="absolute inset-0"
                        style={{
                          backgroundColor: "rgba(249, 115, 22, 0.35)",
                        }}
                      />
                      <View
                        className="absolute inset-0"
                        style={{
                          backgroundColor: "rgba(59, 130, 246, 0.25)",
                        }}
                      />
                      <View className="absolute inset-0 opacity-25 bg-white" />
                      {item.thumbnailUrl || item.mediaUrl ? (
                        <Image
                          source={{ uri: (item.thumbnailUrl as string) || (item.mediaUrl as string) }}
                          className="w-full h-full"
                        />
                      ) : null}
                      <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-full flex-row items-center">
                        <Ionicons name="play" size={14} color="#fff" />
                        <Text className="text-white text-xs ml-1">Voir</Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text className="text-white font-semibold" numberOfLines={1}>
                        {item.description || "Post aimé"}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        J'aime : {item.likeCount ?? 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-400 text-center mb-3">
            Activez Premium pour voir vos vues et vos posts aimés.
          </Text>
          <View className="flex-row items-center bg-[#1A1A1A] px-4 py-2 rounded-xl border border-white/10">
            <Text className="text-white font-semibold mr-2">Activer</Text>
            <Switch
              value={premium}
              onValueChange={handleToggle}
              thumbColor={premium ? "#F97316" : "#888"}
              trackColor={{ false: "#555", true: "#FBBF24" }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
