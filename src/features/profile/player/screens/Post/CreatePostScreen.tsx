// src/features/profile/player/screens/Post/CreatePostScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { UIImagePickerControllerQualityType, VideoExportPreset } from "expo-image-picker";
import { collection, getDocs, query, where } from "firebase/firestore";

import PostTypeSelector from "./components/PostTypeSelector";
import SkillTagsSelector from "./components/SkillTagsSelector";
import VisibilitySelector from "./components/VisibilitySelector";
import { createPost } from "../../services/postService";
import { usePremiumStatus } from "../../../../../shared/hooks/usePremiumStatus";
import { auth, db } from "../../../../../config/firebaseConfig";

/* ============================================================
   TYPES
============================================================ */
type PickedMedia = {
  uri: string;
  type: "image" | "video";
  thumbnailUri?: string | null;
};

type PostType = "highlight" | "match" | "training";
type Visibility = "public" | "private" | "clubs";

export default function CreatePostScreen() {
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [postType, setPostType] = useState<PostType>("highlight");
  const [skills, setSkills] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const navigation = useNavigation<any>();
  const { isPremium } = usePremiumStatus();
  const MAX_VIDEO_DURATION = 60; // seconds
  const MAX_VIDEO_SIZE = 120 * 1024 * 1024; // 120 Mo en octets

  const normalizeDurationSeconds = (duration?: number | null) => {
    if (!duration) return 0;
    // Certains devices renvoient la durée en ms
    return duration > 1200 ? duration / 1000 : duration;
  };

  const checkVideoConstraints = async (
    uri: string,
    duration?: number | null,
    fileSize?: number | null
  ) => {
    const durSec = normalizeDurationSeconds(duration);

    let size = fileSize;
    if (size == null) {
      const info = await FileSystem.getInfoAsync(uri);
      if ("size" in info && typeof (info as any).size === "number") {
        size = (info as any).size as number;
      }
    }

    const errors: string[] = [];
    if (durSec && durSec > MAX_VIDEO_DURATION) {
      errors.push(
        `Durée maximale : 60 secondes (ta vidéo fait ~${Math.round(durSec)}s).`
      );
    }
    if (size != null && size > MAX_VIDEO_SIZE) {
      const mb = (size / (1024 * 1024)).toFixed(1);
      errors.push(`Poids maximum : 120 Mo (taille détectée : ${mb} Mo).`);
    }

    if (errors.length > 0) {
      Alert.alert("Vidéo non valide", errors.join("\n"));
      return false;
    }
    return true;
  };

  const checkVideoQuota = async () => {
    if (isPremium) return true;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Connexion requise", "Connecte-toi pour publier une vidéo.");
      return false;
    }

    const q = query(
      collection(db, "posts"),
      where("playerUid", "==", user.uid),
      where("mediaType", "==", "video")
    );
    const snap = await getDocs(q);
    if (snap.size >= 10) {
      Alert.alert(
        "Limite atteinte",
        "En version gratuite, tu peux publier jusqu'à 10 vidéos. Supprime-en une ou passe en Premium pour lever la limite."
      );
      return false;
    }
    return true;
  };

  const handleCancel = () => {
    const hasContent =
      media ||
      description.trim().length > 0 ||
      location.trim().length > 0 ||
      skills.length > 0;

    if (hasContent) {
      Alert.alert(
        "Annuler la publication ?",
        "Tes modifications seront perdues.",
        [
          { text: "Continuer", style: "cancel" },
          { text: "Quitter", style: "destructive", onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  /* ============================================================
     PICK / CHANGE MEDIA
  ============================================================ */
  const pickMedia = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.6,
      allowsEditing: true,
      videoQuality: UIImagePickerControllerQualityType.Medium,
      videoExportPreset: VideoExportPreset.MediumQuality,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    // 🎥 VIDEO → MINIATURE
    if (asset.type === "video") {
      setCompressing(true);
      const ok = await checkVideoConstraints(
        asset.uri,
        asset.duration ?? undefined,
        (asset as any).fileSize ?? null
      );
      if (!ok) {
        setCompressing(false);
        return;
      }

      try {
        const { uri: thumbUri } =
          await VideoThumbnails.getThumbnailAsync(asset.uri, {
            time: 500,
          });

        setMedia({
          uri: asset.uri,
          type: "video",
          thumbnailUri: thumbUri,
        });
      } catch (e) {
        console.warn("⚠️ Miniature vidéo impossible", e);
        setMedia({
          uri: asset.uri,
          type: "video",
          thumbnailUri: null,
        });
      }
      setCompressing(false);
    } else {
      // 🖼️ IMAGE
      setMedia({
        uri: asset.uri,
        type: "image",
      });
    }
  };

  const openMediaEditor = async () => {
    if (!media) return;

    const picker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        media.type === "video"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
      aspect: media.type === "image" ? [9, 16] : undefined,
      videoQuality: UIImagePickerControllerQualityType.Medium,
      videoExportPreset: VideoExportPreset.MediumQuality,
    });

    if (picker.canceled) return;
    const asset = picker.assets[0];

    if (asset.type === "video") {
      setCompressing(true);
      const ok = await checkVideoConstraints(
        asset.uri,
        asset.duration ?? undefined,
        (asset as any).fileSize ?? null
      );
      if (!ok) {
        setCompressing(false);
        return;
      }

      try {
        const { uri: thumbUri } =
          await VideoThumbnails.getThumbnailAsync(asset.uri, {
            time: 500,
          });

        setMedia({
          uri: asset.uri,
          type: "video",
          thumbnailUri: thumbUri,
        });
      } catch (e) {
        console.warn("⚠️ Miniature vidéo impossible", e);
        setMedia({
          uri: asset.uri,
          type: "video",
          thumbnailUri: null,
        });
      }
      setCompressing(false);
    } else {
      setMedia({
        uri: asset.uri,
        type: "image",
      });
    }
  };

  /* ============================================================
     SUBMIT
  ============================================================ */
  const handlePublish = async () => {
    if (!media || loading || compressing) return;

    if (media.type === "video") {
      const ok = await checkVideoQuota();
      if (!ok) return;
    }

    setLoading(true);

    try {
      await createPost({
        mediaUri: media.uri,
        mediaType: media.type,
        description,
        location,
        postType,
        skills,
        visibility,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      navigation.goBack();
    } catch (e) {
      console.error("❌ Publication échouée :", e);
      Alert.alert(
        "Erreur",
        "Impossible de publier la vidéo pour le moment."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity onPress={handleCancel} disabled={loading || compressing}>
              <Text
                className={`text-base font-semibold ${
                  loading || compressing ? "text-gray-600" : "text-gray-300"
                }`}
              >
                Annuler
              </Text>
            </TouchableOpacity>

            <Text className="text-white text-lg font-semibold">
              Nouvelle publication
            </Text>

            <TouchableOpacity
              onPress={handlePublish}
              disabled={!media || loading || compressing}
            >
              <Text
                className={`text-base font-semibold ${
                  media && !loading && !compressing
                    ? "text-orange-400"
                    : "text-gray-500"
                }`}
              >
                {compressing
                  ? "Compression..."
                  : loading
                    ? "Publication..."
                    : "Publier"}
              </Text>
            </TouchableOpacity>
          </View>

          <VisibilitySelector value={visibility} onChange={setVisibility} />

          {/* MEDIA PREVIEW */}
          <View className="mx-4 mt-4">
            <TouchableOpacity
              onPress={pickMedia}
              activeOpacity={0.9}
              className="h-72 rounded-xl bg-[#1A1A1A] items-center justify-center overflow-hidden"
            >
              {!media ? (
                <View className="items-center">
                  <Ionicons
                    name="add-circle-outline"
                    size={48}
                    color="#aaa"
                  />
                  <Text className="text-gray-400 mt-2">
                    Ajouter une photo ou une vidéo
                  </Text>
                </View>
              ) : media.type === "image" ? (
                <Image
                  source={{ uri: media.uri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <>
                  {/* 🎬 MINIATURE VIDEO */}
                  {media.thumbnailUri ? (
                    <Image
                      source={{ uri: media.thumbnailUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-black">
                      <Ionicons
                        name="videocam"
                        size={48}
                        color="white"
                      />
                    </View>
                  )}

                  {/* ▶️ PLAY ICON */}
                  <View className="absolute inset-0 items-center justify-center">
                    <Ionicons
                      name="play-circle"
                      size={72}
                      color="white"
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* 🔁 CHANGE MEDIA */}
            {media && (
              <TouchableOpacity
                onPress={openMediaEditor}
                className="mt-3 self-center flex-row items-center"
              >
                <Ionicons
                  name="refresh"
                  size={18}
                  color="#F97316"
                />
                <Text className="text-orange-400 ml-2 font-semibold">
                  Modifier le média
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <PostTypeSelector value={postType} onChange={setPostType} />
          <SkillTagsSelector selected={skills} onChange={setSkills} />

          <View className="mt-6 px-4">
            <Text className="text-white mb-2 font-semibold">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Explique le contexte, le match, l'action..."
              placeholderTextColor="#777"
              multiline
              className="bg-[#1A1A1A] text-white p-4 rounded-xl min-h-[100px]"
            />
          </View>

          <View className="mt-4 px-4">
            <Text className="text-white mb-2 font-semibold">
              Lieu
            </Text>
            <View className="flex-row items-center bg-[#1A1A1A] rounded-xl px-4 py-3">
              <Ionicons
                name="location-outline"
                size={20}
                color="#aaa"
              />
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Gymnase, ville, tournoi..."
                placeholderTextColor="#777"
                className="text-white ml-3 flex-1"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
