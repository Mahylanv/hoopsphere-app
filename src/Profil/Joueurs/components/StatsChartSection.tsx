import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../../config/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import {
    VictoryChart,
    VictoryLine,
    VictoryScatter,
    VictoryAxis,
    VictoryTheme,
    VictoryTooltip,
} from "victory-native";

type MatchRow = {
    id: string;
    matchNumber?: string;
    matchDate?: any; 
    points?: number;
    shots_made?: number;
    ft_made?: number;
    fouls_committed?: number;
    threes?: number;
    two_int?: number;
    two_ext?: number;
    [k: string]: any;
};

const METRICS = [
    { key: "points", label: "Points" },
    { key: "shots_made", label: "Tirs réussis" },
    { key: "ft_made", label: "Lancers francs" },
    { key: "fouls_committed", label: "Fautes commises" },
    { key: "threes", label: "3 pts réussis" },
    { key: "two_int", label: "2 pts int." },
    { key: "two_ext", label: "2 pts ext." },
] as const;

type Metric = typeof METRICS[number];      
type MetricKey = Metric["key"];           

export default function StatsChartSection({
    playerUid,
    title = "Courbes de stats",
}: {
    playerUid?: string;
    title?: string;
}) {
    const uid = playerUid || auth.currentUser?.uid || null;

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<MatchRow[]>([]);
    const [metric, setMetric] = useState<MetricKey>("points");

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const ref = collection(db, "joueurs", uid, "matches");
        const unsub = onSnapshot(
            ref,
            (snap) => {
                const list: MatchRow[] = [];
                snap.forEach((d) => {
                    const x = d.data() as any;
                    list.push({
                        id: d.id,
                        matchNumber: x?.matchNumber,
                        matchDate: x?.matchDate,
                        points: toNum(x?.points),
                        shots_made: toNum(x?.shots_made),
                        ft_made: toNum(x?.ft_made),
                        fouls_committed: toNum(x?.fouls_committed),
                        threes: toNum(x?.threes),
                        two_int: toNum(x?.two_int),
                        two_ext: toNum(x?.two_ext),
                        ...x,
                    });
                });

                list.sort((a, b) => {
                    const ad = a.matchDate?.toMillis?.() ?? 0;
                    const bd = b.matchDate?.toMillis?.() ?? 0;
                    return ad - bd;
                });

                setRows(list);
                setLoading(false);
            },
            (e) => {
                console.error("StatsChartSection: load matches failed", e);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [uid]);

    const POINTS_DEF: Metric = METRICS[0];

    const availableMetrics = useMemo<readonly Metric[]>(() => {
        const ok = METRICS.filter(({ key }) =>
            rows.some((r) => isFiniteNumber((r as any)[key]))
        );
        return ok.length ? ok : [POINTS_DEF];
    }, [rows]);



    useEffect(() => {
        if (!availableMetrics.find((m) => m.key === metric)) {
            setMetric(availableMetrics[0]?.key ?? "points");
        }
    }, [availableMetrics, metric]);

    const chartData = useMemo(
        () =>
            rows.map((r, idx) => ({
                x: idx + 1, // 1..N
                y: isFiniteNumber((r as any)[metric]) ? Number((r as any)[metric]) : 0,
                label: makePointLabel(r, metric, idx),
            })),
        [rows, metric]
    );

    const { yDomain, yTicks } = useMemo(() => {
        const ys = chartData.map((p) => p.y);
        const max = Math.max(0, ...ys);

        // 👉 marge auto plus large : +1 si petit, sinon +15%
        const targetMax = addHeadroom(max, 0.15);

        const step = niceStep(targetMax);
        const top = ceilToStep(targetMax, step);

        const ticks: number[] = [];
        for (let t = 0; t <= top; t += step) ticks.push(t);
        if (ticks[ticks.length - 1] !== top) ticks.push(top);

        return { yDomain: [0, Math.max(1, top)] as [number, number], yTicks: ticks };
    }, [chartData]);

    const xTicks = useMemo(() => rows.map((_, i) => i + 1), [rows]);

    const [containerW, setContainerW] = useState<number>(0);
    const PX_PER_POINT = 28;
    const PAD_LEFT = 24, PAD_RIGHT = 24;
    const chartWidth = useMemo(() => {
        const content = xTicks.length * PX_PER_POINT + PAD_LEFT + PAD_RIGHT;
        return Math.max(containerW || 0, content || 0);
    }, [containerW, xTicks]);
    function addHeadroom(maxVal: number, ratio = 0.15): number {
        if (maxVal <= 0) return 1;      // au moins 0→1
        if (maxVal <= 5) return maxVal + 1; // petits compteurs: +1
        return maxVal * (1 + ratio);    // sinon +15% par défaut
    }

    function niceStep(maxY: number): number {
        if (maxY <= 10) return 2;
        if (maxY <= 20) return 2;
        if (maxY <= 50) return 5;
        if (maxY <= 100) return 10;
        return 20;
    }

    function ceilToStep(v: number, step: number): number {
        return Math.ceil(v / step) * step;
    }


    return (
        <View className="mt-8 px-5">
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                    <Ionicons name="stats-chart-outline" size={20} color="#F97316" />
                    <Text className="text-white text-xl font-bold ml-2">{title}</Text>
                </View>
                {!!rows.length && <Text className="text-gray-400">{rows.length} match(s)</Text>}
            </View>

            {/* Onglets métriques */}
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 4 }}
                data={availableMetrics as any}
                keyExtractor={(m: any) => m.key}
                renderItem={({ item }: any) => {
                    const active = item.key === metric;
                    return (
                        <TouchableOpacity
                            onPress={() => setMetric(item.key)}
                            className={`px-3 py-1 rounded-2xl mr-2 ${active ? "bg-orange-500" : "bg-gray-800"}`}
                        >
                            <Text className="text-white">{item.label}</Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Graphique */}
            <View
                className="bg-[#141821] rounded-2xl mt-4 p-10 border border-gray-800"
                onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
            >
                {loading ? (
                    <View className="items-center justify-center" style={{ height: 200 }}>
                        <ActivityIndicator color="#F97316" />
                        <Text className="text-gray-400 mt-2">Chargement des stats…</Text>
                    </View>
                ) : !rows.length ? (
                    <View className="items-center justify-center" style={{ height: 200 }}>
                        <Text className="text-gray-400">Aucun match enregistré pour l’instant.</Text>
                        <Text className="text-gray-500 mt-1 text-xs">Enregistre une feuille de match.</Text>
                    </View>
                ) : (
                    // 🔁 Scroll horizontal si ça dépasse
                    <View style={{ height: 260 }}>
                        <FlatList
                            horizontal
                            data={[0]} 
                            keyExtractor={() => "chart"}
                            renderItem={() => (
                                <View style={{ width: chartWidth }}>
                                    <VictoryChart
                                        height={260}
                                        width={chartWidth}
                                        padding={{ top: 24, bottom: 50, left: PAD_LEFT, right: PAD_RIGHT }}
                                        theme={VictoryTheme.material}
                                        domain={{ x: [1, Math.max(1, xTicks.length)], y: yDomain }}
                                        domainPadding={{ x: 8, y: 12 }}
                                    >
                                        <VictoryAxis
                                            dependentAxis
                                            tickValues={yTicks}
                                            tickFormat={(t) => String(t)}
                                            style={{
                                                axis: { stroke: "#4B5563" },
                                                tickLabels: { fill: "#D1D5DB", fontSize: 12 },
                                                grid: { stroke: "#374151" },
                                            }}
                                        />
                                        <VictoryAxis
                                            tickValues={xTicks}          
                                            tickFormat={(t) => String(t)} 
                                            style={{
                                                axis: { stroke: "#4B5563" },
                                                tickLabels: { fill: "#9CA3AF", fontSize: 12 },
                                                grid: { stroke: "transparent" },
                                            }}
                                        />
                                        <VictoryLine
                                            data={chartData}
                                            interpolation="monotoneX"
                                            style={{ data: { stroke: "#F97316", strokeWidth: 3 } }}
                                        />
                                        <VictoryScatter
                                            data={chartData}
                                            size={4}
                                            style={{ data: { fill: "#FDBA74" } }}
                                            labels={({ datum }) => datum.label}
                                            labelComponent={
                                                <VictoryTooltip
                                                    flyoutStyle={{ fill: "#111827", stroke: "#F97316" }}
                                                    style={{ fill: "#E5E7EB", fontSize: 12 }}
                                                />
                                            }
                                        />
                                    </VictoryChart>
                                </View>
                            )}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}
            </View>

        </View>
    );
}


function toNum(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}
function isFiniteNumber(v: any) {
    return typeof v === "number" && Number.isFinite(v);
}

function makePointLabel(r: MatchRow, metric: string, idx: number) {
    const value = (r as any)[metric];
    const dateStr = r.matchDate?.toDate?.()
        ? new Date(r.matchDate.toDate()).toLocaleDateString()
        : r.matchNumber
            ? `Match ${r.matchNumber}`
            : `Match ${idx + 1}`;
    const labelMap: Record<string, string> = {
        points: "Points",
        shots_made: "Tirs réussis",
        ft_made: "Lancers francs",
        fouls_committed: "Fautes commises",
        threes: "3 pts réussis",
        two_int: "2 pts int.",
        two_ext: "2 pts ext.",
    };
    return `${dateStr}\n${labelMap[metric] ?? metric}: ${isFiniteNumber(value) ? value : 0}`;
}

function niceCeil(v: number): number {
    if (v <= 0) return 5;
    if (v <= 10) return ceilToStep(v, 2);   
    if (v <= 20) return ceilToStep(v, 2);  
    if (v <= 50) return ceilToStep(v, 5);   
    if (v <= 100) return ceilToStep(v, 10);
    return ceilToStep(v, 20);
}
function niceStep(maxY: number): number {
    if (maxY <= 10) return 2;
    if (maxY <= 20) return 2;
    if (maxY <= 50) return 5;
    if (maxY <= 100) return 10;
    return 20;
}
function ceilToStep(v: number, step: number): number {
    return Math.ceil(v / step) * step;
}
