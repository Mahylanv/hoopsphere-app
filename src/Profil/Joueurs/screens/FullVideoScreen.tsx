// src/Profil/Joueurs/screens/FullVideoScreen.tsx

import React, { useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function FullVideoScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();

  const { url } = route.params; // 🔥 URL vidéo reçue depuis GallerySection

  const videoRef = useRef<Video>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation fade-in
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  const close = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, backgroundColor: "black" },
      ]}
    >
      {/* VIDEO PLAYER */}
      <Video
        ref={videoRef}
        source={{ uri: url }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        shouldPlay
      />

      {/* CLOSE BUTTON */}
      <TouchableOpacity style={styles.closeButton} onPress={close}>
        <Ionicons name="close" size={32} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 40,
  },
});
