// src/Pages/Match.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";

type PlayerStats = {
  jersey?: number | null;
  name: string;
  starter?: boolean | null;        // Top 5 de départ
  play_time?: string | null;       // Temps de jeu (MM:SS)
  shots_made?: number | null;      // Nb tirs réussis (total)
  points?: number | null;          // Pts
  threes?: number | null;          // 3 pts réussis
  two_int?: number | null;         // 2 int réussis
  two_ext?: number | null;         // 2 ext réussis
  ft_made?: number | null;         // LF réussis
  fouls_committed?: number | null; // Fautes commises
};

type ApiResponse = {
  match?: { number?: string | null };
  teams?: Array<{ name: string; players: PlayerStats[] }>;
};

// ⚠️ Mets l'URL de ton API ici
// const API_URL = "http://127.0.0.1:8000/parse-emarque"; // iOS Simu
const API_URL = "https://98e95e4e9f1a.ngrok-free.app/parse-emarque";
// Android émulateur : "http://10.0.2.2:8000/parse-emarque"
// Appareil physique : "http://ADRESSE_IP_LAN:8000/parse-emarque"

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
  const [fullName, setFullName] = useState("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [matchNumber, setMatchNumber] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (!fullName.trim()) {
      Alert.alert("Nom requis", "Entre ton Nom Prénom tel qu’inscrit sur la feuille.");
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
      form.append(
        "file",
        {
          name: pdfName || "feuille.pdf",
          type: "application/pdf",
          uri: pdfUri,
        } as any
      );

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
          "Ton nom n’a pas été trouvé. Essaie sans accents ou inverse Nom/Prénom."
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
      // Doc unique par numéro de match pour ce joueur
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
        { merge: true } // remplace si déjà existant (même numéro)
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

        <Text style={{ color: "#aaa", marginBottom: 6 }}>Nom Prénom (comme sur la feuille)</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ex: Louis Dubruel"
          placeholderTextColor="#888"
          style={{
            color: "#fff",
            borderColor: "#555",
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}
          autoCapitalize="words"
        />

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
          disabled={loading || !pdfUri || !fullName.trim()}
          style={{
            backgroundColor: !pdfUri || !fullName.trim() ? "#444" : "#16a34a",
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
