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

import { RootStackParamList, Offer as OfferType } from "../types";
import { auth, db } from "../config/firebaseConfig";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";

type RouteProps = RouteProp<RootStackParamList, "OfferDetail">;
type NavProps = NativeStackNavigationProp<RootStackParamList, "OfferDetail">;

// On étend localement l'offre pour inclure id/clubUid si absent du type global
type LocalOffer = OfferType & { id?: string; clubUid?: string };

// ------- helpers sûrs pour department -------
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

    const composeEmailToClub = async (clubEmail: string, subject: string, body: string) => {
        try {
            const available = await MailComposer.isAvailableAsync();
            if (available) {
                await MailComposer.composeAsync({
                    recipients: [clubEmail],
                    subject,
                    body,
                });
            } else {
                // Fallback mailto
                const url = `mailto:${encodeURIComponent(clubEmail)}?subject=${encodeURIComponent(
                    subject
                )}&body=${encodeURIComponent(body)}`;
                await Linking.openURL(url);
            }
        } catch (e) {
            console.error("composeEmailToClub failed", e);
            // On ne bloque pas la navigation si l'email échoue à s'ouvrir
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

            // 1) Enregistrer la candidature côté Firestore
            await addDoc(
                collection(db, "clubs", offer.clubUid, "offres", offer.id, "candidatures"),
                {
                    applicantUid: auth.currentUser?.uid,
                    applicantEmail: auth.currentUser?.email || null,
                    message: motivation || "",
                    createdAt: serverTimestamp(),
                    status: "pending",

                    // 👇 champs dérivés pour requêtes & affichage
                    clubUid: offer.clubUid,
                    offerId: offer.id,
                    offerTitle: offer.title || "",
                    offerLocation: offer.location || "",
                }
            );


            // 2) Envoi d'un e-mail depuis le client (depuis le compte du joueur)
            //    On utilise l'appli mail native via expo-mail-composer.
            const to = club?.email;
            if (to) {
                const subject = `Candidature – ${offer.title || "Offre"} – ${auth.currentUser?.email ?? "Joueur"}`;
                const bodyLines = [
                    `Bonjour ${clubName},`,
                    "",
                    `Je souhaite postuler à l’offre : ${offer.title || "Sans titre"}.`,
                    offer.location ? `Localisation : ${offer.location}` : "",
                    "",
                    "Message :",
                    motivation || "(aucun message renseigné)",
                    "",
                    `Cordialement,`,
                    `${auth.currentUser?.email ?? ""}`,
                ].filter(Boolean);
                const body = bodyLines.join("\n");
                await composeEmailToClub(to, subject, body);
            } else {
                // Si pas d'email club, on informe juste l'utilisateur
                Alert.alert(
                    "Candidature envoyée",
                    "Le club n’a pas d’e-mail renseigné. Ta candidature a tout de même été enregistrée."
                );
            }

            Alert.alert("Candidature envoyée ✅", "Le club a bien reçu ta candidature.");
            navigation.goBack();
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur", "Impossible d’envoyer la candidature.");
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
            <View className="bg-gray-700 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-gray-200 text-xs">{label}</Text>
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
                <View className="bg-[#151a28] rounded-2xl p-4 border border-gray-800 mb-4">
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

                {/* Carte détails offre */}
                <View className="bg-[#1b1f2a] rounded-2xl p-5 border border-gray-800">
                    {/* Titre + métadonnées */}
                    <Text className="text-white text-xl font-bold mb-2">
                        {offer.title || "Offre sans titre"}
                    </Text>

                    {/* Métadonnées */}
                    <View className="mb-3">
                        {offer.location ? <Text className="text-gray-300">📍 {offer.location}</Text> : null}
                        {offer.publishedAt ? (
                            <Text className="text-gray-400 text-xs mt-1">Publiée le {offer.publishedAt}</Text>
                        ) : null}
                    </View>

                    {/* Description */}
                    {!!offer.description && (
                        <>
                            <Text className="text-white font-semibold mb-1">Description</Text>
                            <Text className="text-gray-200 leading-6 mb-6">{offer.description}</Text>
                        </>
                    )}

                    {/* Récap compact */}
                    <View className="bg-[#0e1320] border border-gray-700 rounded-xl p-3 mb-6">
                        <Row label="Poste recherché" value={offer.position || "—"} />
                        <Row label="Équipe / Niveau" value={offer.team || offer.category || "—"} />
                        <Row label="Genre" value={offer.gender || "—"} />
                        <Row label="Tranche d’âge" value={offer.ageRange || "—"} />
                        <Row label="Championnat" value={offer.category || "—"} />
                        <Row label="Localisation" value={offer.location || "—"} />
                    </View>

                    {/* Formulaire candidature — visible uniquement si pas le club */}
                    {!isClubOwner && (
                        <View className="mt-2">
                            <Text className="text-white font-semibold mb-2">Message (optionnel)</Text>
                            <TextInput
                                placeholder="Quelques mots de motivation, ton profil, tes dispos…"
                                placeholderTextColor="#6b7280"
                                value={motivation}
                                onChangeText={setMotivation}
                                className="bg-[#0e1320] text-white rounded-2xl px-4 py-3 text-[15px] border border-gray-700 min-h-[110px] mb-4"
                                multiline
                            />

                            <Pressable
                                onPress={handleApply}
                                disabled={sending}
                                className={`py-4 rounded-xl items-center ${sending ? "bg-gray-600" : "bg-orange-600"
                                    }`}
                            >
                                {sending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-semibold">Postuler</Text>
                                )}
                            </Pressable>
                        </View>
                    )}

                    {/* Info club propriétaire */}
                    {isClubOwner && (
                        <Text className="text-gray-400 italic mt-2">
                            Vous êtes le club propriétaire de cette offre.
                        </Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-row justify-between items-center py-1">
            <Text className="text-gray-400">{label}</Text>
            <Text className="text-gray-200 font-medium ml-4">{value}</Text>
        </View>
    );
}
