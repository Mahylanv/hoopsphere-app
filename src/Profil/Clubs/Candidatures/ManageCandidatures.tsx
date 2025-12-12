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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../config/firebaseConfig";
import {
    collectionGroup,
    onSnapshot,
    orderBy,
    query as fsQuery,
    where,
    updateDoc,
    doc,
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

export default function ManageCandidatures() {
    const uid = auth.currentUser?.uid || null;

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [rows, setRows] = useState<Candidature[]>([]);

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
            className={`px-3 py-1 rounded-2xl ${active ? classActive : "bg-gray-800"}`}
        >
            <Text className="text-white">{label}</Text>
        </TouchableOpacity>
    );

    const Badge = ({ text, tone = "gray" }: { text: string; tone?: "gray" | "green" | "red" | "yellow" }) => {
        const tones: Record<string, string> = {
            gray: "bg-gray-700",
            green: "bg-green-600/80",
            red: "bg-red-600/80",
            yellow: "bg-yellow-600/80",
        };
        return (
            <View className={`${tones[tone]} px-3 py-1 rounded-full mr-2 mb-2`}>
                <Text className="text-white text-xs">{text}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* <StatusBar barStyle="light-content" /> */}

            {/* Header */}
            <View className="px-4 pt-4 pb-2">
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={22} color="#F97316" />
                        <Text className="text-white text-2xl font-bold ml-2">Candidatures</Text>
                    </View>
                </View>

                {/* Barre de recherche */}
                <View className="relative mb-3">
                    <Ionicons
                        name="search"
                        size={18}
                        color="#9ca3af"
                        style={{ position: "absolute", left: 14, top: 15 }}
                    />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Rechercher (offre, email, message)…"
                        placeholderTextColor="#9ca3af"
                        className="bg-gray-900 text-white rounded-2xl pl-10 pr-4 py-3 border border-gray-800"
                    />
                </View>

                {/* Filtres statut */}
                <View className="flex-row gap-2 mb-2">
                    <Chip label="Toutes" active={statusFilter === "all"} onPress={() => setStatusFilter("all")} />
                    <Chip label="En attente" active={statusFilter === "pending"} onPress={() => setStatusFilter("pending")} classActive="bg-yellow-600" />
                    <Chip label="Acceptées" active={statusFilter === "accepted"} onPress={() => setStatusFilter("accepted")} classActive="bg-green-600" />
                    <Chip label="Refusées" active={statusFilter === "rejected"} onPress={() => setStatusFilter("rejected")} classActive="bg-red-600" />
                </View>
            </View>

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
                    contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
                    ListEmptyComponent={
                        <Text className="text-gray-500 text-center mt-10">Aucune candidature</Text>
                    }
                    renderItem={({ item }) => {
                        const st = item.status || "pending";
                        const tone = st === "accepted" ? "green" : st === "rejected" ? "red" : "yellow";
                        return (
                            <View className="bg-[#1a1b1f] rounded-2xl p-4 mb-3 border border-gray-800">
                                {/* Header ligne */}
                                <View className="flex-row justify-between items-center mb-1">
                                    <Text className="text-white text-lg font-semibold flex-1" numberOfLines={1}>
                                        {item.offerTitle || "Offre"}
                                    </Text>
                                    <Badge text={STATUS_LABEL[st]} tone={tone as any} />
                                </View>

                                {/* Meta */}
                                <View className="mb-2">
                                    {!!item.applicantEmail && (
                                        <Text className="text-gray-300 mb-1">
                                            👤 {item.applicantEmail}
                                        </Text>
                                    )}
                                    {/* Date si tu veux l’afficher joliment côté client (sinon brute) */}
                                    {/* {item.createdAt?.toDate && (
                    <Text className="text-gray-500 text-xs">
                      {item.createdAt.toDate().toLocaleString()}
                    </Text>
                  )} */}
                                </View>

                                {/* Message */}
                                {!!item.message && (
                                    <Text className="text-gray-300 mb-3">{item.message}</Text>
                                )}

                                {/* Actions */}
                                <View className="flex-row gap-2">
                                    {st !== "accepted" && (
                                        <Pressable
                                            onPress={() => setStatus(item, "accepted")}
                                            className="px-3 py-2 rounded-xl bg-green-600"
                                        >
                                            <Text className="text-white font-semibold">Accepter</Text>
                                        </Pressable>
                                    )}
                                    {st !== "rejected" && (
                                        <Pressable
                                            onPress={() => setStatus(item, "rejected")}
                                            className="px-3 py-2 rounded-xl bg-red-600"
                                        >
                                            <Text className="text-white font-semibold">Refuser</Text>
                                        </Pressable>
                                    )}
                                    {st !== "pending" && (
                                        <Pressable
                                            onPress={() => setStatus(item, "pending")}
                                            className="px-3 py-2 rounded-xl bg-gray-600"
                                        >
                                            <Text className="text-white font-semibold">Remettre en attente</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}
