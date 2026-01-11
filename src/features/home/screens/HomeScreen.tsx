// src/features/home/screens/HomeScreen.tsx
// Écran d'accueil avec classement hebdomadaire et vidéos populaires

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import usePlayerRanking from "../hooks/usePlayerRanking";
import WeeklyRanking from "../components/WeeklyRanking";
import useAllPosts from "../hooks/useAllPosts";
import VideoCarouselPreview from "../components/VideoCarouselPreview";
import RankingPlayerPanel from "../components/RankingPlayerPanel";
import { RankingPlayer } from "../hooks/usePlayerRanking";
import { VideoItem } from "../../../types";
import { db, auth } from "../../../config/firebaseConfig";
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";

type Props = {
  forClub?: boolean;
};

export default function HomeScreen({ forClub = false }: Props) {
  const navigation = useNavigation<any>();
  const { isPremium } = usePremiumStatus();
  const [clubPremium, setClubPremium] = useState(false);
  const { ranking, loading } = usePlayerRanking();
  const { posts, loading: postsLoading } = useAllPosts({
    includeClubVisibility: forClub,
  });

  // ⭐ Nouveaux states pour le PANEL
  const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(
    null
  );
  const [panelVisible, setPanelVisible] = useState(false);
  const [visitors, setVisitors] = useState<
    { uid: string; name: string; avatar?: string | null; type: "player" | "club"; premium?: boolean }
  >([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const allowedPremium = forClub ? clubPremium : isPremium;

  // -------------------------------
  // ⭐ Animations Header / Ranking / Videos
  // -------------------------------
  const fadeHeader = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(-20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const fadeRanking = useRef(new Animated.Value(0)).current;
  const fadePosts = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeHeader, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideHeader, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading && ranking.length > 0) {
      Animated.timing(fadeRanking, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  useEffect(() => {
    if (!postsLoading && posts.length > 0) {
      Animated.timing(fadePosts, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [postsLoading]);

  useEffect(() => {
    const loadClubPremium = async () => {
      if (!forClub) return;
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setClubPremium(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "clubs", uid));
        setClubPremium(!!snap.data()?.premium);
      } catch (e) {
        // console.log("Erreur chargement premium club :", e);
        setClubPremium(false);
      }
    };
    loadClubPremium();
  }, [forClub]);

  useEffect(() => {
    const fetchVisitors = async () => {
      if (!allowedPremium) {
        setVisitors([]);
        return;
      }
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      setVisitorsLoading(true);
      try {
        const basePath = forClub ? ["clubs", uid] : ["joueurs", uid];
        const ref = collection(db, ...basePath, "views");
        const q = query(ref, orderBy("viewedAt", "desc"), limit(8));
        const snap = await getDocs(q);

        const map = new Map<
          string,
          { uid: string; name: string; avatar?: string | null; type: "player" | "club"; premium?: boolean }
        >();
        for (const d of snap.docs) {
          const data: any = d.data();
          const visitorUid = data.viewerUid;
          if (!visitorUid || map.has(visitorUid)) continue;
          // essaie profil joueur puis club
          let name = "Visiteur";
          let avatar: string | null = null;
          let type: "player" | "club" = "player";
          let premium = false;

          const joueurSnap = await getDoc(doc(db, "joueurs", visitorUid));
          if (joueurSnap.exists()) {
            const jd = joueurSnap.data() as any;
            name = `${jd.prenom ?? ""} ${jd.nom ?? ""}`.trim() || "Visiteur";
            avatar = jd.avatar ?? null;
            premium = !!jd.premium;
          } else {
            const clubSnap = await getDoc(doc(db, "clubs", visitorUid));
            if (clubSnap.exists()) {
              const cd = clubSnap.data() as any;
              name = cd.nom ?? cd.name ?? "Club";
              avatar = cd.logo ?? null;
              type = "club";
              premium = !!cd.premium;
            }
          }

          map.set(visitorUid, {
            uid: visitorUid,
            name,
            avatar,
            type,
            premium,
          });
        }

        setVisitors(Array.from(map.values()));
      } catch (e) {
        // console.log("Erreur chargement visiteurs :", e);
      } finally {
        setVisitorsLoading(false);
      }
    };

    fetchVisitors();
  }, [allowedPremium, forClub]);

  const videoItems: VideoItem[] = posts.map((post) => ({
    id: post.id,
    url: post.url,
    playerUid: post.playerUid,
    likeCount: post.likeCount,
    isLikedByMe: post.isLikedByMe,
    thumbnailUrl: post.thumbnailUrl,
    description: post.description ?? undefined,
    location: post.location ?? undefined,
    createdAt: post.createdAt,
    skills: post.skills ?? [],
  }));

  const brand = {
    orange: "#F97316",
    orangeLight: "#fb923c",
    blue: "#2563EB",
    blueDark: "#1D4ED8",
    surface: "#0E0D0D",
    card: "#111827",
  } as const;
  const PREVIEW_WIDTH = Math.min(Dimensions.get("window").width * 0.72, 360);

  const quickActions = [
    {
      title: forClub ? "Partager une offre" : "Partager un highlight",
      subtitle: forClub
        ? "Publie une nouvelle opportunité"
        : "Montre ton dernier move",
      icon: forClub ? ("document-text-outline" as const) : ("sparkles-outline" as const),
      colors: [brand.orange, brand.orangeLight] as const,
      onPress: () =>
        navigation.navigate(
          forClub ? ("ProfilClub" as never) : ("CreatePost" as never),
          forClub ? ({ openCreateOffer: true } as never) : undefined
        ),
    },
    {
      title: forClub ? "Explorer les joueurs" : "Explorer les clubs",
      subtitle: forClub ? "Recrute des profils ciblés" : "Trouve un match ou un essai",
      icon: "compass-outline" as const,
      colors: [brand.blue, brand.blueDark] as const,
      onPress: () => navigation.navigate(forClub ? "SearchJoueurTabs" : "Search"),
    },
    {
      title: "Vidéos likées",
      subtitle: "Revois tes coups de cœur",
      icon: "heart-outline" as const,
      colors: (forClub && clubPremium
        ? [brand.orange, brand.orangeLight]
        : [brand.orange, brand.blue]) as const,
      onPress: () =>
        navigation.navigate(forClub ? ("ClubLikedVideos" as never) : ("LikedPosts" as never)),
    },
  ];

  if (forClub && clubPremium) {
    quickActions.push({
      title: "Consultations profil",
      subtitle: "Voir qui a visité le club",
      icon: "eye-outline" as const,
      colors: [brand.blue, brand.blueDark] as const,
      onPress: () => navigation.navigate("ClubVisitors" as never),
    });
  }

  // -------------------------------
  // ⭐ UI
  // -------------------------------
  const scrollRef = useRef<ScrollView>(null);
  const [rankingOffset, setRankingOffset] = useState(0);
  const [videosOffset, setVideosOffset] = useState(0);
  const [visibleVideoCount, setVisibleVideoCount] = useState(3);
  const VIDEO_LOAD_STEP = 3;

  const handleScrollToRanking = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(rankingOffset - 20, 0),
      animated: true,
    });
  };

  const handleScrollToVideos = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(videosOffset - 20, 0),
      animated: true,
    });
  };

  return (
    <View className="flex-1 bg-[#0E0D0D]">
      {/* --- CONTENU SCROLLABLE --- */}
      <Animated.ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* HEADER / HERO */}
        <Animated.View
          style={{
            opacity: fadeHeader,
            transform: [{ translateY: slideHeader }],
          }}
          className="px-5 pt-12"
        >
          <LinearGradient
            colors={[brand.blue, "#0D1324", brand.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(37,99,235,0.2)",
              overflow: "hidden",
            }}
          >
            <View
              className="absolute -right-10 -top-10 w-48 h-48 rounded-full"
              style={{ backgroundColor: "rgba(249,115,22,0.16)" }}
            />
            <View
              className="absolute -left-14 bottom-0 w-40 h-40 rounded-full"
              style={{ backgroundColor: "rgba(37,99,235,0.16)" }}
            />
            <View
              className="absolute -right-6 top-16 w-24 h-24 rounded-full"
              style={{ backgroundColor: "rgba(249,115,22,0.35)" }}
            />

            <Text className="text-xs font-semibold text-orange-300 uppercase tracking-[0.5px]">
              Fil HoopSphere
            </Text>
            <Text className="text-3xl font-bold text-white tracking-tight mt-2">
              Bienvenue 
            </Text>
            <Text className="text-gray-300 mt-1 text-base">
              Ton aperçu express du moment : joueurs en feu et vidéos qui tournent.
            </Text>

            <View className="flex-row flex-wrap gap-2 mt-4">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleScrollToRanking}
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(249,115,22,0.16)",
                  borderColor: "rgba(249,115,22,0.35)",
                  borderWidth: 1,
                }}
              >
                <Ionicons name="flame" size={18} color={brand.orange} />
                <Text className="text-white text-sm font-semibold ml-2">
                  {ranking.length} joueurs premium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleScrollToVideos}
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(37,99,235,0.12)",
                  borderColor: "rgba(37,99,235,0.35)",
                  borderWidth: 1,
                }}
              >
                <Ionicons name="play" size={16} color="#e5e7eb" />
                <Text className="text-gray-200 text-sm ml-2">
                  {posts.length} vidéos à explorer
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Visiteurs récents (remplace stories) */}
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-semibold">
                Visiteurs récents
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                Derniers profils qui ont consulté ta page
              </Text>
            </View>
            {!allowedPremium && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("Payment")}
                className="flex-row items-center bg-orange-500/20 px-3 py-1.5 rounded-full border border-orange-500/40"
              >
                <Ionicons name="lock-closed" size={14} color={brand.orange} />
                <Text className="text-orange-200 text-xs ml-1">Premium</Text>
              </TouchableOpacity>
            )}
          </View>

          {allowedPremium ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {visitorsLoading && (
                <View className="mr-4 items-center justify-center w-16 h-16">
                  <ActivityIndicator size="small" color={brand.orange} />
                </View>
              )}

              {!visitorsLoading && visitors.length === 0 && (
                <View className="mr-4 items-center justify-center">
                  <Text className="text-gray-400 text-xs">
                    Aucun visiteur récent
                  </Text>
                </View>
              )}

              {!visitorsLoading &&
                visitors.map((visitor) => (
                  <TouchableOpacity
                    key={visitor.uid}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (visitor.type === "club") {
                        navigation.navigate("ProfilClub", {
                          club: { uid: visitor.uid, id: visitor.uid },
                        });
                      } else {
                        navigation.navigate("JoueurDetail", { uid: visitor.uid });
                      }
                    }}
                    className="mr-4 items-center"
                  >
                    <LinearGradient
                      colors={[brand.orange, brand.blueDark, brand.blue]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ padding: 2, borderRadius: 9999 }}
                    >
                      <View className="w-16 h-16 rounded-full bg-black items-center justify-center overflow-hidden">
                        <Image
                          source={{
                            uri:
                              visitor.avatar && visitor.avatar.trim() !== ""
                                ? visitor.avatar
                                : "https://via.placeholder.com/200.png",
                          }}
                          className="w-full h-full"
                        />
                      </View>
                    </LinearGradient>
                    <View className="flex-row items-center justify-center mt-2 w-16">
                      <Text
                        className="text-gray-200 text-xs text-center"
                        numberOfLines={1}
                      >
                        {visitor.name || "Visiteur"}
                      </Text>
                      {visitor.premium && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#38bdf8"
                          style={{ marginLeft: 3 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Actions rapides */}
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-lg font-semibold">Actions</Text>
          </View>
          <View className="flex-row flex-wrap gap-3 mt-3">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                activeOpacity={0.9}
                onPress={action.onPress}
                className="flex-1 min-w-[160px]"
              >
                <LinearGradient
                  colors={action.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 18, padding: 1 }}
                >
                  <View className="bg-[#0E0D0D] rounded-[16px] px-4 py-4 flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-semibold">
                        {action.title}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        {action.subtitle}
                      </Text>
                    </View>
                    <View className="bg-white/10 p-2 rounded-full">
                      <Ionicons name={action.icon} size={18} color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Séparateur */}
        <View className="w-full h-[1px] bg-gray-800 opacity-60 mt-10 mb-6" />

        <View onLayout={(e) => setRankingOffset(e.nativeEvent.layout.y)}>
          {/* LOADING CLASSEMENT */}
          {loading && (
            <View className="mt-10 items-center">
              <ActivityIndicator size="large" color="#F97316" />
              <Text className="text-white mt-3 text-base">
                Chargement du classement...
              </Text>
            </View>
          )}

          {/* CLASSEMENT */}
          {!loading && ranking.length > 0 && (
            <Animated.View style={{ opacity: fadeRanking }}>
              <WeeklyRanking
                players={ranking}
                onSelectPlayer={setSelectedPlayer}
                onOpenPanel={() => setPanelVisible(true)}
              />
            </Animated.View>
          )}

          {!loading && ranking.length === 0 && (
            <View className="items-center mt-10">
              <Text className="text-gray-400 text-base text-center px-6">
                Aucun joueur Premium n’est encore présent dans le classement.
              </Text>
            </View>
          )}
        </View>

        {/* Séparateur */}
        <View className="w-full h-[1px] bg-gray-800 opacity-50 mt-8 mb-6" />

        <View onLayout={(e) => setVideosOffset(e.nativeEvent.layout.y)}>
          {/* VIDÉOS POPULAIRES */}
          {!postsLoading && posts.length > 0 && (
            <Animated.View style={{ opacity: fadePosts }}>
              <VideoCarouselPreview
                videos={videoItems}
                visibleCount={visibleVideoCount}
                scrollY={scrollY}
                sectionOffset={videosOffset}
              />
            </Animated.View>
          )}

          {!postsLoading && posts.length === 0 && (
            <View className="items-center mt-10">
              <Text className="text-gray-400">Aucune vidéo pour le moment.</Text>
            </View>
          )}

          {!postsLoading && visibleVideoCount < videoItems.length && (
            <View className="px-5 mt-4">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  setVisibleVideoCount((prev) =>
                    Math.min(prev + VIDEO_LOAD_STEP, videoItems.length)
                  )
                }
                className="flex-row items-center justify-center bg-white/5 border border-white/10 rounded-full px-4 py-3 self-center"
                style={{ width: PREVIEW_WIDTH }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text className="text-white font-semibold ml-2">
                  Charger plus de vidéos
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* --- PANEL FLUTANT (AU-DESSUS DU SCROLLVIEW) --- */}
      <RankingPlayerPanel
        visible={panelVisible}
        player={selectedPlayer}
        onClose={() => setPanelVisible(false)}
      />
    </View>
  );
}
