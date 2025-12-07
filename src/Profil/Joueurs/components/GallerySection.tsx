// src/Profil/Joueur/components/GallerySection.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import ImageViewer from "react-native-image-zoom-viewer";
import { useNavigation } from "@react-navigation/native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import ActionSheetMenu from "./ActionSheetMenu";

type MediaItem = {
  url: string;
  type: "image" | "video";
};

type Props = {
  media: MediaItem[];
  onAddMedia: (uri: string, isVideo: boolean, file?: File) => void;
  onDeleteMedia?: (url: string) => void;
  onSetAvatar?: (url: string) => void;
};

export default function GallerySection({
  media,
  onAddMedia,
  onDeleteMedia,
  onSetAvatar,
}: Props) {
  const navigation = useNavigation<any>();

  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // 🔥 Media propre (supprime les fantômes + URL invalides)
  const cleanMedia = media.filter(
    (m) => m.url && m.url !== "" && m.url.startsWith("http")
  );

  /* ---------------------------------------
      ⭐ AJOUT IMAGE / VIDÉO
  --------------------------------------- */
  const onAddMediaPress = async () => {
    // 📌 PATCH WEB
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,video/*"; // autorise images + vidéos
  
      input.onchange = async () => {
        if (!input.files || input.files.length === 0) return;
  
        const file = input.files[0];
        const isVideo = file.type.startsWith("video");
  
        // Convertir en blob URL
        const uri = URL.createObjectURL(file);
  
        // On passe le fichier réel au backend
        onAddMedia(uri, isVideo, file); // 🎥📸 Nouveau param : le File réel
      };
  
      input.click();
      return;
    }
  
    // 📱 iOS / Android (Expo ImagePicker)
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission refusée");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });
  
    if (!result.canceled) {
      const asset = result.assets[0];
      const isVideo = asset.type === "video";
      onAddMedia(asset.uri, isVideo, undefined);
    }
  };  

  /* ---------------------------------------
      ⭐ FULLSCREEN IMAGE
  --------------------------------------- */
  const openFullscreen = (index: number) => {
    if (cleanMedia[index].type === "video") return;
    setStartIndex(index);
    setFullscreenVisible(true);
  };

  /* ---------------------------------------
      ⭐ MENU
  --------------------------------------- */
  const openMenu = (item: MediaItem) => {
    setSelectedItem(item);
    setMenuVisible(true);
  };

  /* ---------------------------------------
      ⭐ SHARE
  --------------------------------------- */
  const handleShare = async () => {
    if (!selectedItem || selectedItem.type !== "image") return;
    await Sharing.shareAsync(selectedItem.url);
  };

  /* ---------------------------------------
      ⭐ DOWNLOAD
  --------------------------------------- */
  const handleDownload = async () => {
    if (!selectedItem) return;

    if (Platform.OS === "web") {
      alert("Téléchargement disponible uniquement sur mobile.");
      return;
    }

    try {
      const filename = selectedItem.url.split("/").pop() || "file";
      const folder = (FileSystem as any).documentDirectory + "downloads/";

      const info = await FileSystem.getInfoAsync(folder);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      }

      await FileSystem.downloadAsync(selectedItem.url, folder + filename);
      alert("📥 Téléchargé dans le stockage local !");
    } catch (e) {
      console.log("Erreur download:", e);
    }
  };

  return (
    <View className="mt-8 px-6">
      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="grid-outline" size={20} color="white" />
          <Text className="text-xl font-bold text-white ml-2">Galerie</Text>
        </View>

        {cleanMedia.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("FullMediaViewer", {
                media: cleanMedia,
                onDeleteMedia,
              })
            }
          >
            <Text className="text-orange-400 font-semibold">Voir tout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* EMPTY STATE */}
      {cleanMedia.length === 0 ? (
        <View className="items-center justify-center py-14 bg-[#1a1f25] rounded-2xl border border-gray-800">
          <Ionicons name="images-outline" size={40} color="#6b7280" />
          <Text className="text-gray-400 text-base mt-3">
            Aucun média pour le moment
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-4 py-2">
            {cleanMedia.slice(0, 6).map((item, index) => (
              <Pressable
                key={index}
                onPress={() =>
                  item.type === "video"
                    ? navigation.navigate("FullMediaViewer", {
                      media: [{ url: item.url, type: "video" }],
                      startIndex: 0,
                    })
                    : navigation.navigate("FullMediaViewer", {
                      media: cleanMedia,
                      startIndex: index,
                    })
                }
                onLongPress={() => openMenu(item)}
              >
                {/* IMAGE */}
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.url }}
                    className="w-32 h-32 rounded-2xl"
                    style={{ backgroundColor: "#111" }}
                  />
                ) : (
                  /* VIDEO PREVIEW */
                  <View className="w-32 h-32 rounded-2xl overflow-hidden bg-black">
                    <Video
                      source={{ uri: item.url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode={ResizeMode.COVER}
                      isMuted
                      shouldPlay={false}
                    />
                    <Ionicons
                      name="play-circle"
                      size={36}
                      color="white"
                      style={{ position: "absolute", top: 40, left: 40 }}
                    />
                  </View>
                )}

                {/* MENU BUTTON */}
                <TouchableOpacity
                  onPress={() => openMenu(item)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    padding: 4,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    borderRadius: 20,
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="white" />
                </TouchableOpacity>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ADD BUTTON */}
      <TouchableOpacity
        onPress={onAddMediaPress}
        className="mt-5 bg-orange-500 py-3 rounded-2xl flex-row items-center justify-center"
      >
        <Ionicons name="add-circle-outline" size={22} color="white" />
        <Text className="text-white text-base font-semibold ml-2">
          Ajouter média
        </Text>
      </TouchableOpacity>

      {/* FULLSCREEN IMAGE VIEWER */}
      <Modal visible={fullscreenVisible} transparent>
        <ImageViewer
          imageUrls={cleanMedia
            .filter((m) => m.type === "image")
            .map((m) => ({ url: m.url }))}
          index={startIndex}
          enableSwipeDown
          onSwipeDown={() => setFullscreenVisible(false)}
          backgroundColor="black"
        />

        <TouchableOpacity
          onPress={() => setFullscreenVisible(false)}
          style={{
            position: "absolute",
            top: 40,
            right: 20,
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: 12,
            borderRadius: 40,
          }}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </Modal>

      {/* ACTION SHEET */}
      <ActionSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onShare={selectedItem?.type === "image" ? handleShare : undefined}
        onDownload={handleDownload}
        onSetAvatar={
          selectedItem?.type === "image"
            ? () => onSetAvatar?.(selectedItem.url)
            : undefined
        }
        onDelete={() => selectedItem && onDeleteMedia?.(selectedItem.url)}
      />
    </View>
  );
}
