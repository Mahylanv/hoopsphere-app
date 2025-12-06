// src/Pages/Match.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";

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

const API_URL = "https://b95a86c8b3ef.ngrok-free.app/parse-emarque";

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
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
      <Text style={{ color: "#bbb" }}>{label}</Text>
      <Text style={{ color: "#fff", fontWeight: "700" }}>{String(value ?? "-")}</Text>
    </View>
  );
}

export default function Match() {
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

        // Fallback si le doc ne contient pas encore les champs
        if (!computed && user.displayName) {
          computed = user.displayName.trim();
        }

        setFullName(computed);
        // Debug utile si besoin :
        // console.log("Fullname from Firestore/auth =", computed);
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
      Alert.alert(
        "Nom introuvable",
        "Impossible de déterminer ton Nom Prénom depuis le profil (champs prenom/nom)."
      );
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
      form.append("file", {
        name: pdfName || "feuille.pdf",
        type: "application/pdf",
        uri: pdfUri,
      } as any);

      const resp = await fetch(API_URL, { method: "POST", body: form });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Parser HTTP ${resp.status}: ${t}`);
      }
      const json = (await resp.json()) as ApiResponse;

      setMatchNumber(json?.match?.number ?? null);

      let found: PlayerStats | null = null;
      for (const team of json.teams || []) {
        for (const p of team.players) {
          if (p?.name && isSamePlayer(p.name, fullName)) {
            found = p;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        Alert.alert(
          "Introuvable",
          "Ton nom n’a pas été trouvé dans la feuille. Mets à jour ton profil (prenom / nom) si besoin."
        );
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
    if (!stats) {
      Alert.alert("Aucune stats", "Analyse d’abord un PDF pour récupérer tes stats.");
      return;
    }
    if (!matchNumber) {
      Alert.alert("Numéro de match manquant", "Le numéro de rencontre n’a pas été détecté.");
      return;
    }
    const user = auth.currentUser;
    if (!user?.uid) {
      Alert.alert("Connexion requise", "Tu dois être connecté pour enregistrer tes stats.");
      return;
    }

    try {
      setSaving(true);
      const ref = doc(db, "joueurs", user.uid, "matches", String(matchNumber));
      await setDoc(
        ref,
        {
          matchNumber: String(matchNumber),
          playerUid: user.uid,
          playerFullname: fullName.trim(),
          jersey: stats.jersey ?? null,
          starter: stats.starter ?? null,
          play_time: stats.play_time ?? null,
          shots_made: stats.shots_made ?? null,
          points: stats.points ?? null,
          threes: stats.threes ?? null,
          two_int: stats.two_int ?? null,
          two_ext: stats.two_ext ?? null,
          ft_made: stats.ft_made ?? null,
          fouls_committed: stats.fouls_committed ?? null,
          sourcePdfName: pdfName ?? null,
          parsedAt: serverTimestamp(),
        },
        { merge: true }
      );

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
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
          Créer un match (import e-Marque)
        </Text>

        <View
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#555",
            backgroundColor: "#151515",
          }}
        >
          <Row label="Joueur" value={profileLoading ? "Chargement..." : (fullName || "—")} />
        </View>

        <TouchableOpacity
          onPress={pickPdf}
          style={{
            backgroundColor: "#2563eb",
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {pdfName ? "Changer de PDF" : "Sélectionner le PDF"}
          </Text>
        </TouchableOpacity>
        {pdfName ? <Text style={{ color: "#bbb", marginBottom: 12 }}>{pdfName}</Text> : null}

        <TouchableOpacity
          onPress={handleParse}
          disabled={loading || !canParse}
          style={{
            backgroundColor: !canParse ? "#444" : "#16a34a",
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>Analyser le PDF</Text>
          )}
        </TouchableOpacity>

        {matchNumber ? (
          <View
            style={{
              marginTop: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: "#444",
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 6 }}>
              Informations rencontre
            </Text>
            <Row label="N° de rencontre" value={matchNumber} />
          </View>
        ) : null}

        {stats && (
          <View
            style={{
              marginTop: 20,
              padding: 12,
              borderWidth: 1,
              borderColor: "#444",
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
              Tes stats détectées
            </Text>

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
                backgroundColor: matchNumber ? "#22c55e" : "#444",
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
      </View>
    </SafeAreaView>
  );
}
