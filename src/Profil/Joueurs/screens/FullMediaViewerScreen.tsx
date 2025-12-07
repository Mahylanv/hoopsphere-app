// src/Profil/Joueurs/screens/FullMediaViewerScreen.tsx

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import ImageViewer from "react-native-image-zoom-viewer";

const { height, width } = Dimensions.get("window");

export default function FullMediaViewerScreen({ route, navigation }: any) {
  // 🔥 Sécurisation : si media absent → tableau vide
  const media = route.params?.media ?? [];

  // 🔥 Si media vide → écran fallback (anti-crash)
  if (!Array.isArray(media) || media.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white" }}>Aucun média à afficher</Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: "#333",
          }}
        >
          <Text style={{ color: "white" }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🔥 startIndex sécurisé
  const startIndex =
    typeof route.params?.startIndex === "number" &&
    route.params.startIndex >= 0 &&
    route.params.startIndex < media.length
      ? route.params.startIndex
      : 0;

  const flatListRef = useRef<FlatList>(null);

  // 🔥 Index courant pour l’indicator
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / height);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  const renderItem = ({ item }: any) => {
    if (item.type === "image") {
      return (
        <View style={{ width, height, backgroundColor: "black" }}>
          <ImageViewer
            imageUrls={[{ url: item.url }]}
            enableSwipeDown={false}
            backgroundColor="black"
            saveToLocalByLongPress={false}
            renderHeader={() => <></>} // supprime le header de base
            renderIndicator={() => <></>} // supprime le compteur 1/1 intégré
          />
        </View>
      );
    }

    return (
      <View style={{ width, height, backgroundColor: "black" }}>
        <Video
          source={{ uri: item.url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          useNativeControls
        />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* ❌ Bouton fermer */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: "absolute",
          top: 40,
          right: 20,
          zIndex: 20,
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: 10,
          borderRadius: 50,
        }}
      >
        <Ionicons name="close" size={32} color="white" />
      </TouchableOpacity>

      {/* 🟧 Indicator custom en bas */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          width: "100%",
          zIndex: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, opacity: 0.9 }}>
          {currentIndex + 1} / {media.length}
        </Text>
      </View>

      {/* 📜 Liste verticale */}
      <FlatList
        ref={flatListRef}
        data={media}
        keyExtractor={(item) => item.url}
        renderItem={renderItem}
        pagingEnabled
        initialScrollIndex={startIndex}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />
    </View>
  );
}
