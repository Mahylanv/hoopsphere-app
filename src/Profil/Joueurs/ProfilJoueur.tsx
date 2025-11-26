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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import ImageViewer from "react-native-image-zoom-viewer";
import { useNavigation } from "@react-navigation/native";

import ActionSheetMenu from "./components/ActionSheetMenu";

export type MediaItem = {
  url: string;
  type: "image" | "video";
};

type Props = {
  media: MediaItem[]; // ⬅️ NOUVEAU
  onAddMedia: () => void;
  onDeleteMedia?: (url: string) => void;
  onSetAvatar?: (url: string) => void;
};

export default function GallerySection({
  media,
  onAddMedia,
  onDeleteMedia,
  onSetAvatar,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const navigation = useNavigation<any>();

  const openFullScreen = (index: number) => {
    // Si c'est une vidéo → on ne l'affiche pas dans ImageViewer
    if (media[index].type === "video") {
      navigation.navigate("FullVideo", { url: media[index].url });
      return;
    }

    setStartIndex(index);
    setVisible(true);
  };

  const openMenu = (item: MediaItem) => {
    setSelectedMedia(item);
    setMenuVisible(true);
  };

  return (
    <View className="mt-8 px-6">
      {/* --- HEADER --- */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="grid-outline" size={20} color="white" />
          <Text className="text-xl font-bold text-white ml-2">Galerie</Text>
        </View>

        {/* Voir tout */}
        {media.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("FullGallery", {
                media,
                onDeleteMedia,
              })
            }
          >
            <Text className="text-orange-400 font-semibold">Voir tout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- VIDE --- */}
      {media.length === 0 ? (
        <View className="items-center justify-center py-14 bg-[#1a1f25] rounded-2xl border border-gray-800">
          <Ionicons name="images-outline" size={40} color="#6b7280" />
          <Text className="text-gray-400 text-base mt-3">
            Aucune photo / vidéo
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
        >
          <View className="flex-row gap-4">
            {media.slice(0, 6).map((item, index) => (
              <Pressable
                key={index}
                onPress={() => openFullScreen(index)}
                onLongPress={() => openMenu(item)}
              >
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.url }}
                    className="w-32 h-32 rounded-2xl"
                    style={{ backgroundColor: "#111" }}
                  />
                ) : (
                  <View>
                    <Video
                      source={{ uri: item.url }}
                      style={{
                        width: 128,
                        height: 128,
                        borderRadius: 16,
                        backgroundColor: "#111",
                      }}
                      resizeMode={ResizeMode.COVER}
                    />
                    <Ionicons
                      name="play-circle-outline"
                      size={34}
                      color="white"
                      style={{
                        position: "absolute",
                        top: 45,
                        left: 45,
                      }}
                    />
                  </View>
                )}

                {/* menu 3 points */}
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

      {/* AJOUTER */}
      <TouchableOpacity
        onPress={onAddMedia}
        className="mt-5 bg-orange-500 py-3 rounded-2xl flex-row items-center justify-center"
      >
        <Ionicons name="add-circle-outline" size={22} color="white" />
        <Text className="text-white text-base font-semibold ml-2">
          Ajouter photo / vidéo
        </Text>
      </TouchableOpacity>

      {/* === IMAGE PLEIN ÉCRAN === */}
      <Modal visible={visible} transparent>
        <ImageViewer
          imageUrls={media
            .filter((m) => m.type === "image")
            .map((m) => ({ url: m.url }))}
          index={startIndex}
          enableSwipeDown
          onSwipeDown={() => setVisible(false)}
          backgroundColor="black"
          saveToLocalByLongPress={false}
        />

        <TouchableOpacity
          onPress={() => setVisible(false)}
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

      {/* === MENU CONTEXTUEL === */}
      <ActionSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onShare={() => selectedMedia && console.log("SHARE", selectedMedia.url)}
        onDownload={() =>
          selectedMedia && console.log("DOWNLOAD", selectedMedia.url)
        }
        onSetAvatar={() =>
          selectedMedia?.type === "image" &&
          onSetAvatar?.(selectedMedia.url)
        }
        onDelete={() => selectedMedia && onDeleteMedia?.(selectedMedia.url)}
      />
    </View>
  );
}
