import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../types";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../config/firebaseConfig";
import PremiumWall from "../../../../shared/components/PremiumWall";
import { usePremiumStatus } from "../../../../shared/hooks/usePremiumStatus";
import PremiumBadge from "../../../../shared/components/PremiumBadge";
import { PROFILE_PLACEHOLDER } from "../../../../constants/images";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ClubVisitors">;

export default function ClubVisitorsScreen() {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<any[]>([]);
  const { isPremium, loading: premiumLoading } = usePremiumStatus();

  const fetchVisitors = useCallback(async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return setLoading(false);
    setLoading(true);
    try {
      const viewsRef = collection(db, "clubs", uid, "views");
      const snap = await getDocs(viewsRef);
      const byViewer = new Map<string, any>();
      for (const d of snap.docs) {
        const data = d.data();
        const viewerUid = data.viewerUid;
        if (!viewerUid || byViewer.has(viewerUid)) continue;
        let name = viewerUid;
        let avatar: string | undefined;
        let role = "Joueur";
        let viewedAt: Date | null = null;
        let premium = false;
        try {
          const userSnap = await getDoc(doc(db, "joueurs", viewerUid));
          if (userSnap.exists()) {
            const u = userSnap.data() as any;
            name = [u.prenom, u.nom].filter(Boolean).join(" ") || viewerUid;
            avatar = u.avatar;
            role = "Joueur";
          } else {
            const clubSnap = await getDoc(doc(db, "clubs", viewerUid));
            if (clubSnap.exists()) {
              const c = clubSnap.data() as any;
              name = c.nom || c.name || viewerUid;
              avatar = c.logo;
              role = "Club";
              premium = !!(c.premium ?? c.isPremium);
            }
          }
        } catch {}
        if (data.viewedAt?.toDate) {
          viewedAt = data.viewedAt.toDate();
        }
        byViewer.set(viewerUid, { id: viewerUid, viewerUid, name, avatar, role, viewedAt, premium });
      }
      setVisitors(Array.from(byViewer.values()));
    } catch (e) {
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!premiumLoading && isPremium) {
      fetchVisitors();
    } else if (!premiumLoading && !isPremium) {
      setLoading(false);
    }
  }, [fetchVisitors, isPremium, premiumLoading]);

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <View className="flex-row items-center px-4 py-4 border-b border-gray-800">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold ml-2">Consultations de profil</Text>
      </View>

      {premiumLoading || loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : !isPremium ? (
        <PremiumWall
          message="Les consultations de profil sont réservées aux clubs Premium."
          onPressUpgrade={() => navigation.navigate("Payment")}
        />
      ) : visitors.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-400 text-center">Aucun visiteur.</Text>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const avatarUri =
              typeof item.avatar === "string" ? item.avatar.trim() : "";
            const avatarSource =
              avatarUri && avatarUri !== "null" && avatarUri !== "undefined"
                ? { uri: avatarUri }
                : PROFILE_PLACEHOLDER;

            return (
              <TouchableOpacity
                className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 mb-3 flex-row items-center"
                onPress={() =>
                  navigation.navigate("JoueurDetail", { uid: item.viewerUid })
                }
              >
                <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 mr-3">
                  <Image source={avatarSource} className="w-full h-full" />
                </View>
              <View className="flex-1">
                <View className="flex-row items-center flex-wrap">
                  <Text className="text-white font-semibold" numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.role === "Club" && item.premium && (
                    <View className="ml-2">
                      <PremiumBadge compact />
                    </View>
                  )}
                </View>
                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                  {item.role}
                </Text>
                {item.viewedAt && (
                  <Text className="text-gray-500 text-xs mt-1">
                    Vu le {item.viewedAt.toLocaleDateString()}
                  </Text>
                )}
              </View>
                <Ionicons name="chevron-forward" size={18} color="#F97316" />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
