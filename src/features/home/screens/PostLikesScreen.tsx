// src/features/home/screens/PostLikesScreen.tsx
// Liste les posts du joueur et affiche les personnes qui les ont likés

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { Video, ResizeMode } from "expo-av";
import { RootStackParamList } from "../../../types";

const toDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") value = value.toDate();
  else if (value?.seconds) value = new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (value: any) => {
  const d = toDate(value);
  if (!d) return null;
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

type NavProp = NativeStackNavigationProp<RootStackParamList, "PostLikes">;

type Liker = {
  uid: string;
  name: string;
  avatar?: string | null;
  type: "joueur" | "club" | "inconnu";
  city?: string | null;
  categories?: string[] | null;
  teamsCount?: number | null;
};

type PostWithLikers = {
  id: string;
  mediaUrl: string;
  likeCount: number;
  likedBy: string[];
  createdAt?: any;
  likers: Liker[];
};

async function fetchLikerProfiles(db: any, uids: string[]): Promise<Liker[]> {
  const results: Liker[] = [];

  for (const uid of uids) {
    let type: Liker["type"] = "inconnu";
    let name = "Inconnu";
    let avatar: string | null = null;
    let city: string | null = null;
    let categories: string[] | null = null;
    let teamsCount: number | null = null;

    // Joueur
    const joueurSnap = await getDoc(doc(db, "joueurs", uid));
    if (joueurSnap.exists()) {
      const data = joueurSnap.data();
      type = "joueur";
      name = `${data.prenom ?? ""} ${data.nom ?? ""}`.trim() || "Joueur";
      avatar = data.avatar ?? null;
    } else {
      const clubSnap = await getDoc(doc(db, "clubs", uid));
      if (clubSnap.exists()) {
        const data = clubSnap.data();
        type = "club";
        name = data.name ?? "Club";
        avatar = data.logo ?? null;
        city = data.city ?? null;
        categories = data.categories ?? null;
        teamsCount = Array.isArray(data.teams) ? data.teams.length : data.teams ?? null;
      }
    }

    results.push({ uid, name, avatar, type, city, categories, teamsCount });
  }

  return results;
}

export default function PostLikesScreen() {
  const navigation = useNavigation<NavProp>();
  const auth = getAuth();
  const db = getFirestore();

  const [posts, setPosts] = useState<PostWithLikers[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [sortKey, setSortKey] = useState<"likesDesc" | "likesAsc" | "newest" | "oldest">("likesDesc");

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    return arr.sort((a, b) => {
      const aDate = toDate(a.createdAt);
      const bDate = toDate(b.createdAt);
      switch (sortKey) {
        case "likesAsc":
          return (a.likeCount ?? 0) - (b.likeCount ?? 0);
        case "newest":
          return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
        case "oldest":
          return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
        case "likesDesc":
        default:
          return (b.likeCount ?? 0) - (a.likeCount ?? 0);
      }
    });
  }, [posts, sortKey]);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("playerUid", "==", user.uid));
        const snap = await getDocs(q);

        const enriched: PostWithLikers[] = [];

        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          let likedBy: string[] = Array.isArray(data.likedBy)
            ? data.likedBy
            : [];

          // Fallback : récupérer les likes dans la sous-collection si le champ likedBy n'est pas rempli.
          // Si les règles bloquent la lecture (permissions), on ignore l'erreur pour ne pas casser l'écran.
          if (!likedBy || likedBy.length === 0) {
            try {
              const likesRef = collection(db, "posts", docSnap.id, "likes");
              const likesSnap = await getDocs(likesRef);
              likedBy = likesSnap.docs.map((d) => d.id);
            } catch (err) {
              // console.log("⚠️ Impossible de lire la sous-collection likes (permissions)", err);
              setPermissionBlocked(true);
            }
          }

          const likers = await fetchLikerProfiles(db, likedBy);

          enriched.push({
            id: docSnap.id,
            mediaUrl: data.mediaUrl,
            likeCount: data.likeCount ?? 0,
            likedBy,
            createdAt: data.createdAt ?? null,
            likers,
          });
        }

        setPosts(enriched);
      } catch (e) {
        // console.log("❌ Erreur chargement likes posts :", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const renderLikers = (likers: Liker[]) => {
    if (!likers || likers.length === 0) {
      return (
        <Text className="text-gray-400 text-sm">Aucun like ou données manquantes.</Text>
      );
    }

    const visible = likers.slice(0, 7);
    const hasMore = likers.length > 7;

    return (
      <>
        {visible.map((l) => (
          <TouchableOpacity
            key={l.uid}
            onPress={() => {
              if (l.type === "joueur") {
                navigation.navigate("JoueurDetail", { uid: l.uid });
              } else if (l.type === "club") {
                navigation.navigate("ProfilClub", {
                  club: {
                    id: l.uid,
                    name: l.name,
                    logo: l.avatar ?? null,
                    city: l.city ?? "Non renseigné",
                    teams: l.teamsCount ?? 0,
                    categories: l.categories ?? [],
                  },
                } as any);
              }
            }}
            className="flex-row items-center bg-[#1A1A1A] px-3 py-2 rounded-lg mb-2"
          >
            <View className="w-9 h-9 rounded-full bg-[#2a2a2a] mr-3 overflow-hidden">
              {l.avatar ? (
                <Image source={{ uri: l.avatar }} className="w-full h-full" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Ionicons name="person" size={18} color="#888" />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold" numberOfLines={1}>
                {l.name}
              </Text>
              <Text className="text-gray-400 text-xs">{l.type}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
        ))}

        {hasMore && (
          <Text className="text-gray-400 text-xs mt-1">
            + {likers.length - 7} autres (ouvre le post pour voir tout)
          </Text>
        )}
      </>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">
            Likes sur mes posts
          </Text>
        </View>
        <View className="bg-orange-500/20 border border-orange-500 rounded-full px-3 py-1">
          <Text className="text-orange-400 font-semibold">
            {posts.length} post{posts.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* TRI */}
      <View className="px-4 py-3 border-b border-gray-900 flex-row flex-wrap gap-2">
        {[
          { key: "likesDesc", label: "Plus liké" },
          { key: "likesAsc", label: "Moins liké" },
          { key: "newest", label: "Plus récent" },
          { key: "oldest", label: "Plus ancien" },
        ].map((opt) => {
          const active = sortKey === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSortKey(opt.key as any)}
              className={`px-3 py-2 rounded-full border ${
                active
                  ? "border-orange-500 bg-orange-500/20"
                  : "border-gray-700"
              }`}
            >
              <Text
                className={
                  active ? "text-orange-300 font-semibold" : "text-gray-300"
                }
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <>
          {permissionBlocked && (
            <View className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl px-4 py-3 m-3">
              <Text className="text-yellow-300 text-sm">
                Certains likes ne peuvent pas être listés à cause des règles Firestore. Les posts liker après la dernière mise à jour remplissent bien la liste.
              </Text>
            </View>
          )}
          <FlatList
            data={sortedPosts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center mt-20">
                <Text className="text-gray-400 text-center">
                  Aucun post trouvé ou pas encore de likes.
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
            <View className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 mb-4">
              <Video
                source={{ uri: item.mediaUrl }}
                style={{ width: "100%", height: 200, borderRadius: 12, backgroundColor: "#000" }}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isMuted
                isLooping
              />

              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-white font-semibold flex-1" numberOfLines={1}>
                  Likes : {item.likeCount}
                </Text>
                <Text className="text-orange-400 font-semibold ml-2">
                  {formatDate(item.createdAt) ?? "Date inconnue"}
                </Text>
              </View>

              <View className="mt-3">
                <Text className="text-white font-semibold mb-2">
                  Personnes ayant liké
                </Text>
                {item.likers.length > 0 ? (
                  renderLikers(item.likers)
                ) : (
                  <Text className="text-gray-400 text-sm">
                    {permissionBlocked && item.likeCount > 0
                      ? "Likes présents mais non listables (permissions)."
                      : "Aucun like ou données manquantes."}
                  </Text>
                )}
              </View>
            </View>
          )}
        />
        </>
      )}
    </SafeAreaView>
  );
}
