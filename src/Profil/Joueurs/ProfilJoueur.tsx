// src/Profil/Joueur/profiljoueur.tsx

import React, { useRef } from "react";
import { Text, View, Alert, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";

import AvatarSection from "./components/AvatarSection";
import BioSection from "./components/BioSection";
import GallerySection from "./components/GallerySection";
import DeleteAccountSection from "./components/DeleteAccountSection";
import LogoutButton from "./components/LogoutButton";
import FloatingShareButton from "./components/FloatingShareButton";
import usePlayerProfile from "./hooks/usePlayerProfile";
import EditProfileModal from "./components/EditProfileModal/EditProfileModal";
import { Modalize } from "react-native-modalize";

const CARD_WIDTH = Dimensions.get("window").width * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

export default function ProfilJoueur() {
  /* -----------------------------------------------------
      🔥 HOOKS — toujours en premier
  ----------------------------------------------------- */
  const {
    user,
    loading,
    avatarLoading,
    handleAvatarChange,
    saveProfile,
    fields,
    setEditField,
    editFields,
    gallery,
    stats,
    rating,
    addGalleryMedia,
    deleteGalleryMedia,

    // 🔥 AJOUT DES VARIABLES EMAIL
    passwordModalVisible,
    setPasswordModalVisible,
    passwordForReauth,
    setPasswordForReauth,
    tempNewEmail,
    setTempNewEmail,
  } = usePlayerProfile();

  const cardRef = useRef<ViewShot>(null);
  const editModalRef = useRef<Modalize>(null);
  const openEditModal = () => editModalRef.current?.open();
  const closeEditModal = () => editModalRef.current?.close();

  /* -----------------------------------------------------
      🔥 ANIMATION SCROLL
  ----------------------------------------------------- */
  const scrollY = useRef(new Animated.Value(0)).current;

  const scale = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [1, 0.6],
    extrapolate: "clamp",
  });

  const translateY = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [0, -40],
    extrapolate: "clamp",
  });

  const adjustedTranslate = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [0, CARD_HEIGHT * 0.55],
    extrapolate: "clamp",
  });

  const opacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  /* -----------------------------------------------------
      📸 Capture + Partage
  ----------------------------------------------------- */
  const captureCard = async () => {
    try {
      const uri = await cardRef.current?.capture?.();
      return uri ?? null;
    } catch (e) {
      console.log("❌ Erreur capture:", e);
      return null;
    }
  };

  const shareCard = async () => {
    const uri = await captureCard();
    if (!uri) {
      Alert.alert("Erreur", "Impossible de capturer la carte.");
      return;
    }
    await Sharing.shareAsync(uri);
  };

  /* -----------------------------------------------------
      📤 PICK MEDIA
  ----------------------------------------------------- */
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      await addGalleryMedia(asset.uri, asset.type === "video");
    }
  };

  /* -----------------------------------------------------
      🟠 LOADING
  ----------------------------------------------------- */
  if (loading || !user) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Chargement...</Text>
      </SafeAreaView>
    );
  }
  /* -----------------------------------------------------
      🔥 RENDER
  ----------------------------------------------------- */
  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: CARD_HEIGHT * 1.3,
          paddingBottom: 120,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* 🔥 CARTE ANIMÉE */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            alignItems: "center",
            transform: [
              { scale },
              { translateY: Animated.add(translateY, adjustedTranslate) },
            ],
            opacity,
          }}
        >
          <ViewShot
            ref={cardRef}
            options={{ format: "png", quality: 1 }}
            style={{ borderRadius: 20, overflow: "hidden" }}
          >
            <AvatarSection
              user={user}
              stats={stats}
              rating={rating}
              onEditAvatar={handleAvatarChange}
              avatarLoading={avatarLoading}
            />
          </ViewShot>

          {/* VERSION AVEC UI */}
          <View style={{ position: "absolute" }}>
            <AvatarSection
              user={user}
              stats={stats}
              rating={rating}
              onEditAvatar={handleAvatarChange}
              avatarLoading={avatarLoading}
            />
          </View>
        </Animated.View>

        {/* 🔥 BOUTON PARTAGE */}
        <FloatingShareButton cardRef={cardRef} />

        {/* 🔥 BIO */}
        <View className="mt-4">
          <BioSection
            editMode={false}
            onToggleEdit={openEditModal}
            birthYear={fields.dob}
            setBirthYear={(v) => setEditField("dob", v)}
            height={fields.taille}
            setHeight={(v) => setEditField("taille", v)}
            onSelectHeight={() => {}}
            weight={fields.poids}
            setWeight={(v) => setEditField("poids", v)}
            onSelectWeight={() => {}}
            position={fields.poste}
            setPosition={(v) => setEditField("poste", v)}
            onSelectPoste={() => {}}
            strongHand={fields.main}
            setStrongHand={(v) => setEditField("main", v)}
            departement={fields.departement}
            onSelectDepartement={() => {}}
            club={fields.club}
            onSelectClub={() => {}}
            phone={""}
            setPhone={() => {}}
            email={fields.email}
            setEmail={(v) => setEditField("email", v)}
            level={""}
            onSelectLevel={() => {}}
            experience={""}
            setExperience={() => {}}
            bio={fields.description}
            setBio={(v) => setEditField("description", v)}
            onSave={saveProfile}
          />
        </View>

        {/* 🔥 GALERIE */}
        <GallerySection
          media={gallery}
          onAddMedia={(uri, isVideo, file) =>
            addGalleryMedia(uri, isVideo, file)
          }
          onDeleteMedia={deleteGalleryMedia}
          onSetAvatar={handleAvatarChange}
        />

        <LogoutButton />
        <DeleteAccountSection />
      </Animated.ScrollView>
      {
        /* 🔥 MODAL ÉDITION PROFIL */
        <EditProfileModal
          ref={editModalRef}
          fields={fields}
          editFields={editFields}
          setEditField={setEditField}
          saveProfile={async () => {
            await saveProfile();
            closeEditModal();
          }}
          // 🔥 IMPORTANTS : tu dois les passer au modal !
          passwordModalVisible={passwordModalVisible}
          setPasswordModalVisible={setPasswordModalVisible}
          passwordForReauth={passwordForReauth}
          setPasswordForReauth={setPasswordForReauth}
          tempNewEmail={tempNewEmail}
          setTempNewEmail={setTempNewEmail}
        />
      }
    </SafeAreaView>
  );
}
