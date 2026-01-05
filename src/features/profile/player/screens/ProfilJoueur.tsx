// src/Profil/Joueurs/ProfilJoueur.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Text,
  View,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Switch,
  ScrollView,
  RefreshControl,
  DeviceEventEmitter,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import StatsChartSection from "../components/StatsChartSection";
import AvatarSection from "../components/AvatarSection";
import BioSection from "../components/BioSection";
import GallerySection from "../components/GallerySection";
import DeleteAccountSection from "../../../auth/components/DeleteAccountSection";
import LogoutButton from "../components/LogoutButton";
import FloatingShareButton from "../components/FloatingShareButton";
import usePlayerProfile from "../hooks/usePlayerProfile";
import EditProfileModal from "../modals/EditProfileModal/EditProfileModal";
import { Modalize } from "react-native-modalize";
import { updateUserProfile } from "../../../auth/services/userService";
import PostGridSection from "../components/PostGridSection";
import usePlayerPosts from "../hooks/usePlayerPosts";

const CARD_WIDTH = Dimensions.get("window").width * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

export default function ProfilJoueur() {
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

    // gestion email / ré-auth
    passwordModalVisible,
    setPasswordModalVisible,
    passwordForReauth,
    setPasswordForReauth,
    tempNewEmail,
    setTempNewEmail,

    // 👇 IMPORTANT : on suppose que ton hook expose un refetch() pour relire Firestore
    // Si ce n'est pas le cas, tu peux à la place déclencher un "remount" via focusKey (voir plus bas)
    refetch,
  } = usePlayerProfile() as any;

  const { posts, loading: postsLoading } = usePlayerPosts(user?.uid);

  const navigation = useNavigation<any>();

  // ————————— Remontage forcé (si ton hook n'a pas refetch)
  const [focusKey, setFocusKey] = useState(0);
  const remount = useCallback(() => setFocusKey((k) => k + 1), []);

  // ————————— Rechargement à chaque FOCUS
  useFocusEffect(
    useCallback(() => {
      // option A : si le hook a refetch()
      if (typeof refetch === "function") refetch();
      // option B : sinon, dé-commente la ligne suivante pour remonter le composant
      // remount();
      return () => {};
    }, [refetch, remount])
  );

  // ————————— Rechargement quand on re-clique sur l’onglet déjà actif
  useEffect(() => {
    const unsub = navigation.addListener("tabPress" as any, () => {
      if (typeof refetch === "function") refetch();
      // remount(); // alternative si pas de refetch
    });
    return unsub;
  }, [navigation, refetch]);

  // ————————— Rechargement immédiat quand Match émet "force-profile-reload"
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("force-profile-reload", () => {
      if (typeof refetch === "function") refetch();
      // remount();
    });
    return () => sub.remove();
  }, [refetch]);

  // Refs / animations
  const cardRef = useRef<ViewShot>(null);
  const editModalRef = useRef<Modalize>(null);
  const openEditModal = () => editModalRef.current?.open();
  const closeEditModal = () => editModalRef.current?.close();

  const scrollRef = useRef<ScrollView>(null);
  const autoScroll = useRef(new Animated.Value(0)).current;
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

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    if (typeof refetch === "function") await refetch();
    // remount();
    setTimeout(() => setRefreshing(false), 400);
  };

  // Capture & partage
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
    if (!uri) return Alert.alert("Erreur", "Impossible de capturer la carte.");
    await Sharing.shareAsync(uri);
  };
  // Auto scroll d’intro
  useEffect(() => {
    const id = autoScroll.addListener(({ value }) => {
      scrollRef.current?.scrollTo({ y: value, animated: false });
    });
    const t = setTimeout(() => {
      Animated.timing(autoScroll, {
        toValue: CARD_HEIGHT * 0.4,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, 300);
    return () => {
      autoScroll.removeListener(id);
      clearTimeout(t);
    };
  }, []);

  if (loading || !user) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Chargement...</Text>
      </SafeAreaView>
    );
  }

  const goToCreatePost = () => {
    navigation.navigate("CreatePost");
  };

  return (
    <SafeAreaView key={focusKey} className="flex-1 bg-[#0E0D0D]">
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        contentContainerStyle={{
          paddingTop: CARD_HEIGHT * 1.3,
          paddingBottom: 120,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
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

        <FloatingShareButton cardRef={cardRef} />

        <View className="mt-4">
          <BioSection
            editMode={false}
            onToggleEdit={openEditModal}
            onSave={saveProfile}
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
            phone={fields.phone}
            setPhone={(v) => setEditField("phone", v)}
            email={fields.email}
            setEmail={(v) => setEditField("email", v)}
            level={fields.level}
            onSelectLevel={() => {}}
            experience={fields.experience}
            setExperience={(v) => setEditField("experience", v)}
            bio={fields.description}
            setBio={(v) => setEditField("description", v)}
          />
        </View>
        {user?.premium ? (
          <StatsChartSection playerUid={user?.uid} />
        ) : (
          <View className="mt-6 px-5">
            <View className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-4">
              <Text className="text-white font-semibold text-lg">
                Stats graphiques réservées au Premium
              </Text>
              <Text className="text-gray-400 mt-1">
                Active l’offre Premium pour suivre tes courbes et progresser avec plus de détails.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate("Payment")}
                className="mt-3 bg-orange-500 px-4 py-3 rounded-xl self-start"
              >
                <Text className="text-white font-semibold">
                  Passer Premium
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* <GallerySection
          media={gallery}
          onAddMedia={goToCreatePost}
          onDeleteMedia={deleteGalleryMedia}
          onSetAvatar={handleAvatarChange}
        /> */}

        <PostGridSection
          posts={posts}
          onOpenPost={(post, _index) =>
            navigation.navigate("EditPost", {
              post,
            })
          }
          onCreatePost={() => navigation.navigate("CreatePost")}
        />

        {/* 🔥 TOGGLE PREMIUM POUR TESTS DEV */}
        <View className="mt-10 px-5">
          <Text className="text-white text-lg font-semibold mb-2">
            Mode Premium (test développeur)
          </Text>

          <View className="flex-row items-center justify-between bg-[#1A1A1A] px-4 py-3 rounded-xl">
            <Text className="text-white">Activer Premium</Text>

            <Switch
              value={user?.premium ?? false}
              onValueChange={async (value) => {
                try {
                  await updateUserProfile({ premium: value });

                  Alert.alert(
                    "Statut mis à jour",
                    value
                      ? "Le compte est maintenant Premium ✨"
                      : "Le compte n'est plus Premium."
                  );
                } catch (e) {
                  console.log("Erreur maj premium:", e);
                }
              }}
              thumbColor={user?.premium ? "#F97316" : "#888"}
              trackColor={{ false: "#555", true: "#FBBF24" }}
            />
          </View>
        </View>

        <LogoutButton />
        <DeleteAccountSection />
      </Animated.ScrollView>

      <EditProfileModal
        ref={editModalRef}
        fields={fields}
        editFields={editFields}
        setEditField={setEditField}
        saveProfile={async () => {
          await saveProfile();
          // Relecture immédiate
          if (typeof refetch === "function") await refetch();
          // remount();
          closeEditModal();
        }}
        passwordModalVisible={passwordModalVisible}
        setPasswordModalVisible={setPasswordModalVisible}
        passwordForReauth={passwordForReauth}
        setPasswordForReauth={setPasswordForReauth}
        tempNewEmail={tempNewEmail}
        setTempNewEmail={setTempNewEmail}
      />
    </SafeAreaView>
  );
}
