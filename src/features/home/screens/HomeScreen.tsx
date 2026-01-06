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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import usePlayerRanking from "../hooks/usePlayerRanking";
import WeeklyRanking from "../components/WeeklyRanking";
import useAllPosts from "../hooks/useAllPosts";
import VideoCarouselPreview from "../components/VideoCarouselPreview";
import RankingPlayerPanel from "../components/RankingPlayerPanel";
import { RankingPlayer } from "../hooks/usePlayerRanking";
import { VideoItem } from "../../../types";

type Props = {
  forClub?: boolean;
};

export default function HomeScreen({ forClub = false }: Props) {
  const navigation = useNavigation<any>();
  const { ranking, loading } = usePlayerRanking();
  const { posts, loading: postsLoading } = useAllPosts({
    includeClubVisibility: forClub,
  });

  // ⭐ Nouveaux states pour le PANEL
  const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(
    null
  );
  const [panelVisible, setPanelVisible] = useState(false);

  // -------------------------------
  // ⭐ Animations Header / Ranking / Videos
  // -------------------------------
  const fadeHeader = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(-20)).current;

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

  const storyPlayers = ranking.slice(0, 8);

  const brand = {
    orange: "#F97316",
    orangeLight: "#fb923c",
    blue: "#2563EB",
    blueDark: "#1D4ED8",
    surface: "#0E0D0D",
    card: "#111827",
  } as const;

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
      colors: [brand.orange, brand.blue] as const,
      onPress: () => navigation.navigate("LikedPosts"),
    },
  ];

  // -------------------------------
  // ⭐ UI
  // -------------------------------
  const scrollRef = useRef<ScrollView>(null);
  const [rankingOffset, setRankingOffset] = useState(0);
  const [videosOffset, setVideosOffset] = useState(0);

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
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
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
              style={{ backgroundColor: "rgba(249,115,22,0.12)" }}
            />
            <View
              className="absolute -left-14 bottom-0 w-40 h-40 rounded-full"
              style={{ backgroundColor: "rgba(37,99,235,0.12)" }}
            />

            <Text className="text-xs font-semibold text-orange-300 uppercase tracking-[0.5px]">
              Fil HoopSphere
            </Text>
            <Text className="text-3xl font-bold text-white tracking-tight mt-2">
              Bienvenue 👋
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

        {/* Stories façon Instagram */}
        {!loading && storyPlayers.length > 0 && (
          <View className="mt-6 px-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-lg font-semibold">
                Stories premium
              </Text>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                <Text className="text-gray-400 text-xs">
                  Inspiration rapide
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
              contentContainerStyle={{ paddingRight: 24 }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("CreatePost")}
                className="mr-4 items-center"
              >
                <LinearGradient
                  colors={[brand.orange, brand.blue]}
                  style={{ padding: 2, borderRadius: 9999 }}
                >
                  <View className="w-16 h-16 rounded-full bg-black items-center justify-center">
                    <Ionicons name="add" size={26} color="#f3f4f6" />
                  </View>
                </LinearGradient>
                <Text className="text-gray-300 text-xs mt-2">Ta story</Text>
              </TouchableOpacity>

              {storyPlayers.map((player) => (
                <View key={player.uid} className="mr-4 items-center">
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
                            player.avatar && player.avatar.trim() !== ""
                              ? player.avatar
                              : "https://via.placeholder.com/200.png",
                        }}
                        className="w-full h-full"
                      />
                    </View>
                  </LinearGradient>
                  <Text
                    className="text-gray-200 text-xs mt-2 w-16 text-center"
                    numberOfLines={1}
                  >
                    {player.prenom}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Actions rapides */}
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-lg font-semibold">Actions</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
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
              <VideoCarouselPreview videos={videoItems} />
            </Animated.View>
          )}

          {!postsLoading && posts.length === 0 && (
            <View className="items-center mt-10">
              <Text className="text-gray-400">Aucune vidéo pour le moment.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- PANEL FLUTANT (AU-DESSUS DU SCROLLVIEW) --- */}
      <RankingPlayerPanel
        visible={panelVisible}
        player={selectedPlayer}
        onClose={() => setPanelVisible(false)}
      />
    </View>
  );
}
