import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
    Alert,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../../../../config/firebaseConfig";
import {
    collectionGroup,
    onSnapshot,
    orderBy,
    query as fsQuery,
    where,
    updateDoc,
    doc,
    getDoc,
} from "firebase/firestore";

type Candidature = {
    id: string;
    // champs utiles – assure-toi de les poser à la création :
    clubUid: string;
    offerId: string;
    offerTitle?: string;
    applicantUid?: string;
    applicantEmail?: string;
    message?: string;
    status?: "pending" | "accepted" | "rejected";
    createdAt?: any; // Timestamp Firestore
};

const STATUS_LABEL: Record<NonNullable<Candidature["status"]>, string> = {
    pending: "En attente",
    accepted: "Acceptée",
    rejected: "Refusée",
};

const brand = {
    orange: "#F97316",
    orangeLight: "#fb923c",
    blue: "#2563EB",
    surface: "#0E0D0D",
} as const;

export default function ManageCandidatures() {
    const uid = auth.currentUser?.uid || null;
    const navigation = useNavigation<any>();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [rows, setRows] = useState<Candidature[]>([]);
    const [playerCache, setPlayerCache] = useState<
        Record<string, { name: string; avatar?: string | null }>
    >({});

    // filtres UI
    const [search, setSearch] = useState(""); // recherche sur email / titre offre / message
    const [statusFilter, setStatusFilter] = useState<("pending" | "accepted" | "rejected") | "all">(
        "all"
    );

    useEffect(() => {
        if (!uid) {
            setErr("Tu dois être connecté en tant que club.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setErr(null);

        // On lit toutes les candidatures du club via collectionGroup + where('clubUid','==', uid)
        // (⚠️ nécessite d’avoir `clubUid` sur chaque doc candidature)
        const q = fsQuery(
            collectionGroup(db, "candidatures"),
            where("clubUid", "==", uid),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: Candidature[] = [];
                snap.forEach((d) => {
                    const data = d.data() as any;
                    list.push({
                        id: d.id,
                        clubUid: data.clubUid,
                        offerId: data.offerId || d.ref.parent.parent?.id, // fallback
                        offerTitle: data.offerTitle || "Offre",
                        applicantUid: data.applicantUid,
                        applicantEmail: data.applicantEmail,
                        message: data.message || "",
                        status: (data.status as any) || "pending",
                        createdAt: data.createdAt,
                    });
                });
                setRows(list);
                setLoading(false);
            },
            (e) => {
                console.error(e);
                setErr("Impossible de charger les candidatures.");
                setLoading(false);
            }
        );

        return () => unsub();
    }, [uid]);

    useEffect(() => {
        const missing = rows
            .map((row) => row.applicantUid)
            .filter(
                (applicantUid): applicantUid is string =>
                    !!applicantUid && !playerCache[applicantUid]
            );

        if (!missing.length) return;

        let cancelled = false;

        const fetchPlayers = async () => {
            const entries = await Promise.all(
                missing.map(async (applicantUid) => {
                    try {
                        const snap = await getDoc(doc(db, "joueurs", applicantUid));
                        if (snap.exists()) {
                            const data = snap.data() as any;
                            const firstName = (data?.prenom || "").toString().trim();
                            const lastName = (data?.nom || "").toString().trim();
                            const fullName = `${firstName} ${lastName}`.trim();
                            const name = fullName || firstName || lastName || "Joueur";
                            return [
                                applicantUid,
                                { name, avatar: data?.avatar ?? null },
                            ] as const;
                        }
                    } catch {
                        // ignore fetch errors for individual players
                    }
                    return [applicantUid, { name: "Joueur", avatar: null }] as const;
                })
            );

            if (cancelled) return;

            setPlayerCache((prev) => {
                const next = { ...prev };
                for (const [playerUid, data] of entries) {
                    next[playerUid] = data;
                }
                return next;
            });
        };

        fetchPlayers();

        return () => {
            cancelled = true;
        };
    }, [rows, playerCache]);

    // Filtrage client
    const filtered = useMemo(() => {
        let out = rows;

        if (statusFilter !== "all") {
            out = out.filter((r) => (r.status || "pending") === statusFilter);
        }

        if (search.trim()) {
            const lower = search.trim().toLowerCase();
            out = out.filter((r) => {
                const hay = [
                    r.offerTitle || "",
                    r.applicantEmail || "",
                    r.message || "",
                ]
                    .join(" ")
                    .toLowerCase();
                return hay.includes(lower);
            });
        }

        return out;
    }, [rows, statusFilter, search]);

    const setStatus = async (item: Candidature, status: "accepted" | "rejected" | "pending") => {
        try {
            // On retrouve le chemin exact via la ref parent (collectionGroup)
            // Astuce: chaque item n’a pas directement la ref. On la reconstruit avec les infos minimales.
            // Plus simple et sûr: passer par un fetch supplémentaire ? Non. Utilisons la convention du chemin.
            //
            // Path attendu: clubs/{clubUid}/offres/{offerId}/candidatures/{candId}
            const ref = doc(db, "clubs", item.clubUid, "offres", item.offerId, "candidatures", item.id);
            await updateDoc(ref, { status });
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
        }
    };

    const Chip = ({
        label,
        active,
        onPress,
        classActive = "bg-orange-500",
    }: {
        label: string;
        active?: boolean;
        onPress?: () => void;
        classActive?: string;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`px-3 py-1 rounded-2xl border ${
                active ? `${classActive} border-white/10` : "bg-white/10 border-white/15"
            }`}
        >
            <Text className="text-white">{label}</Text>
        </TouchableOpacity>
    );

    const Badge = ({
        text,
        tone = "gray",
    }: {
        text: string;
        tone?: "gray" | "blue" | "red" | "yellow";
    }) => {
        const tones: Record<string, [string, string]> = {
            gray: ["#6b7280", "#374151"],
            blue: ["#3b82f6", "#1d4ed8"],
            red: ["#ef4444", "#b91c1c"],
            yellow: ["#f59e0b", "#d97706"],
        };
        return (
            <LinearGradient
                colors={tones[tone]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 9999,
                    marginRight: 8,
                    marginBottom: 8,
                }}
            >
                <Text className="text-white text-xs">{text}</Text>
            </LinearGradient>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0E0D0D]">
            {/* <StatusBar barStyle="light-content" /> */}

            {/* Header */}
            <LinearGradient
                colors={[brand.blue, brand.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    marginHorizontal: 16,
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                }}
            >
                <View
                    className="absolute -right-10 -top-8 w-28 h-28 rounded-full"
                    style={{ backgroundColor: "rgba(249,115,22,0.16)" }}
                />
                <View
                    className="absolute -left-12 bottom-0 w-24 h-24 rounded-full"
                    style={{ backgroundColor: "rgba(37,99,235,0.16)" }}
                />

                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={22} color={brand.orange} />
                        <Text className="text-white text-2xl font-bold ml-2">Candidatures</Text>
                    </View>
                </View>

                {/* Barre de recherche */}
                <View className="relative mb-3">
                    <Ionicons
                        name="search"
                        size={18}
                        color="#e5e7eb"
                        style={{ position: "absolute", left: 14, top: 14 }}
                    />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Rechercher (offre, email, message)…"
                        placeholderTextColor="#cbd5e1"
                        className="bg-black/30 text-white rounded-2xl pl-10 pr-4 py-3 border border-white/15"
                    />
                </View>

                {/* Filtres statut */}
                <View className="flex-row flex-wrap gap-2">
                    <Chip label="Toutes" active={statusFilter === "all"} onPress={() => setStatusFilter("all")} />
                    <Chip label="En attente" active={statusFilter === "pending"} onPress={() => setStatusFilter("pending")} classActive="bg-yellow-600" />
                    <Chip label="Acceptées" active={statusFilter === "accepted"} onPress={() => setStatusFilter("accepted")} classActive="bg-blue-600" />
                    <Chip label="Refusées" active={statusFilter === "rejected"} onPress={() => setStatusFilter("rejected")} classActive="bg-red-600" />
                </View>
            </LinearGradient>

            {/* Liste */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#F97316" />
                    <Text className="text-gray-400 mt-3">Chargement…</Text>
                </View>
            ) : err ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-red-400 text-center">{err}</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16, paddingTop: 12 }}
                    ListEmptyComponent={
                        <Text className="text-gray-500 text-center mt-10">Aucune candidature</Text>
                    }
                    renderItem={({ item }) => {
                        const st = item.status || "pending";
                        const tone = st === "accepted" ? "blue" : st === "rejected" ? "red" : "yellow";
                        return (
                            <LinearGradient
                                colors={[brand.orange, brand.surface]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ borderRadius: 18, padding: 1.5, marginBottom: 12 }}
                            >
                            <View className="bg-[#0E0D0D] rounded-[16px] p-4">
                                {/* Header ligne */}
                                <View className="flex-row justify-between items-center mb-1">
                                    <Text className="text-white text-lg font-semibold flex-1" numberOfLines={1}>
                                        {item.offerTitle || "Offre"}
                                    </Text>
                                    <Badge text={STATUS_LABEL[st]} tone={tone as any} />
                                </View>

                                {/* Meta */}
                                <View className="mb-2">
                                    {item.applicantUid ? (
                                        <Pressable
                                            onPress={() =>
                                                navigation.navigate("JoueurDetail", {
                                                    uid: item.applicantUid,
                                                })
                                            }
                                            className="flex-row items-center"
                                        >
                                            {playerCache[item.applicantUid]?.avatar ? (
                                                <Image
                                                    source={{
                                                        uri: playerCache[item.applicantUid]?.avatar || "",
                                                    }}
                                                    className="w-9 h-9 rounded-full mr-3"
                                                />
                                            ) : (
                                                <View className="w-9 h-9 rounded-full mr-3 bg-white/10 items-center justify-center">
                                                    <Ionicons name="person" size={18} color="#fff" />
                                                </View>
                                            )}
                                            <Text className="text-gray-200 font-semibold">
                                                {playerCache[item.applicantUid]?.name || "Joueur"}
                                            </Text>
                                        </Pressable>
                                    ) : null}
                                    {/* Date si tu veux l’afficher joliment côté client (sinon brute) */}
                                    {/* {item.createdAt?.toDate && (
                    <Text className="text-gray-500 text-xs">
                      {item.createdAt.toDate().toLocaleString()}
                    </Text>
                  )} */}
                                </View>

                                {/* Message */}
                                {!!item.message && (
                                    <Text className="text-gray-300">{item.message}</Text>
                                )}

                                {/* Actions */}
                                <View className="flex-row gap-2">
                                    {st !== "accepted" && (
                                        <Pressable onPress={() => setStatus(item, "accepted")}>
                                            <LinearGradient
                                                colors={["#3b82f6", "#1d4ed8"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={{ borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 }}
                                            >
                                                <Text className="text-white font-semibold">Accepter</Text>
                                            </LinearGradient>
                                        </Pressable>
                                    )}
                                    {st !== "rejected" && (
                                        <Pressable onPress={() => setStatus(item, "rejected")}>
                                            <LinearGradient
                                                colors={["#ef4444", "#b91c1c"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={{ borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 }}
                                            >
                                                <Text className="text-white font-semibold">Refuser</Text>
                                            </LinearGradient>
                                        </Pressable>
                                    )}
                                    {st !== "pending" && (
                                        <Pressable onPress={() => setStatus(item, "pending")}>
                                            <LinearGradient
                                                colors={["#f59e0b", "#d97706"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={{ borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 }}
                                            >
                                                <Text className="text-white font-semibold">Remettre en attente</Text>
                                            </LinearGradient>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                            </LinearGradient>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}
