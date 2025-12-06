// src/Home/HomeScreen.tsx

import React, { useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  Animated 
} from "react-native";

import usePlayerRanking from "../hooks/usePlayerRanking";
import WeeklyRanking from "./components/WeeklyRanking";
import useAllVideos from "../hooks/useAllVideos";
import VideoCarouselPreview from "./components/VideoCarouselPreview";

export default function HomeScreen() {
  const { ranking, loading } = usePlayerRanking();
  const { videos, loading: videosLoading } = useAllVideos();

  // ⭐ Animations d’apparition
  const fadeHeader = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(-20)).current;

  const fadeRanking = useRef(new Animated.Value(0)).current;
  const fadeVideos = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation du header
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
    if (!videosLoading && videos.length > 0) {
      Animated.timing(fadeVideos, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [videosLoading]);

  return (
    <ScrollView className="flex-1 bg-[#0E0D0D]">
      
      {/* ------------------------------- */}
      {/* ⭐ HEADER ANIMÉ */}
      {/* ------------------------------- */}
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

      {/* ------------------------------- */}
      {/* ⏳ LOADING CLASSEMENT */}
      {/* ------------------------------- */}
      {loading && (
        <View className="mt-10 items-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-white mt-3 text-base">
            Chargement du classement...
          </Text>
        </View>
      )}

      {/* ------------------------------- */}
      {/* ⭐ CLASSEMENT ANIMÉ */}
      {/* ------------------------------- */}
      {!loading && ranking.length > 0 && (
        <Animated.View style={{ opacity: fadeRanking }}>
          <WeeklyRanking players={ranking} />
        </Animated.View>
      )}

      {/* Aucun joueur */}
      {!loading && ranking.length === 0 && (
        <View className="items-center mt-10">
          <Text className="text-gray-400 text-base">
            Aucun joueur n’a encore été enregistré.
          </Text>
        </View>
      )}

      {/* Séparateur */}
      <View className="w-full h-[1px] bg-gray-800 opacity-50 mt-8 mb-6" />

      {/* ------------------------------- */}
      {/* 🎥 VIDÉOS POPULAIRES ANIMÉES */}
      {/* ------------------------------- */}
      {!videosLoading && videos.length > 0 && (
        <Animated.View style={{ opacity: fadeVideos }}>
          <VideoCarouselPreview videos={videos} />
        </Animated.View>
      )}

      {/* Aucun vidéo */}
      {!videosLoading && videos.length === 0 && (
        <View className="items-center mt-10">
          <Text className="text-gray-400">
            Aucune vidéo pour le moment.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
