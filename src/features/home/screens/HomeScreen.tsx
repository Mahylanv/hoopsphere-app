// src/features/home/screens/HomeScreen.tsx
// Écran d'accueil avec classement hebdomadaire et vidéos populaires

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";

import usePlayerRanking from "../hooks/usePlayerRanking";
import WeeklyRanking from "../components/WeeklyRanking";
import useAllPosts from "../hooks/useAllPosts";
import VideoCarouselPreview from "../components/VideoCarouselPreview";
import RankingPlayerPanel from "../components/RankingPlayerPanel";
import { RankingPlayer } from "../hooks/usePlayerRanking";
import { VideoItem } from "../../../types";

export default function HomeScreen() {
  const { ranking, loading } = usePlayerRanking();
  const { posts, loading: postsLoading } = useAllPosts();

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

  // -------------------------------
  // ⭐ UI
  // -------------------------------
  return (
    <View className="flex-1 bg-[#0E0D0D]">
      {/* --- CONTENU SCROLLABLE --- */}
      <ScrollView className="flex-1">
        {/* HEADER */}
        <Animated.View
          style={{
            opacity: fadeHeader,
            transform: [{ translateY: slideHeader }],
          }}
          className="px-5 pt-12 pb-6"
        >
          <Text className="text-3xl font-bold text-white tracking-tight">
            Bienvenue sur HoopSphere 👋
          </Text>
          <Text className="text-gray-400 mt-1 text-base">
            Découvre les meilleures performances de la semaine
          </Text>
        </Animated.View>

        {/* Séparateur */}
        <View className="w-full h-[1px] bg-gray-800 opacity-60 mb-6" />

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

        {/* Séparateur */}
        <View className="w-full h-[1px] bg-gray-800 opacity-50 mt-8 mb-6" />

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
