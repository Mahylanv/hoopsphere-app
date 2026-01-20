import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
import PremiumBadge from "../../../shared/components/PremiumBadge";

type Liker = {
  uid: string;
  name: string;
  avatar?: string | null;
  type: "joueur" | "club" | "inconnu";
  city?: string | null;
  categories?: string[] | null;
  teamsCount?: number | null;
  premium?: boolean;
};

type PostWithLikers = {
  id: string;
  mediaUrl: string;
  mediaType?: "image" | "video";
  thumbnailUrl?: string | null;
  description?: string;
  location?: string | null;
  skills?: string[];
  likeCount: number;
  likedBy: string[];
  createdAt?: any;
  likers: Liker[];
};

type PostLikesContentProps = {
  title?: string;
  onCountChange?: (count: number) => void;
};

const toDate = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") value = value.toDate();
  else if (value?.seconds) value = new Date(value.seconds * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (value: any) => {
  const d = toDate(value);
  if (!d) return null;
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
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
        let premium = false;

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
        premium = !!(data.premium ?? data.isPremium);
      }
    }

    results.push({ uid, name, avatar, type, city, categories, teamsCount, premium });
  }

  return results;
}

export function PostLikesContent({
  title,
  onCountChange,
}: PostLikesContentProps) {
  const navigation = useNavigation<any>();
  const auth = getAuth();
  const db = getFirestore();

  const [posts, setPosts] = useState<PostWithLikers[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [expandedByPost, setExpandedByPost] = useState<
    Record<string, boolean>
  >({});
  const [sortKey, setSortKey] = useState<
    "likesDesc" | "likesAsc" | "newest" | "oldest"
  >("likesDesc");

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

          const likeCount = data.likeCount ?? 0;
          const shouldFetchLikes =
            !likedBy || likedBy.length === 0 || likedBy.length < likeCount;

          if (shouldFetchLikes) {
            try {
              const likesRef = collection(db, "posts", docSnap.id, "likes");
              const likesSnap = await getDocs(likesRef);
              const fromSub = likesSnap.docs.map((d) => d.id);
              likedBy = Array.from(new Set([...likedBy, ...fromSub]));
            } catch (err) {
              setPermissionBlocked(true);
            }
          }

          const likers = await fetchLikerProfiles(db, likedBy);

          enriched.push({
            id: docSnap.id,
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType ?? "video",
            thumbnailUrl: data.thumbnailUrl ?? null,
            description: data.description ?? "",
            location: data.location ?? null,
            skills: data.skills ?? [],
            likeCount,
            likedBy,
            createdAt: data.createdAt ?? null,
            likers,
          });
        }

        setPosts(enriched);
      } catch (e) {
        // console.log("Erreur chargement j'aime posts :", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth, db]);

  useEffect(() => {
    onCountChange?.(posts.length);
  }, [onCountChange, posts.length]);

  const renderLikers = (postId: string, likers: Liker[]) => {
    if (!likers || likers.length === 0) {
      return (
        <Text className="text-gray-400 text-sm">
          Aucun j'aime ou données manquantes.
        </Text>
      );
    }

    const isExpanded = !!expandedByPost[postId];
    const limit = 2;
    const visible = isExpanded ? likers : likers.slice(0, limit);
    const hasMore = likers.length > limit;

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
                    premium: !!l.premium,
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
              <View className="flex-row items-center flex-wrap">
                <Text className="text-white font-semibold" numberOfLines={1}>
                  {l.name}
                </Text>
                {l.type === "club" && l.premium && (
                  <View className="ml-2">
                    <PremiumBadge compact />
                  </View>
                )}
              </View>
              <Text className="text-gray-400 text-xs">{l.type}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
        ))}

        {hasMore ? (
          <TouchableOpacity
            onPress={() =>
              setExpandedByPost((prev) => ({
                ...prev,
                [postId]: !isExpanded,
              }))
            }
            className="self-start mt-1"
          >
            <Text className="text-orange-300 text-xs font-semibold">
              {isExpanded ? "Afficher moins" : "Afficher plus"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </>
    );
  };

  return (
    <>
      {title ? (
        <View className="px-4 pt-3">
          <Text className="text-white text-base font-semibold">{title}</Text>
        </View>
      ) : null}
      <View className="px-4 py-3 border-b border-gray-900 flex-row flex-wrap gap-2">
        {[
          { key: "likesDesc", label: "Plus aimé" },
          { key: "likesAsc", label: "Moins aimé" },
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
                Certains j'aime ne peuvent pas être listés à cause des règles
                Firestore. Les posts aimés après la dernière mise à jour
                remplissent bien la liste.
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
                  Aucun post trouvé ou pas encore de j'aime.
                </Text>
              </View>
            )}
            renderItem={({ item, index }) => {
              const currentUid = auth.currentUser?.uid;
              const isImage = item.mediaType === "image";
              const previewUrl = item.thumbnailUrl || item.mediaUrl;
              return (
                <View className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 mb-4">
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      if (!currentUid) return;
                      navigation.navigate("VideoFeed", {
                        videos: sortedPosts.map((post) => ({
                          id: post.id,
                          url: post.mediaUrl,
                          mediaType: post.mediaType ?? "video",
                          thumbnailUrl: post.thumbnailUrl ?? null,
                          playerUid: currentUid,
                          likeCount: post.likeCount ?? 0,
                          isLikedByMe: false,
                          description: post.description ?? "",
                          location: post.location ?? null,
                          skills: post.skills ?? [],
                          createdAt: post.createdAt ?? null,
                        })),
                        startIndex: index,
                      });
                    }}
                  >
                    {isImage ? (
                      <Image
                        source={{ uri: previewUrl }}
                        style={{
                          width: "100%",
                          height: 200,
                          borderRadius: 12,
                          backgroundColor: "#000",
                        }}
                      />
                    ) : (
                      <Video
                        source={{ uri: item.mediaUrl }}
                        style={{
                          width: "100%",
                          height: 200,
                          borderRadius: 12,
                          backgroundColor: "#000",
                        }}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted
                        isLooping
                      />
                    )}
                  </TouchableOpacity>

                  <View className="flex-row items-center justify-between mt-3">
                    <Text
                      className="text-white font-semibold flex-1"
                      numberOfLines={1}
                    >
                      J'aime : {item.likeCount}
                    </Text>
                    <Text className="text-orange-400 font-semibold ml-2">
                      {formatDate(item.createdAt) ?? "Date inconnue"}
                    </Text>
                  </View>

                  <View className="mt-3">
                    <Text className="text-white font-semibold mb-2">
                      Personnes ayant aimé
                    </Text>
                    {item.likers.length > 0 ? (
                      renderLikers(item.id, item.likers)
                    ) : (
                      <Text className="text-gray-400 text-sm">
                        {permissionBlocked && item.likeCount > 0
                          ? "J'aime présents mais non listables (permissions)."
                          : "Aucun j'aime ou données manquantes."}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </>
  );
}
