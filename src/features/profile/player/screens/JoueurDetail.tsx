// src/features/profile/player/screens/JoueurDetail.tsx
// Écran Détail d'un joueur – Profil public

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Linking,
  FlatList,
  Image,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

import usePlayerProfile from "../hooks/usePlayerProfile"; // adapte le path exactement
import { computePlayerStats } from "../../../../utils/player/computePlayerStats";
import { computePlayerRating } from "../../../../utils/player/computePlayerRating";
import { RootStackParamList } from "../../../../types";
import AvatarSection from "../components/AvatarSection";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { usePremiumStatus } from "../../../../shared/hooks/usePremiumStatus";
import usePlayerPosts from "../hooks/usePlayerPosts";
import PostGridSection from "../components/PostGridSection";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_PHONE = SCREEN_WIDTH <= 360 || SCREEN_HEIGHT <= 700;

const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.3;
const SMALL_PHONE_CARD_SCALE = IS_SMALL_PHONE ? 0.8 : 1;

type RouteProps = RouteProp<RootStackParamList, "JoueurDetail">;
type NavProps = NativeStackNavigationProp<RootStackParamList, "JoueurDetail">;

export default function JoueurDetail() {
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteProps>();

  const { uid } = route.params;
  const { saveProfileView } = usePlayerProfile();

  const [joueur, setJoueur] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [rating, setRating] = useState<number | null>(null);
  const { isPremium } = usePremiumStatus();
  const { posts: playerPosts, loading: postsLoading } = usePlayerPosts(uid);
  const [viewerIsClub, setViewerIsClub] = useState(false);
  const GRID_PADDING = 8;
  const GRID_PADDING_BOTTOM = 12;
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const GRID_SIZE =
    ((gridWidth ?? Dimensions.get("window").width) - GRID_PADDING * 2) / 3;
  const [activeTab, setActiveTab] = useState<"info" | "bio" | "posts">("info");

  /* =============================================
     🔥 FETCH DU JOUEUR PAR UID
  ===============================================*/
  useEffect(() => {
    const loadPlayer = async () => {
      try {
        /* -----------------------------------------------------
         📌 FETCH DU JOUEUR
      ----------------------------------------------------- */
        const ref = doc(db, "joueurs", uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          Alert.alert("Erreur", "Joueur introuvable.");
          navigation.goBack();
          return;
        }

        const raw = snap.data();

        setJoueur({
          ...raw,
          email: raw.email ?? "-",
          dob: raw.dob ?? "-",
          departement: raw.departement ?? "-",
          club: raw.club ?? "-",
          taille: raw.taille ?? "-",
          poids: raw.poids ?? "-",
          genre: raw.genre ?? "-",
          main: raw.main ?? "-",
          cardStyle: raw.cardStyle ?? "normal",
        });

        /* -----------------------------------------------------
   👀 ENREGISTRER UNE VISITE (1 fois / jour)
----------------------------------------------------- */
        // const auth = getAuth();
        // const viewerUid = auth.currentUser?.uid;

        // console.log("👤 viewerUid =", viewerUid, " | target =", uid);
        // if (viewerUid && viewerUid !== uid) {
        //   try {
        //     const today = new Date();
        //     today.setHours(0, 0, 0, 0);
        //     const viewsRef = collection(db, "joueurs", uid, "views");
        //     const snaps = await getDocs(viewsRef);
        //     let alreadyVisitedToday = false;
        //     snaps.forEach((docSnap) => {
        //       const data = docSnap.data();
        //       if (data.viewerUid === viewerUid && data.viewedAt?.toDate) {
        //         const visitDate = data.viewedAt.toDate();
        //         visitDate.setHours(0, 0, 0, 0);
        //         if (visitDate.getTime() === today.getTime()) {
        //           alreadyVisitedToday = true;
        //         }
        //       }
        //     });
        //     if (!alreadyVisitedToday) {
        //       await addDoc(viewsRef, {
        //         viewerUid,
        //         viewerType: "joueur",
        //         viewedAt: serverTimestamp(),
        //         seen: true,
        //       });
        //     }
        //   } catch (e) {
        //     // console.log("❌ ERREUR GLOBALE ENREGISTREMENT VISITE :", e);
        //   }
        // }

        // 👀 ENREGISTREMENT VISITE (simple)
        const authInstance = getAuth();
        const viewerUid = authInstance.currentUser?.uid;

        if (viewerUid && viewerUid !== uid) {
          saveProfileView(uid);
        }

        /* -----------------------------------------------------
         📊 STATS JOUEUR
      ----------------------------------------------------- */
        const matchSnap = await getDocs(
          collection(db, "joueurs", uid, "matches")
        );
        const matches = matchSnap.docs.map((d) => d.data() as any);

        const averages = computePlayerStats(matches);
        setStats(averages);

        const finalRating = computePlayerRating(averages, raw.poste);
        setRating(finalRating);
      } catch (e) {
        // console.log("❌ Erreur fetch joueur :", e);
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, [uid]);

  useEffect(() => {
    const loadViewerType = async () => {
      try {
        const auth = getAuth();
        const viewerUid = auth.currentUser?.uid;
        if (!viewerUid) {
          setViewerIsClub(false);
          return;
        }
        const clubRef = doc(db, "clubs", viewerUid);
        const clubSnap = await getDoc(clubRef);
        setViewerIsClub(clubSnap.exists());
      } catch {
        setViewerIsClub(false);
      }
    };
    loadViewerType();
  }, []);

  /* -----------------------------------------------------
     🔥 REF POUR LA CAPTURE
  ----------------------------------------------------- */
  const cardRef = useRef<ViewShot>(null);

  /* -----------------------------------------------------
     🔥 ANIMATIONS SCROLL
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
  const cardScale = Animated.multiply(scale, SMALL_PHONE_CARD_SCALE);

  /* -----------------------------------------------------
     🔥 BOTTOM SHEET
  ----------------------------------------------------- */
  const sheetY = useRef(new Animated.Value(300)).current;
  const [isSheetOpen, setSheetOpen] = useState(false);

  const openSheet = () => {
    setSheetOpen(true);
    Animated.timing(sheetY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () =>
    Animated.timing(sheetY, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSheetOpen(false));

  /* -----------------------------------------------------
   📞 CONTACT SHEET
----------------------------------------------------- */
  const contactSheetY = useRef(new Animated.Value(300)).current;
  const [isContactOpen, setContactOpen] = useState(false);

  const openContactSheet = () => {
    setContactOpen(true);
    Animated.timing(contactSheetY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeContactSheet = () =>
    Animated.timing(contactSheetY, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setContactOpen(false));

  /* -----------------------------------------------------
     🔥 CAPTURE LOGIQUE
  ----------------------------------------------------- */

  const captureCard = async () => {
    try {
      const uri = await cardRef.current?.capture?.();
      return uri ?? null;
    } catch (e) {
      // console.log("❌ Erreur capture :", e);
      return null;
    }
  };

  const downloadCard = async () => {
    const uri = await captureCard();
    if (!uri) return;

    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorise l’accès à la galerie.");
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert("Succès", "La carte est enregistrée !");
  };

  const shareCard = async () => {
    const uri = await captureCard();
    if (!uri) return;

    await Sharing.shareAsync(uri);
  };

  const addFavorite = () => {
    if (!isPremium) {
      Alert.alert(
        "Fonction Premium",
        "Les favoris sont réservés aux membres Premium.",
        [
          { text: "Plus tard", style: "cancel" },
          {
            text: "Passer Premium",
            onPress: () => (navigation as any).navigate("Payment"),
          },
        ]
      );
      return;
    }
    Alert.alert("Favoris", "Joueur ajouté !");
  };

  /* -----------------------------------------------------
     🔥 LOADING SCREEN
  ----------------------------------------------------- */
  if (loading || !joueur) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-white mt-3">Chargement du joueur...</Text>
      </View>
    );
  }

  /* -----------------------------------------------------
     🔥 RENDER
  ----------------------------------------------------- */
  return (
    <SafeAreaView className="flex-1 bg-[#0d0d0f]">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800 bg-[#0d0d0f]">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full bg-gray-800"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold ml-3">
          Profil du joueur
        </Text>
      </View>

      {/* SCROLLVIEW */}
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
        {/* 🔥 CARTE ANIMÉE (même structure que ProfilJoueur) */}
        <Animated.View
          style={{
            position: "absolute",
            top: IS_SMALL_PHONE ? -28 : 0,
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
              user={{
                avatar: joueur.avatar ?? null,
                prenom: joueur.prenom ?? "",
                nom: joueur.nom ?? "",
                dob: joueur.dob,
                taille: joueur.taille,
                poids: joueur.poids,
                poste: joueur.poste,
                main: joueur.main,
                departement: joueur.departement,
                club: joueur.club,
                description: joueur.description,
                premium: joueur.premium,
                cardStyle: joueur.cardStyle,
              }}
              onEditAvatar={async () => {}}
              avatarLoading={false}
              stats={stats}
              rating={rating ?? undefined}
              editable={false}
            />
          </ViewShot>
        </Animated.View>

        {/* Tabs */}
        <View className="px-4 mt-6">
          <View className="flex-row bg-gray-900 border border-gray-800 rounded-2xl p-1">
            <TouchableOpacity
              onPress={() => setActiveTab("info")}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === "info" ? "bg-orange-600" : ""}`}
              activeOpacity={0.85}
            >
              <Text className={`${activeTab === "info" ? "text-white" : "text-gray-400"} text-sm font-semibold`}>
                Infos perso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("bio")}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === "bio" ? "bg-orange-600" : ""}`}
              activeOpacity={0.85}
            >
              <Text className={`${activeTab === "bio" ? "text-white" : "text-gray-400"} text-sm font-semibold`}>
                Biographie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("posts")}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === "posts" ? "bg-orange-600" : ""}`}
              activeOpacity={0.85}
            >
              <Text className={`${activeTab === "posts" ? "text-white" : "text-gray-400"} text-sm font-semibold`}>
                Publications
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === "info" && (
          <View className="px-4 mt-4">
            <LinearGradient
              colors={["#2563EB", "#0E0D0D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 1.5 }}
            >
              <View className="bg-[#0E0D0D] rounded-[16px] p-5">
                <View className="absolute -right-10 -top-8 w-28 h-28 rounded-full" style={{ backgroundColor: "rgba(249,115,22,0.14)" }} />
                <View className="absolute -left-12 bottom-0 w-24 h-24 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.14)" }} />

                <View className="flex-row items-center mb-3">
                  <Ionicons name="person-circle-outline" size={22} color="white" />
                  <Text className="text-white text-xl font-bold ml-2">
                    Infos perso
                  </Text>
                </View>

                <InfoRow icon="mail" label="Email" value={joueur.email} />
                <InfoRow
                  icon="phone-portrait"
                  label="Numéro"
                  value={joueur.phone}
                />
                <InfoRow icon="calendar" label="Naissance" value={joueur.dob} />
                <InfoRow
                  icon="location"
                  label="Département"
                  value={joueur.departement}
                />
                <InfoRow icon="basketball" label="Club" value={joueur.club} />
                <InfoRow icon="body" label="Taille" value={joueur.taille} />
                <InfoRow icon="barbell" label="Poids" value={joueur.poids} />
                <InfoRow icon="male-female" label="Genre" value={joueur.genre} />
                <InfoRow
                  icon="hand-left-outline"
                  label="Main"
                  value={joueur.main}
                />
              </View>
            </LinearGradient>
          </View>
        )}

        {activeTab === "bio" && (
          <View className="px-4 mt-4">
            <LinearGradient
              colors={["#2563EB", "#0E0D0D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 1.5 }}
            >
              <View className="bg-[#0E0D0D] rounded-[16px] p-5">
                <View
                  className="absolute -right-10 -top-8 w-28 h-28 rounded-full"
                  style={{ backgroundColor: "rgba(37,99,235,0.14)" }}
                />
                <View
                  className="absolute -left-12 bottom-0 w-24 h-24 rounded-full"
                  style={{ backgroundColor: "rgba(37,99,235,0.1)" }}
                />

                <View className="flex-row items-center mb-3">
                  <Ionicons name="book-outline" size={22} color="white" />
                  <Text className="text-white text-xl font-bold ml-2">
                    Biographie
                  </Text>
                </View>

                <Text className="text-gray-300 leading-6">
                  {joueur.description?.trim()
                    ? joueur.description
                    : "Aucune biographie renseignée."}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {activeTab === "posts" && (
          <View className="mt-4">
            <LinearGradient
              colors={["#F97316", "#0E0D0D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 1.5 }}
            >
              <View
                className="bg-[#0E0D0D] rounded-[16px] overflow-hidden"
                onLayout={(event) => {
                  const width = event.nativeEvent.layout.width;
                  setGridWidth((prev) => (prev === width ? prev : width));
                }}
              >
                <View
                  className="absolute -right-10 -top-8 w-28 h-28 rounded-full"
                  style={{ backgroundColor: "rgba(249,115,22,0.12)" }}
                />
                <View
                  className="absolute -left-12 bottom-0 w-24 h-24 rounded-full"
                  style={{ backgroundColor: "rgba(37,99,235,0.1)" }}
                />

                <View className="flex-row items-center mb-3 px-4 pt-4">
                  <Ionicons name="play-outline" size={22} color="white" />
                  <Text className="text-white text-xl font-bold ml-2">
                    Publications
                  </Text>
                  <View className="ml-2 bg-white/10 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                      {playerPosts.length}
                    </Text>
                  </View>
                </View>

                {postsLoading ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="small" color="#F97316" />
                  </View>
                ) : playerPosts.length === 0 ? (
                  <Text className="text-gray-400 px-4 pb-4">
                    Aucune publication.
                  </Text>
                ) : (
                  <FlatList
                    data={playerPosts}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={{
                      paddingHorizontal: GRID_PADDING,
                      paddingBottom: GRID_PADDING_BOTTOM,
                    }}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() =>
                          navigation.navigate("VideoFeed", {
                            videos: playerPosts.map((p) => ({
                              id: p.id,
                              url: p.mediaUrl,
                              cachedUrl: (p as any).cachedUrl ?? undefined,
                              mediaType: p.mediaType,
                              playerUid: p.playerUid ?? uid,
                              likeCount: p.likeCount ?? 0,
                              isLikedByMe: false,
                              thumbnailUrl: p.thumbnailUrl ?? null,
                              description: p.description ?? "",
                              location: p.location ?? null,
                              skills: p.skills ?? [],
                              createdAt: p.createdAt,
                            })),
                            startIndex: index,
                          })
                        }
                        style={{
                          width: GRID_SIZE,
                          height: GRID_SIZE,
                          borderRadius: 0,
                          overflow: "hidden",
                          backgroundColor: "#0f1115",
                        }}
                      >
                        {item.mediaType === "image" || item.thumbnailUrl ? (
                          <Image
                            source={{ uri: item.mediaType === "image" ? item.mediaUrl : item.thumbnailUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Video
                            source={{ uri: item.mediaUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                            isMuted
                          />
                        )}
                        {item.mediaType !== "image" && (
                          <View className="absolute right-1 top-1 bg-black/50 rounded-full p-1">
                            <Ionicons name="play" size={12} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* CONTACT (clubs only) */}
        {viewerIsClub && (
          <View className="px-5 mt-2 mb-7">
            <TouchableOpacity
              onPress={openContactSheet}
              activeOpacity={0.85}
              className="bg-[#ff6600] py-4 rounded-2xl items-center shadow-lg shadow-[#ff6600]/40 flex-row justify-center"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white text-lg font-semibold">
                Contacter le joueur
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>

      {/* OVERLAY */}
      {isSheetOpen && (
        <TouchableOpacity
          onPress={closeSheet}
          activeOpacity={1}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* BOTTOM SHEET */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          padding: 20,
          backgroundColor: "#111",
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          transform: [{ translateY: sheetY }],
        }}
      >
        <Text className="text-white text-xl font-bold mb-4">Actions</Text>

        <Option
          icon="download-outline"
          label="Télécharger"
          onPress={downloadCard}
        />
        <Option icon="share-outline" label="Partager" onPress={shareCard} />
        <Option icon="star-outline" label="Favoris" onPress={addFavorite} />
      </Animated.View>

      {viewerIsClub && (
        <>
          {isContactOpen && (
            <TouchableOpacity
              onPress={closeContactSheet}
              activeOpacity={1}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            />
          )}

          {/* BOTTOM SHEET CONTACT */}
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 240,
              padding: 20,
              backgroundColor: "#111",
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              transform: [{ translateY: contactSheetY }],
            }}
          >
            <Text className="text-white text-xl font-bold mb-4">
              Contacter le joueur
            </Text>

            {/* EMAIL */}
            <Option
              icon="mail-outline"
              label="Envoyer un email"
              onPress={async () => {
                closeContactSheet();

                if (!joueur.email || joueur.email === "-") {
                  Alert.alert("Indisponible", "Email non renseigné");
                  return;
                }

                const url = `mailto:${joueur.email}`;
                const supported = await Linking.canOpenURL(url);

                if (supported) {
                  Linking.openURL(url);
                } else {
                  Alert.alert("Erreur", "Impossible d’ouvrir l’application mail");
                }
              }}
            />

            {/* TELEPHONE */}
            <Option
              icon="call-outline"
              label="Contacter le joueur"
              onPress={() => {
                closeContactSheet();

                if (!joueur.phone) {
                  Alert.alert("Indisponible", "Téléphone non renseigné");
                  return;
                }

                Alert.alert(
                  "Contacter le joueur",
                  "Choisissez une action",
                  [
                    {
                      text: "Appeler",
                      onPress: async () => {
                        const url = `tel:${joueur.phone}`;
                        const supported = await Linking.canOpenURL(url);

                        if (supported) {
                          Linking.openURL(url);
                        } else {
                          Alert.alert("Erreur", "Impossible d’ouvrir le téléphone");
                        }
                      },
                    },
                    {
                      text: "Envoyer un message",
                      onPress: async () => {
                        const url = `sms:${joueur.phone}`;
                        const supported = await Linking.canOpenURL(url);

                        if (supported) {
                          Linking.openURL(url);
                        } else {
                          Alert.alert("Erreur", "Impossible d’ouvrir les messages");
                        }
                      },
                    },
                    {
                      text: "Annuler",
                      style: "cancel",
                    },
                  ],
                  { cancelable: true }
                );
              }}
            />
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

/* -----------------------------------------------------
   🔧 COMPONENT OPTION
----------------------------------------------------- */
type OptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

const Option = ({ icon, label, onPress }: OptionProps) => (
  <TouchableOpacity className="flex-row items-center py-3" onPress={onPress}>
    <View className="w-10 h-10 rounded-full bg-[#222] items-center justify-center mr-4">
      <Ionicons name={icon} size={22} color="#ff6600" />
    </View>
    <Text className="text-white text-base">{label}</Text>
  </TouchableOpacity>
);

/* -----------------------------------------------------
   🔧 INFO ROW
----------------------------------------------------- */
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) => (
  <View className="flex-row items-center mb-4">
    <View className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-3">
      <Ionicons name={icon} size={20} color="#fff" />
    </View>

    <View className="flex-1">
      <Text className="text-gray-400 text-xs">{label}</Text>
      <Text className="text-white text-base font-medium">
        {value ? String(value) : "-"}
      </Text>
    </View>
  </View>
);
