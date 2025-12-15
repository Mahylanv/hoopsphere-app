// src/Profil/Joueur/screens/Post/EditPostScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { useNavigation, useRoute } from "@react-navigation/native";
import { updatePost } from "../../services/postService";

const { width, height } = Dimensions.get("window");

/* ============================================================
   TYPES
============================================================ */
type PostItem = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  description: string;
  location?: string;
  postType: "highlight" | "match" | "training";
  skills: string[];
  visibility: "public" | "private";
};

const POST_TYPES: PostItem["postType"][] = [
  "highlight",
  "match",
  "training",
];

/* ============================================================
   SCREEN
============================================================ */
export default function EditPostScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { post } = route.params as { post: PostItem };

  /* -------------------------------
     STATES
  -------------------------------- */
  const [description, setDescription] = useState(post.description);
  const [location, setLocation] = useState(post.location || "");
  const [postType, setPostType] = useState(post.postType);
  const [visibility, setVisibility] = useState(post.visibility);
  const [skills, setSkills] = useState<string[]>(post.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const [fullscreen, setFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* ============================================================
     ACTIONS
  ============================================================ */
  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill)) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
  
      const payload = {
        description,
        location: location || undefined,
        postType,
        skills,
        visibility,
      };
  
      console.log("💾 updatePost payload :", payload);
  
      await updatePost(post.id, payload);
  
      navigation.goBack();
    } catch (e) {
      console.log("❌ Erreur sauvegarde :", e);
    } finally {
      setIsSaving(false);
    }
  };
  

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold">
          Modifier la publication
        </Text>

        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Text className="text-orange-400 font-semibold text-base">
              Enregistrer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* MEDIA */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => post.mediaType === "video" && setFullscreen(true)}
          className="mx-4 mt-4 rounded-2xl overflow-hidden bg-[#111]"
          style={{ height: 280 }}
        >
          {post.mediaType === "image" ? (
            <Image
              source={{ uri: post.mediaUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <>
              <Video
                source={{ uri: post.mediaUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isMuted
              />
              <View className="absolute inset-0 items-center justify-center">
                <Ionicons
                  name="play-circle"
                  size={64}
                  color="rgba(255,255,255,0.85)"
                />
              </View>
            </>
          )}
        </TouchableOpacity>

        <View className="mt-6 px-4">
          {/* POST TYPE */}
          <Text className="text-white mb-2 font-semibold">
            Type de publication
          </Text>
          <View className="flex-row gap-3 mb-5">
            {POST_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setPostType(type)}
                className={`px-4 py-2 rounded-full border ${
                  postType === type
                    ? "bg-orange-500 border-orange-500"
                    : "border-gray-700"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    postType === type
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DESCRIPTION */}
          <Text className="text-white mb-2 font-semibold">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Description"
            placeholderTextColor="#666"
            className="bg-[#1A1A1A] text-white p-4 rounded-xl min-h-[100px]"
          />

          {/* LOCATION */}
          <View className="mt-4">
            <Text className="text-white mb-2 font-semibold">Lieu</Text>
            <View className="flex-row items-center bg-[#1A1A1A] rounded-xl px-4 py-3">
              <Ionicons name="location-outline" size={18} color="#aaa" />
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Lieu"
                placeholderTextColor="#666"
                className="text-white ml-3 flex-1"
              />
            </View>
          </View>

          {/* SKILLS */}
          <View className="mt-5">
            <Text className="text-white mb-2 font-semibold">
              Skills
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-3">
              {skills.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  onPress={() => removeSkill(skill)}
                  className="bg-orange-500/20 border border-orange-500 px-3 py-1 rounded-full"
                >
                  <Text className="text-orange-400 text-sm font-semibold">
                    {skill} ✕
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row items-center bg-[#1A1A1A] rounded-xl px-4 py-2">
              <TextInput
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Ajouter un skill"
                placeholderTextColor="#666"
                className="text-white flex-1"
              />
              <TouchableOpacity onPress={addSkill}>
                <Ionicons name="add-circle" size={26} color="#F97316" />
              </TouchableOpacity>
            </View>
          </View>

          {/* VISIBILITY */}
          <View className="mt-6">
            <Text className="text-white mb-2 font-semibold">
              Visibilité
            </Text>
            <View className="flex-row gap-3">
              {(["public", "private"] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setVisibility(v)}
                  className={`px-4 py-2 rounded-full border ${
                    visibility === v
                      ? "bg-orange-500 border-orange-500"
                      : "border-gray-700"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      visibility === v
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {v === "public" ? "Publique" : "Privée"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FULLSCREEN VIDEO */}
      <Modal visible={fullscreen} transparent animationType="fade">
        <View className="flex-1 bg-black">
          <TouchableOpacity
            onPress={() => setFullscreen(false)}
            className="absolute top-12 right-6 z-10"
          >
            <Ionicons name="close" size={34} color="white" />
          </TouchableOpacity>

          <Video
            source={{ uri: post.mediaUrl }}
            style={{ width, height }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            useNativeControls
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
