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
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import PostTypeSelector from "./components/PostTypeSelector";
import SkillTagsSelector from "./components/SkillTagsSelector";
import VisibilitySelector from "./components/VisibilitySelector";
import { createPost } from "../../services/postService";

type PickedMedia = {
  uri: string;
  type: "image" | "video";
};

type PostType = "highlight" | "match" | "training";
type Visibility = "public" | "private";

export default function CreatePostScreen() {
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [postType, setPostType] = useState<PostType>("highlight");
  const [skills, setSkills] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<any>();

  /* ============================================================
     PICK MEDIA
  ============================================================ */
  const pickMedia = async () => {
    console.log("📸 pickMedia()");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      console.log("📸 Media sélectionné :", asset);

      setMedia({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "image",
      });
    }
  };

  /* ============================================================
     SUBMIT
  ============================================================ */
  const handlePublish = async () => {
    if (!media || loading) return;

    console.log("🚀 handlePublish()");
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

      console.log("🎉 Publication réussie");

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

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-white text-lg font-semibold">
              Nouvelle publication
            </Text>

            <TouchableOpacity
              onPress={handlePublish}
              disabled={!media || loading}
            >
              <Text
                className={`text-base font-semibold ${
                  media && !loading
                    ? "text-orange-400"
                    : "text-gray-500"
                }`}
              >
                {loading ? "Publication..." : "Publier"}
              </Text>
            </TouchableOpacity>
          </View>

          <VisibilitySelector value={visibility} onChange={setVisibility} />

          {/* MEDIA */}
          <TouchableOpacity
            onPress={pickMedia}
            className="mx-4 mt-4 h-72 rounded-xl bg-[#1A1A1A] items-center justify-center overflow-hidden"
          >
            {!media ? (
              <View className="items-center">
                <Ionicons name="add-circle-outline" size={48} color="#aaa" />
                <Text className="text-gray-400 mt-2">
                  Ajouter une photo ou une vidéo
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: media.uri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>

          <PostTypeSelector value={postType} onChange={setPostType} />
          <SkillTagsSelector selected={skills} onChange={setSkills} />

          <View className="mt-6 px-4">
            <Text className="text-white mb-2 font-semibold">Description</Text>
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
            <Text className="text-white mb-2 font-semibold">Lieu</Text>
            <View className="flex-row items-center bg-[#1A1A1A] rounded-xl px-4 py-3">
              <Ionicons name="location-outline" size={20} color="#aaa" />
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
