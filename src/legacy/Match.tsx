// src/Pages/Match.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  DeviceEventEmitter,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamListJoueur } from "../types";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseMinutesFromPlayTime(s?: string | null): number | null {
  // play_time au format "MM:SS" (ex: "23:17")
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{1,3}):(\d{2})$/);
  if (!m) return null;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(sec)) return null;
  return min + sec / 60;
}

type PlayerStats = {
  jersey?: number | null;
  name: string;
  starter?: boolean | null;
  play_time?: string | null;
  shots_made?: number | null;
  points?: number | null;
  threes?: number | null;
  two_int?: number | null;
  two_ext?: number | null;
  ft_made?: number | null;
  fouls_committed?: number | null;
};

type ApiResponse = {
  match?: { number?: string | null };
  teams?: Array<{ name: string; players: PlayerStats[] }>;
};

const rawApiUrl = (process.env.EXPO_PUBLIC_EMARQUE_URL || "http://localhost:8000/parse-emarque").trim();
const API_URL = rawApiUrl.endsWith("/parse-emarque")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, "")}/parse-emarque`;

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isSamePlayer(pdfName: string, userFullname: string) {
  const a = normalize(pdfName);
  const b = normalize(userFullname);
  const A = new Set(a.split(" ").filter(Boolean));
  const B = new Set(b.split(" ").filter(Boolean));
  const small = A.size <= B.size ? A : B;
  const big = A.size <= B.size ? B : A;
  for (const t of small) if (!big.has(t)) return false;
  return true;
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ color: "#cbd5e1", fontSize: 14 }}>{label}</Text>
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{String(value ?? "-")}</Text>
    </View>
  );
}

export default function Match() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamListJoueur, "Match">>();

  const [profileLoading, setProfileLoading] = useState(true);
  const [fullName, setFullName] = useState<string>("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [matchNumber, setMatchNumber] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Récupère Prenom/Nom depuis joueurs/{uid}, en gérant les 2 casings
  useEffect(() => {
    const run = async () => {
      const user = auth.currentUser;
      if (!user?.uid) {
        setProfileLoading(false);
        Alert.alert("Connexion requise", "Tu dois être connecté pour utiliser l’import e-Marque.");
        return;
      }
      try {
        const ref = doc(db, "joueurs", user.uid);
        const snap = await getDoc(ref);

        let computed = "";
        if (snap.exists()) {
          const d = snap.data() as any;
          const prenom = (d?.prenom ?? d?.Prenom ?? "").toString().trim();
          const nom = (d?.nom ?? d?.Nom ?? "").toString().trim();
          if (prenom || nom) {
            computed = [prenom, nom].filter(Boolean).join(" ");
          }
        }

        if (!computed && user.displayName) {
          computed = user.displayName.trim();
        }

        setFullName(computed);
      } catch (e) {
        console.error(e);
      } finally {
        setProfileLoading(false);
      }
    };
    run();
  }, []);

  const canParse = useMemo(
    () => !!pdfUri && !!fullName?.trim() && !profileLoading,
    [pdfUri, fullName, profileLoading]
  );

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res?.assets && res.assets.length > 0) {
      const f = res.assets[0];
      setPdfName(f.name || "feuille.pdf");
      setPdfUri(f.uri);
    }
  };

  const handleParse = async () => {
    if (profileLoading) return;
    if (!fullName.trim()) {
      Alert.alert("Nom introuvable", "Impossible de déterminer ton Nom Prénom depuis le profil (champs prenom/nom).");
      return;
    }
    if (!pdfUri) {
      Alert.alert("PDF requis", "Sélectionne le PDF e-Marque V2.");
      return;
    }
    try {
      setLoading(true);
      setStats(null);
      setMatchNumber(null);

      const form = new FormData();
      form.append("fullname", fullName);
      form.append("file", { name: pdfName || "feuille.pdf", type: "application/pdf", uri: pdfUri } as any);

      const resp = await fetch(API_URL, { method: "POST", body: form });
      const json = (await resp.json()) as any;
      if (!resp.ok || json?.ok === false) {
        const errMsg =
          json?.error ||
          "Le PDF n’a pas été reconnu comme une feuille e‑Marque V2. Vérifie que tu utilises bien le PDF officiel exporté depuis e‑Marque.";
        throw new Error(errMsg);
      }
      const parsed = json as ApiResponse;

      setMatchNumber(parsed?.match?.number ?? null);

      let found: PlayerStats | null = null;
      for (const team of parsed.teams || []) {
        for (const p of team.players) {
          if (p?.name && isSamePlayer(p.name, fullName)) {
            found = p; break;
          }
        }
        if (found) break;
      }
      if (!found) {
        Alert.alert("Introuvable", "Ton nom n’a pas été trouvé dans la feuille. Mets à jour ton profil (prenom / nom) si besoin.");
        return;
      }
      setStats(found);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Erreur parsing", e?.message || "Impossible de lire le PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!stats) return Alert.alert("Aucune stats", "Analyse d’abord un PDF pour récupérer tes stats.");
    if (!matchNumber) return Alert.alert("Numéro de match manquant", "Le numéro de rencontre n’a pas été détecté.");
    const user = auth.currentUser;
    if (!user?.uid) return Alert.alert("Connexion requise", "Tu dois être connecté pour enregistrer tes stats.");

    try {
      setSaving(true);

      // Normalisations
      const normalized = {
        // Clés attendues par le graphique
        points: toNum(stats.points),
        fouls: toNum(stats.fouls_committed),           // <-- mapping: fouls_committed -> fouls
        minutes: parseMinutesFromPlayTime(stats.play_time),

        // (Optionnel) si un jour tu ajoutes ces champs dans le parser
        rebounds: null as number | null,
        assists: null as number | null,
        steals: null as number | null,
        blocks: null as number | null,
        turnovers: null as number | null,
      };

      const ref = doc(db, "joueurs", user.uid, "matches", String(matchNumber));
      await setDoc(
        ref,
        {
          // Méta obligatoires pour tes règles
          matchNumber: String(matchNumber),
          playerUid: user.uid,
          playerFullname: fullName.trim(),

          // Date du match (à défaut d’info dans le PDF, on timestamp)
          matchDate: serverTimestamp(),

          // Champs normalisés pour le graphique
          ...normalized,

          // Tes champs d’origine — conservés (utile pour l’écran détail)
          jersey: stats.jersey ?? null,
          starter: stats.starter ?? null,
          play_time: stats.play_time ?? null,
          shots_made: toNum(stats.shots_made),
          threes: toNum(stats.threes),
          two_int: toNum(stats.two_int),
          two_ext: toNum(stats.two_ext),
          ft_made: toNum(stats.ft_made),
          fouls_committed: toNum(stats.fouls_committed),

          // Trace
          sourcePdfName: pdfName ?? null,
          parsedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Rafraîchir le profil/graphique
      DeviceEventEmitter.emit("force-profile-reload");
      navigation.navigate("Profil");

      Alert.alert("Enregistré", "Tes stats ont été sauvegardées pour ce match.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Erreur", e?.message || "Impossible d’enregistrer les stats.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0E0D0D" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#2563EB", "#0E0D0D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            marginBottom: 18,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
            Import e‑Marque V2
          </Text>
          <Text style={{ color: "#e5e7eb", marginTop: 6 }}>
            Ajoute tes stats officielles depuis le PDF e‑Marque. Le nom doit correspondre à ton profil.
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <Ionicons name="document-text-outline" size={18} color="#f97316" />
            <Text style={{ color: "#f97316", marginLeft: 6, fontWeight: "700" }}>
              PDF officiel uniquement (e‑Marque V2)
            </Text>
          </View>
        </LinearGradient>

        <View
          style={{
            backgroundColor: "#111827",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: "#1f2937",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#9ca3af", marginBottom: 4 }}>Joueur</Text>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {profileLoading ? "Chargement..." : fullName || "—"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={pickPdf}
            style={{
              flex: 1,
              backgroundColor: "#2563eb",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {pdfName ? "Changer de PDF" : "Sélectionner le PDF"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleParse}
            disabled={loading || !canParse}
            style={{
              backgroundColor: !canParse ? "#374151" : "#f97316",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              minWidth: 120,
              justifyContent: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>Analyser</Text>
            )}
          </TouchableOpacity>
        </View>
        {pdfName ? <Text style={{ color: "#9ca3af", marginBottom: 12 }}>{pdfName}</Text> : null}

        {matchNumber ? (
          <View
            style={{
              marginTop: 4,
              padding: 14,
              borderRadius: 16,
              backgroundColor: "#0b111d",
              borderWidth: 1,
              borderColor: "rgba(37,99,235,0.3)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="trophy-outline" size={18} color="#f97316" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>
                Informations rencontre
              </Text>
            </View>
            <Row label="N° de rencontre" value={matchNumber} />
          </View>
        ) : null}

        {stats && (
          <View
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 16,
              backgroundColor: "#111827",
              borderWidth: 1,
              borderColor: "#1f2937",
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons name="stats-chart-outline" size={18} color="#22d3ee" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>
                Tes stats détectées
              </Text>
            </View>

            <Row label="Top 5 départ" value={stats.starter ? "Oui" : "Non"} />
            <Row label="Temps de jeu" value={stats.play_time || "-"} />
            <Row label="Tirs réussis (total)" value={stats.shots_made} />
            <Row label="Points" value={stats.points} />
            <Row label="3 pts réussis" value={stats.threes} />
            <Row label="2 int réussis" value={stats.two_int} />
            <Row label="2 ext réussis" value={stats.two_ext} />
            <Row label="LF réussis" value={stats.ft_made} />
            <Row label="Fautes commises" value={stats.fouls_committed} />

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !matchNumber}
              style={{
                marginTop: 12,
                backgroundColor: matchNumber ? "#f97316" : "#374151",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>Valider</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
