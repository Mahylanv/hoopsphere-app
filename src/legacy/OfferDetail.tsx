import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StatusBar,
    Pressable,
    Alert,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Image,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as MailComposer from "expo-mail-composer";
import { LinearGradient } from "expo-linear-gradient";

import { RootStackParamList, Offer as OfferType } from "../types";
import { auth, db } from "../config/firebaseConfig";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";

type RouteProps = RouteProp<RootStackParamList, "OfferDetail">;
type NavProps = NativeStackNavigationProp<RootStackParamList, "OfferDetail">;

type LocalOffer = OfferType & { id?: string; clubUid?: string };

function displayDepartment(dep: unknown): string {
    if (typeof dep === "string") {
        const parts = dep.split(" - ");
        return (parts[1] || parts[0]).trim();
    }
    if (typeof dep === "number") return String(dep);
    if (Array.isArray(dep)) {
        return dep
            .map((d) =>
                typeof d === "string" ? (d.split(" - ")[1] || d) : String(d ?? "")
            )
            .filter(Boolean)
            .join(", ");
    }
    if (dep && typeof dep === "object") {
        const anyDep = dep as any;
        return anyDep.name || anyDep.label || anyDep.code || "";
    }
    return "";
}

export default function OfferDetail() {
    const navigation = useNavigation<NavProps>();
    const { params } = useRoute<RouteProps>();
    const offer = params.offer as LocalOffer;

    const [sending, setSending] = useState(false);
    const [motivation, setMotivation] = useState("");

    // --- Infos club (logo, nom, ville, email, etc.)
    const [clubLoading, setClubLoading] = useState(true);
    const [club, setClub] = useState<null | {
        uid: string;
        name?: string;
        nom?: string;
        logo?: string;
        city?: string;
        ville?: string;
        department?: unknown;
        email?: string;
    }>(null);

    const isLogged = !!auth.currentUser;
    const isClubOwner =
        !!auth.currentUser?.uid && !!offer.clubUid && auth.currentUser!.uid === offer.clubUid;

    const clubName = useMemo(() => club?.nom || club?.name || "Club", [club]);
    const clubCity = useMemo(() => club?.ville || club?.city || "", [club]);
    const clubDept = useMemo(() => displayDepartment(club?.department), [club]);
    const offerBadges = useMemo(() => {
        const list = [
            offer.position,
            offer.team,
            offer.category,
            offer.gender,
            offer.ageRange,
        ].filter(Boolean) as string[];
        return Array.from(new Set(list));
    }, [offer.position, offer.team, offer.category, offer.gender, offer.ageRange]);

    // Chargement du club
    useEffect(() => {
        let mounted = true;
        const run = async () => {
            if (!offer.clubUid) {
                setClubLoading(false);
                return;
            }
            try {
                const snap = await getDoc(doc(db, "clubs", offer.clubUid));
                if (mounted) {
                    if (snap.exists()) {
                        setClub({ uid: snap.id, ...(snap.data() as any) });
                    }
                    setClubLoading(false);
                }
            } catch (e) {
                console.error("OfferDetail: load club failed", e);
                if (mounted) setClubLoading(false);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [offer.clubUid]);

    type MailStatus = "sent" | "cancelled" | "saved" | "unavailable" | "opened-external" | "error";

    const composeEmailToClub = async (
        clubEmail: string,
        subject: string,
        body: string
    ): Promise<MailStatus> => {
        try {
            const available = await MailComposer.isAvailableAsync();
            if (available) {
                const result = await MailComposer.composeAsync({
                    recipients: [clubEmail],
                    subject,
                    body,
                });
                if (result.status === "sent") return "sent";
                if (result.status === "saved") return "saved";
                return "cancelled";
            } else {
                // Fallback mailto: on ne peut PAS savoir s’il a été envoyé ensuite
                const url = `mailto:${encodeURIComponent(clubEmail)}?subject=${encodeURIComponent(
                    subject
                )}&body=${encodeURIComponent(body)}`;
                await Linking.openURL(url);
                return "opened-external";
            }
        } catch (e) {
            console.error("composeEmailToClub failed", e);
            return "error";
        }
    };



    const handleApply = async () => {
        if (!isLogged) {
            Alert.alert("Connexion requise", "Connecte-toi pour postuler.", [
                { text: "OK", onPress: () => navigation.navigate("Connexion") },
            ]);
            return;
        }
        if (!offer.id || !offer.clubUid) {
            Alert.alert("Erreur", "Informations d’offre incomplètes.");
            return;
        }

        try {
            setSending(true);

            // 1) Tenter l’email d’abord
            const to = club?.email?.trim();
            if (!to) {
                Alert.alert("Impossible d’envoyer l’email", "Ce club n’a pas d’adresse e-mail renseignée.");
                return;
            }

            const subject = `Candidature – ${offer.title || "Offre"} – ${auth.currentUser?.email ?? "Joueur"}`;
            const body = [
                `Bonjour ${clubName},`,
                "",
                `Je souhaite postuler à l’offre : ${offer.title || "Sans titre"}.`,
                offer.location ? `Localisation : ${offer.location}` : "",
                "",
                "Message :",
                motivation || "(aucun message renseigné)",
                "",
                "Cordialement,",
                auth.currentUser?.email ?? "",
            ]
                .filter(Boolean)
                .join("\n");

            const emailStatus = await composeEmailToClub(to, subject, body);

            // 2) Si ET SEULEMENT SI l’email a été envoyé, on enregistre la candidature côté club
            if (emailStatus === "sent") {
                await addDoc(
                    collection(db, "clubs", offer.clubUid, "offres", offer.id, "candidatures"),
                    {
                        applicantUid: auth.currentUser?.uid,
                        applicantEmail: auth.currentUser?.email || null,
                        message: motivation || "",
                        createdAt: serverTimestamp(),
                        status: "pending",
                        clubUid: offer.clubUid,
                        offerId: offer.id,
                        offerTitle: offer.title || "",
                        offerLocation: offer.location || "",
                    }
                );
                Alert.alert("Candidature envoyée ✅", "Ton email a bien été envoyé au club.");
                navigation.goBack();
                return;
            }

            if (emailStatus === "saved") {
                Alert.alert("Brouillon enregistré", "Ton brouillon d’email est prêt. Envoie-le pour finaliser la candidature.");
            } else if (emailStatus === "cancelled") {
                Alert.alert("Envoi annulé", "L’email n’a pas été envoyé. Aucune candidature n’a été enregistrée.");
            } else if (emailStatus === "opened-external") {
                Alert.alert(
                    "Vérifie ton envoi",
                    "Ton application mail s’est ouverte. La candidature ne sera enregistrée côté club que si tu envoies l’email."
                );
            } else if (emailStatus === "unavailable") {
                Alert.alert(
                    "Email indisponible",
                    "L’envoi d’email n’est pas disponible sur cet appareil. Aucune candidature n’a été enregistrée."
                );
            } else {
                Alert.alert("Erreur", "Une erreur est survenue lors de l’ouverture de l’email. Aucune candidature n’a été enregistrée.");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur", "Impossible d’initier la candidature.");
        } finally {
            setSending(false);
        }
    };


    const goToClub = () => {
        if (!club) return;
        navigation.navigate("ProfilClub", {
            club: {
                id: club.uid as any,
                name: clubName,
                logo: club.logo || "",
                city: clubCity,
                teams: 0,
                categories: [],
                uid: club.uid as any,
                department: displayDepartment(club.department) as any,
                email: club.email || "",
            } as any,
        });
    };

    const Badge = ({ label }: { label?: string }) =>
        label ? (
            <View className="bg-[#0b0f19] border border-gray-700 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-gray-200 text-xs font-semibold">{label}</Text>
            </View>
        ) : null;

    const MetaPill = ({
        icon,
        label,
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        label?: string;
    }) =>
        label ? (
            <View className="flex-row items-center bg-black/30 border border-gray-800 px-3 py-1 rounded-full mr-2 mb-2">
                <Ionicons name={icon} size={14} color="#F97316" />
                <Text className="text-gray-200 text-xs ml-1">{label}</Text>
            </View>
        ) : null;

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
                <Pressable onPress={() => navigation.goBack()} className="p-2 mr-2">
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>
                    {offer.title || "Détail de l’offre"}
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* Bandeau club */}
                <LinearGradient
                    colors={["#2563EB", "#0E0D0D"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 1.5, marginBottom: 16 }}
                >
                    <View className="bg-[#121826] rounded-[16px] p-4 overflow-hidden">
                        <View
                            className="absolute -right-10 -top-8 w-24 h-24 rounded-full"
                            style={{ backgroundColor: "rgba(37,99,235,0.15)" }}
                        />
                        <View
                            className="absolute -left-12 bottom-0 w-24 h-24 rounded-full"
                            style={{ backgroundColor: "rgba(249,115,22,0.1)" }}
                        />

                        <Text className="text-gray-400 text-xs mb-3">Offre publiée par</Text>

                        {clubLoading ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator color="#F97316" />
                                <Text className="text-gray-400 ml-2">Chargement du club…</Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center">
                                <Image
                                    source={{ uri: club?.logo || "https://via.placeholder.com/80x80.png?text=Club" }}
                                    className="w-12 h-12 rounded-full mr-3 border border-gray-700"
                                />
                                <View className="flex-1">
                                    <Text className="text-white font-semibold">{clubName}</Text>
                                    <Text className="text-gray-400 text-xs">
                                        {clubCity || clubDept ? `${clubCity}${clubDept ? " • " + clubDept : ""}` : "—"}
                                    </Text>
                                    {!!club?.email && (
                                        <Text className="text-gray-500 text-xs mt-1">{club.email}</Text>
                                    )}
                                </View>

                                {club && (
                                    <Pressable onPress={goToClub} className="px-3 py-2 bg-orange-600 rounded-xl">
                                        <Text className="text-white text-sm font-semibold">Voir le club</Text>
                                    </Pressable>
                                )}
                            </View>
                        )}
                    </View>
                </LinearGradient>

                {/* Carte détails offre */}
                <LinearGradient
                    colors={["#F97316", "#0E0D0D"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 20, padding: 1.5 }}
                >
                    <View className="bg-[#111827] rounded-[18px] p-5 overflow-hidden">
                        <View
                            className="absolute -right-10 -top-8 w-28 h-28 rounded-full"
                            style={{ backgroundColor: "rgba(249,115,22,0.14)" }}
                        />
                        <View
                            className="absolute -left-12 bottom-0 w-24 h-24 rounded-full"
                            style={{ backgroundColor: "rgba(37,99,235,0.12)" }}
                        />

                        {/* Titre + badge */}
                        <View className="flex-row items-start justify-between mb-3">
                            <Text className="text-white text-xl font-bold flex-1 pr-3">
                                {offer.title || "Offre sans titre"}
                            </Text>
                            <View className="bg-orange-600/20 border border-orange-500/30 px-2 py-1 rounded-full">
                                <Text className="text-orange-300 text-xs font-semibold">Recrutement</Text>
                            </View>
                        </View>

                        {!!offerBadges.length && (
                            <View className="flex-row flex-wrap mb-2">
                                {offerBadges.map((tag) => (
                                    <Badge key={tag} label={tag} />
                                ))}
                            </View>
                        )}

                        <View className="flex-row flex-wrap mb-4">
                            <MetaPill icon="location-outline" label={offer.location} />
                            {offer.publishedAt ? (
                                <MetaPill icon="calendar-outline" label={`Publiée le ${offer.publishedAt}`} />
                            ) : null}
                        </View>

                        {/* Description */}
                        {!!offer.description && (
                            <View className="bg-[#0b0f19] border border-gray-800 rounded-xl p-4 mb-5">
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name="document-text-outline" size={18} color="#fff" />
                                    <Text className="text-white font-semibold ml-2">Description</Text>
                                </View>
                                <Text className="text-gray-200 leading-6">{offer.description}</Text>
                            </View>
                        )}

                        {/* Récap compact */}
                        <View className="bg-[#0b0f19] border border-gray-700 rounded-xl p-3 mb-6">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="information-circle-outline" size={18} color="#fff" />
                                <Text className="text-white font-semibold ml-2">Détails de l’offre</Text>
                            </View>
                            {/* <Row icon="basketball-outline" label="Poste recherché" value={offer.position || "—"} /> */}
                            <Row icon="people-outline" label="Équipe / Niveau" value={offer.team || offer.category || "—"} />
                            <Row icon="male-female-outline" label="Genre" value={offer.gender || "—"} />
                            <Row icon="calendar-outline" label="Tranche d’âge" value={offer.ageRange || "—"} />
                            <Row icon="trophy-outline" label="Championnat" value={offer.category || "—"} />
                            <Row icon="location-outline" label="Localisation" value={offer.location || "—"} />
                        </View>

                        {/* Formulaire candidature — visible uniquement si pas le club */}
                        {!isClubOwner && (
                            <View className="mt-2">
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name="mail-outline" size={18} color="#fff" />
                                    <Text className="text-white font-semibold ml-2">Message (optionnel)</Text>
                                </View>
                                <TextInput
                                    placeholder="Quelques mots de motivation, ton profil, tes dispos…"
                                    placeholderTextColor="#6b7280"
                                    value={motivation}
                                    onChangeText={setMotivation}
                                    className="bg-[#0b0f19] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 min-h-[110px] mb-4"
                                    multiline
                                />

                                <Pressable
                                    onPress={handleApply}
                                    disabled={sending}
                                    className={`py-4 rounded-xl items-center flex-row justify-center ${sending ? "bg-gray-600" : "bg-orange-600"
                                        }`}
                                >
                                    {sending ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                            <Text className="text-white font-semibold">Postuler</Text>
                                        </>
                                    )}
                                </Pressable>
                            </View>
                        )}

                        {/* Info club propriétaire */}
                        {isClubOwner && (
                            <View className="bg-[#0b0f19] border border-gray-800 rounded-xl p-3">
                                <Text className="text-gray-400 italic">
                                    Vous êtes le club propriétaire de cette offre.
                                </Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </ScrollView>
        </SafeAreaView>
    );
}

function Row({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: keyof typeof Ionicons.glyphMap;
}) {
    return (
        <View className="flex-row justify-between items-center py-2">
            <View className="flex-row items-center flex-1">
                {icon && (
                    <View className="w-7 h-7 rounded-full bg-gray-800 items-center justify-center mr-2">
                        <Ionicons name={icon} size={14} color="#F97316" />
                    </View>
                )}
                <Text className="text-gray-400">{label}</Text>
            </View>
            <Text className="text-gray-200 font-medium ml-4">{value}</Text>
        </View>
    );
}
