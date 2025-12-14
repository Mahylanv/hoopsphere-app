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
  const [fullscreen, setFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* ============================================================
     SAVE (placeholder)
  ============================================================ */
  const handleSave = async () => {
    try {
      setIsSaving(true);

      console.log("💾 Enregistrement publication :", {
        id: post.id,
        description,
        location,
      });

      // 🔜 Étape suivante : update Firestore ici

      setTimeout(() => {
        setIsSaving(false);
        navigation.goBack();
      }, 500);
    } catch (e) {
      console.log("❌ Erreur sauvegarde :", e);
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

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Text className="text-orange-400 font-semibold text-base">
              Enregistrer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
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

        {/* INFOS */}
        <View className="mt-6 px-4">
          {/* POST TYPE */}
          <View className="flex-row items-center mb-4">
            <Ionicons name="pricetag-outline" size={18} color="#aaa" />
            <Text className="text-gray-300 ml-2">
              Type :{" "}
              <Text className="text-white font-semibold">
                {post.postType.toUpperCase()}
              </Text>
            </Text>
          </View>

          {/* DESCRIPTION */}
          <Text className="text-white mb-2 font-semibold">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Description de la publication"
            placeholderTextColor="#666"
            className="bg-[#1A1A1A] text-white p-4 rounded-xl min-h-[100px]"
          />

          {/* LOCATION */}
          <View className="mt-4">
            <Text className="text-white mb-2 font-semibold">
              Lieu
            </Text>
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
            <View className="flex-row flex-wrap gap-2">
              {post.skills.map((skill, index) => (
                <View
                  key={index}
                  className="bg-orange-500/20 border border-orange-500 px-3 py-1 rounded-full"
                >
                  <Text className="text-orange-400 text-sm font-semibold">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* VISIBILITY */}
          <View className="mt-5 flex-row items-center">
            <Ionicons
              name={post.visibility === "public" ? "earth" : "lock-closed"}
              size={18}
              color="#aaa"
            />
            <Text className="text-gray-300 ml-2">
              Visibilité :{" "}
              <Text className="text-white font-semibold">
                {post.visibility === "public" ? "Publique" : "Privée"}
              </Text>
            </Text>
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
