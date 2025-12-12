import { auth, db } from "../config/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type MatchStats = Partial<{
    points: number; rebounds: number; assists: number; steals: number;
    blocks: number; fouls: number; turnovers: number; minutes: number;
    opponent: string;
    matchDate: Date; // si tu veux fixer une date précise
}>;

export async function saveMatchStats(matchNumber: string, stats: MatchStats) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not logged in");

    const toNum = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    };

    await setDoc(
        doc(db, "joueurs", uid, "matches", String(matchNumber)),
        {
            matchNumber: String(matchNumber),
            playerUid: uid,
            // si tu fournis stats.matchDate => prends-le, sinon serverTimestamp()
            matchDate: stats.matchDate ? (stats.matchDate as any) : serverTimestamp(),
            points: toNum(stats.points),
            rebounds: toNum(stats.rebounds),
            assists: toNum(stats.assists),
            steals: toNum(stats.steals),
            blocks: toNum(stats.blocks),
            fouls: toNum(stats.fouls),
            turnovers: toNum(stats.turnovers),
            minutes: toNum(stats.minutes),
            opponent: stats.opponent ?? null,
        },
        { merge: true }
    );
}
