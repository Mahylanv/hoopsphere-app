// src/Profil/Joueurs/ProfilJoueur.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Text,
  View,
  Alert,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  RefreshControl,
  DeviceEventEmitter,
  TouchableOpacity,
  Image,
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
import usePlayerProfile from "../hooks/usePlayerProfile";
import EditProfileModal from "../modals/EditProfileModal/EditProfileModal";
import { Modalize } from "react-native-modalize";
import PostGridSection from "../components/PostGridSection";
import usePlayerPosts from "../hooks/usePlayerPosts";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Svg, { Path } from "react-native-svg";
import { updateUserProfile } from "../../../auth/services/userService";
import { CARD_NORMAL, CARD_PREMIUM } from "../../../../constants/images";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_PHONE = SCREEN_WIDTH <= 360 || SCREEN_HEIGHT <= 700;

const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.3;
const CARD_PREVIEW_WIDTH = SCREEN_WIDTH * 0.42;
const SMALL_PHONE_CARD_SCALE = IS_SMALL_PHONE ? 0.9 : 1;

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

  const brand = {
    orange: "#F97316",
    orangeLight: "#fb923c",
    blue: "#2563EB",
    blueDark: "#1D4ED8",
    surface: "#0E0D0D",
    card: "#111827",
  } as const;

  const quickActions = [
    {
      title: "Partager un highlight",
      subtitle: "Montre ton dernier move",
      icon: "sparkles-outline" as const,
      colors: [brand.orange, brand.orangeLight] as const,
      onPress: () => navigation.navigate("CreatePost"),
    },
    {
      title: "Explorer les clubs",
      subtitle: "Trouve un match ou un essai",
      icon: "compass-outline" as const,
      colors: [brand.blue, brand.blueDark] as const,
      onPress: () => navigation.navigate("Search"),
    },
    {
      title: "Vidéos aimées",
      subtitle: "Revois tes coups de cœur",
      icon: "heart-outline" as const,
      colors: [brand.orange, brand.blue] as const,
      onPress: () => navigation.navigate("LikedPosts"),
    },
  ];

  // ————————— Remontage forcé (si ton hook n'a pas refetch)
  const [focusKey, setFocusKey] = useState(0);
  const remount = useCallback(() => setFocusKey((k) => k + 1), []);
  const [showCardChooser, setShowCardChooser] = useState(false);
  const [cardStyle, setCardStyle] = useState<"normal" | "premium">("normal");

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

  useEffect(() => {
    if (user?.cardStyle) {
      setCardStyle(user.cardStyle);
    }
  }, [user?.cardStyle]);

  const cardOptions: Array<{
    id: "normal" | "premium";
    label: string;
    image: ReturnType<typeof require>;
  }> = [
    {
      id: "normal",
      label: "Carte normale",
      image: CARD_NORMAL,
    },
    {
      id: "premium",
      label: "Carte premium",
      image: CARD_PREMIUM,
    },
  ];

  const updateCardStyle = async (nextStyle: "normal" | "premium") => {
    try {
      await updateUserProfile({ cardStyle: nextStyle });
      setCardStyle(nextStyle);
      Alert.alert(
        "Carte mise a jour",
        nextStyle === "premium"
          ? "La carte premium sera affichee sur ton profil."
          : "La carte normale sera affichee sur ton profil."
      );
    } catch {
      Alert.alert("Erreur", "Impossible de mettre a jour la card.");
    }
  };

  const handleCardCustomizerPress = () => {
    if (!user?.premium) {
      navigation.navigate("Payment");
      return;
    }
    setShowCardChooser((current) => !current);
  };

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
  const cardScale = Animated.multiply(scale, SMALL_PHONE_CARD_SCALE);

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
      // console.log("❌ Erreur capture:", e);
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
      <SafeAreaView
        className="flex-1 bg-black justify-center items-center"
        edges={["top", "left", "right"]}
      >
        <Text className="text-white text-lg">Chargement...</Text>
      </SafeAreaView>
    );
  }

  const goToCreatePost = () => {
    navigation.navigate("CreatePost");
  };

  return (
    <SafeAreaView
      key={focusKey}
      className="flex-1 bg-[#0E0D0D]"
      edges={["top", "left", "right"]}
    >
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
            top: IS_SMALL_PHONE ? -24 : 0,
            left: 0,
            right: 0,
            alignItems: "center",
            transform: [
              { scale: cardScale },
              { translateY: Animated.add(translateY, adjustedTranslate) },
            ],
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

        <View
          className="w-full px-5"
          style={{
            marginTop: IS_SMALL_PHONE ? 8 : -2,
            marginBottom: IS_SMALL_PHONE ? 10 : 16,
          }}
        >
          <View className="flex-row items-center justify-between">
            <LinearGradient
              colors={[brand.orange, brand.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 999, padding: 1 }}
            >
              <TouchableOpacity
                onPress={handleCardCustomizerPress}
                activeOpacity={0.9}
                className="bg-[#0E0D0D] rounded-full px-4 py-2 flex-row items-center"
              >
                <Ionicons
                  name={user?.premium ? "color-palette-outline" : "lock-closed-outline"}
                  size={16}
                  color={user?.premium ? "#FDBA74" : "#9ca3af"}
                />
                <Text className="text-white font-semibold ml-2">
                  {user?.premium
                    ? showCardChooser
                      ? "Masquer le choix"
                      : "Personnaliser"
                    : "Personnaliser"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              onPress={shareCard}
              className="w-[56px] h-[56px] rounded-full bg-[#ff6600] justify-center items-center shadow-lg shadow-black/40"
            >
              <Ionicons name="share-social-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {showCardChooser && user?.premium && (
          <View className="px-5 mb-6">
            <Text className="text-gray-300 mb-4">
              Slide et clique sur une carte pour l'appliquer.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_PREVIEW_WIDTH + 16}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {cardOptions.map((option) => {
                const isActive = cardStyle === option.id;

                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => updateCardStyle(option.id)}
                    className="mr-4"
                    activeOpacity={0.9}
                  >
                    <View
                      className={`rounded-2xl overflow-hidden border bg-[#0b0b0b] shadow-lg shadow-black/40 ${
                        isActive ? "border-orange-500" : "border-gray-800"
                      }`}
                      style={{
                        width: CARD_PREVIEW_WIDTH,
                        aspectRatio: 0.68,
                        padding: 6,
                      }}
                    >
                      <Image
                        source={option.image}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                      {isActive && (
                        <View className="absolute top-3 right-3 bg-orange-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">
                            Activée
                          </Text>
                        </View>
                      )}
                    </View>
                    <View
                      className={`mt-2 self-center px-3 py-1 rounded-full border ${
                        isActive
                          ? "bg-orange-500/15 border-orange-500/40"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isActive ? "text-orange-200" : "text-gray-200"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View
          className="px-5"
          style={{ marginTop: IS_SMALL_PHONE ? 24 : 16 }}
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="book-outline" size={20} color="#F97316" />
            <Text className="text-white text-lg font-semibold ml-2">
              Biographie
            </Text>
          </View>
          <LinearGradient
            colors={["#0b1220", "#0d182c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 1,
            }}
          >
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
          </LinearGradient>
        </View>
        {user?.premium ? (
          <View className="mt-2">
            <View className="px-5 mt-4">
              <TouchableOpacity
                onPress={() => navigation.navigate("SubscriptionSettings")}
                className="bg-[#111] border border-white/10 rounded-2xl px-4 py-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-orange-500/20 items-center justify-center mr-3">
                    <Ionicons name="settings-outline" size={20} color="#FDBA74" />
                  </View>
                  <View>
                    <Text className="text-white font-semibold">
                      Paramètres d'abonnement
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      Gère ton abonnement
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <StatsChartSection playerUid={user?.uid} />
          </View>
        ) : (
          <View className="mt-6 px-5">
            <View className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-4">
              <Text className="text-white font-semibold text-lg">
                Stats graphiques réservées au Premium
              </Text>
              <Text className="text-gray-400 mt-1">
                Active l’offre Premium pour suivre tes courbes et progresser avec plus de détails.
              </Text>
              <View className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-[#111]">
                <View className="px-4 pt-3">
                  <Text className="text-gray-400 text-xs uppercase">
                    Apercu des graphiques
                  </Text>
                </View>
                <View className="h-32 px-4 pb-4">
                  <View className="flex-1 justify-center">
                    <Svg width="100%" height="100%" viewBox="0 0 300 120">
                      <Path
                        d="M0 90 C 40 40, 80 110, 120 70 C 160 30, 200 80, 240 40 C 265 20, 285 30, 300 20"
                        stroke="#FDBA74"
                        strokeWidth={4}
                        fill="none"
                        opacity={0.95}
                      />
                    </Svg>
                  </View>
                  <BlurView intensity={35} tint="dark" className="absolute inset-0" />
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="bg-black/60 border border-white/20 rounded-full p-3">
                      <Ionicons name="lock-closed" size={20} color="#fff" />
                    </View>
                  </View>
                </View>
              </View>

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

        {/* Actions rapides (même DA que Home) */}
        <View className="mt-10 px-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="flash-outline" size={20} color="#F97316" />
              <Text className="text-white text-lg font-semibold ml-2">
                Actions
              </Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-3 mt-3">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                activeOpacity={0.9}
                onPress={action.onPress}
                className="flex-1 min-w-[160px]"
              >
                <LinearGradient
                  colors={action.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 18, padding: 1 }}
                >
                  <View className="bg-[#0E0D0D] rounded-[16px] px-4 py-4 flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-semibold">
                        {action.title}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        {action.subtitle}
                      </Text>
                    </View>
                    <View className="bg-white/10 p-2 rounded-full">
                      <Ionicons name={action.icon} size={18} color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PostGridSection
          posts={posts}
          onOpenPost={(post, _index) =>
            navigation.navigate("EditPost", {
              post,
            })
          }
          onCreatePost={() => navigation.navigate("CreatePost")}
        />

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



