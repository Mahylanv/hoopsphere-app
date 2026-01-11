import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../types";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../config/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ClubVisitorsScreen() {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<any[]>([]);
  const mountedRef = useRef(true);

  const brand = {
    orange: "#F97316",
    orangeLight: "#fb923c",
    blue: "#2563EB",
    surface: "#0E0D0D",
  } as const;

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
            }
          }
        } catch {}
        if (data.viewedAt?.toDate) {
          viewedAt = data.viewedAt.toDate();
        }
        byViewer.set(viewerUid, { id: viewerUid, viewerUid, name, avatar, role, viewedAt });
      }
      if (mountedRef.current) setVisitors(Array.from(byViewer.values()));
    } catch (e) {
      if (mountedRef.current) setVisitors([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchVisitors]);

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <View className="px-5 pt-5">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Consultations profil</Text>
          <View className="w-8" />
        </View>

        <View
          style={{
            borderRadius: 20,
            padding: 1.5,
            backgroundColor: "transparent",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#0E0D0D",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(37,99,235,0.35)",
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                right: -80,
                top: -60,
                width: 200,
                height: 200,
                borderRadius: 9999,
                backgroundColor: "rgba(37,99,235,0.16)",
              }}
            />
            <View
              style={{
                position: "absolute",
                left: -70,
                bottom: -60,
                width: 180,
                height: 180,
                borderRadius: 9999,
                backgroundColor: "rgba(249,115,22,0.14)",
              }}
            />

            <View className="flex-row items-center justify-between mb-3">
              <View className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40">
                <Text className="text-blue-100 text-xs font-semibold uppercase">
                  Club
                </Text>
              </View>
              <View className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
                <Ionicons name="people-outline" size={16} color="#e5e7eb" />
                <Text className="text-white text-sm font-semibold ml-2">
                  {visitors.length} visites
                </Text>
              </View>
            </View>

            <Text className="text-white text-2xl font-bold tracking-tight">
              Visiteurs récents
            </Text>
            <Text className="text-gray-300 mt-1">
              Les derniers joueurs et clubs qui ont visité votre profil.
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : visitors.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mb-3">
            <Ionicons name="people-outline" size={26} color={brand.orange} />
          </View>
          <Text className="text-white text-lg font-semibold">
            Aucune consultation
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Dès qu'un joueur ou club visite votre profil, il apparaîtra ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 10 }}
          renderItem={({ item }) => (
            <LinearGradient
              colors={["rgba(37,99,235,0.25)", "rgba(17,24,39,0.9)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 18,
                padding: 1,
                marginBottom: 12,
              }}
            >
              <TouchableOpacity
                className="flex-row items-center bg-[#0E0D0D] rounded-[16px] p-4 shadow-lg shadow-black/40"
                onPress={() => navigation.navigate("JoueurDetail", { uid: item.viewerUid })}
              >
                <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 mr-3 border border-white/10">
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} className="w-full h-full" />
                  ) : (
                    <Ionicons name="person-circle-outline" size={42} color="#fff" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-semibold" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View className="ml-2 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                      <Text className="text-gray-200 text-[10px] font-semibold uppercase">
                        {item.role}
                      </Text>
                    </View>
                  </View>
                  {item.viewedAt && (
                    <Text className="text-gray-400 text-xs mt-1">
                      Vu le {item.viewedAt.toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#F97316" />
              </TouchableOpacity>
            </LinearGradient>
          )}
        />
      )}
    </SafeAreaView>
  );
}
