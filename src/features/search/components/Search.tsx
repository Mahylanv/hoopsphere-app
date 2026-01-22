// src/Components/Search.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StatusBar,
  Pressable,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../types";
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";

import { db } from "../../../config/firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query as fsQuery,
  collectionGroup,
} from "firebase/firestore";

import ClubFilter, { ClubFiltre } from "./ClubFilters";
import DepartmentSelect from "../../../shared/components/DepartmentSelect";
import { useFavoriteClubs } from "../hooks/useFavoriteClubs";
import FavoriteClubsTab from "../screens/FavoriteClubsTab";
import PremiumWall from "../../../shared/components/PremiumWall";
import { usePremiumStatus } from "../../../shared/hooks/usePremiumStatus";
import PremiumBadge from "../../../shared/components/PremiumBadge";

type SearchNavProp = NativeStackNavigationProp<RootStackParamList, "Search">;
const Tab = createMaterialTopTabNavigator();

type FirestoreClub = {
  id: string;
  uid?: string;
  name: string;
  logo?: string;
  city?: string;
  department?: string;
  teams?: string | number | string[] | Record<string, any>;
  categories?: string[];
  email?: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
  premium?: boolean;
  isPremium?: boolean;
};

const brand = {
  orange: "#F97316",
  orangeLight: "#fb923c",
  blue: "#2563EB",
  surface: "#0E0D0D",
} as const;

// Helpers pour le filtre/label des équipes
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

type PremiumProps = {
  isPremium: boolean;
  onUpgrade: () => void;
};

function hasMixte(teams: FirestoreClub["teams"]): boolean {
  if (!teams && teams !== 0) return false;
  const check = (t: string) =>
    /(^|\W)(mixte|les deux|both)(\W|$)/i.test(normalize(t));
  if (Array.isArray(teams))
    return teams.some((v) => typeof v === "string" && check(v));
  if (typeof teams === "string")
    return teams.split(/[,/|]/).some((p) => check(p));
  if (typeof teams === "object") {
    const t = teams as Record<string, any>;
    return !!(t.mixte || t.both);
  }
  return false;
}

function extractTeamKinds(
  teams: FirestoreClub["teams"]
): Set<"masculines" | "feminines"> {
  const out = new Set<"masculines" | "feminines">();
  const pushFromToken = (t: string) => {
    const n = normalize(t);
    if (/(masculin|masculine|masculins|homme|men|male)/.test(n))
      out.add("masculines");
    if (/(feminin|féminin|feminine|feminines|femme|women|female)/.test(n))
      out.add("feminines");
  };

  if (!teams && teams !== 0) return out;

  if (Array.isArray(teams)) {
    teams.forEach((v) => typeof v === "string" && pushFromToken(v));
  } else if (typeof teams === "string") {
    teams.split(/[,/|]/).forEach((part) => pushFromToken(part));
  } else if (typeof teams === "object") {
    const t = teams as Record<string, any>;
    if (t.masculines || t.male || t.homme) out.add("masculines");
    if (t.feminines || t.female || t.femme) out.add("feminines");
  }
  return out;
}

function teamKindsLabel(item: FirestoreClub): string | null {
  // Affichage : si mixte explicite → "Mixte", sinon Masculines/Féminines/both
  if (hasMixte(item.teams)) return "Mixte";
  const kinds = extractTeamKinds(item.teams);
  const hasM = kinds.has("masculines");
  const hasF = kinds.has("feminines");
  if (hasM && hasF) return "Masculines & Féminines";
  if (hasM) return "Masculines";
  if (hasF) return "Féminines";
  return null;
}

function ClubsTab({ isPremium, onUpgrade }: PremiumProps) {
  const navigation = useNavigation<SearchNavProp>();

  const [search, setSearch] = useState("");
  const [clubs, setClubs] = useState<FirestoreClub[]>([]);
  const [filtered, setFiltered] = useState<FirestoreClub[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filtres (via modal)
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<ClubFiltre>({});
  const { isFavorite, toggleFavorite } = useFavoriteClubs(isPremium);

  // Chargement temps réel des clubs
  useEffect(() => {
    setLoading(true);
    setErr(null);
    const q = fsQuery(collection(db, "clubs"), orderBy("name"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: FirestoreClub[] = [];
        snap.forEach((doc) => {
          const d = doc.data() as any;
          list.push({
            id: doc.id,
            uid: d?.uid,
            name: (d?.name || d?.nom || "").toString(),
            logo: d?.logo || "",
            city: d?.city || d?.ville || "",
            department: d?.department || "",
            teams: d?.teams ?? d?.equipes ?? "",
            categories: Array.isArray(d?.categories)
              ? (d.categories as unknown[]).filter(
                  (x): x is string => typeof x === "string" && x.length > 0
                )
              : [],
            premium: !!(d?.premium ?? d?.isPremium),
            email: d?.email || "",
            description: d?.description || "",
            createdAt: d?.createdAt,
            updatedAt: d?.updatedAt,
          });
        });
        list.sort(
          (a, b) =>
            Number(!!b.premium || !!b.isPremium) -
            Number(!!a.premium || !!a.isPremium)
        );
        setClubs(list);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setErr("Impossible de charger les clubs.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Listes pour le modal de filtres (typage strict => string[])
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const c of clubs) {
      (c.categories ?? [])
        .filter((x): x is string => typeof x === "string" && x.length > 0)
        .forEach((x) => cats.add(x));
    }
    return Array.from(cats).sort();
  }, [clubs]);

  // Filtrage
  useEffect(() => {
    let results = clubs;

    // 1) Recherche texte : name, city, department
    if (search) {
      const lower = search.trim().toLowerCase();
      results = results.filter((c) => {
        const name = (c.name || "").toLowerCase();
        const city = (c.city || "").toLowerCase();
        const dep = (c.department || "").toLowerCase();
        return (
          name.includes(lower) || city.includes(lower) || dep.includes(lower)
        );
      });
    }

    // 2) Catégories
    if (filters.categories && filters.categories.length > 0) {
      results = results.filter((c) =>
        (c.categories || []).some((cat) => filters.categories!.includes(cat))
      );
    }

    // 3) Départements
    if (filters.departments && filters.departments.length > 0) {
      results = results.filter(
        (c) => !!c.department && filters.departments!.includes(c.department!)
      );
    }

    // 4) Équipes (Masculines / Féminines / Mixte strict)
    if (filters.teamKinds && filters.teamKinds.length > 0) {
      const wantM = filters.teamKinds.some((v) => /masculin/i.test(v));
      const wantF = filters.teamKinds.some((v) => /feminin|féminin/i.test(v));
      const wantX = filters.teamKinds.some((v) => /(mixte|les deux)/i.test(v)); // “Les deux” traité comme Mixte explicite

      results = results.filter((c) => {
        const kinds = extractTeamKinds(c.teams);
        const hasM = kinds.has("masculines");
        const hasF = kinds.has("feminines");
        const isMixte = hasMixte(c.teams); // doit être explicitement mixte

        if (wantX && isMixte) return true;
        if (wantM && hasM) return true;
        if (wantF && hasF) return true;
        return false;
      });
    }

    setFiltered(results);
    setVisibleCount(10);
  }, [search, clubs, filters]);

  const handleLoadMore = () => {
    if (visibleCount < filtered.length) setVisibleCount((v) => v + 10);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["left", "right"]}>
      <StatusBar barStyle="light-content" />
      <View className="px-4 pb-2">
        {/* Titre + bouton filtres */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="search-outline" size={22} color="#F97316" />
            <Text className="text-white text-2xl font-bold ml-2">
              Rechercher un club
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (!isPremium) {
                Alert.alert(
                  "Filtres Premium",
                  "Débloque les filtres clubs avec l’offre Premium.",
                  [
                    { text: "Plus tard", style: "cancel" },
                    { text: "Passer Premium", onPress: onUpgrade },
                  ]
                );
                return;
              }
              setFilterVisible(true);
            }}
            className="p-2 rounded-xl"
          >
            <Ionicons name="filter-outline" size={26} color="#F97316" />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View className="relative mb-4">
          <Ionicons
            name="business-outline"
            size={18}
            color="#9ca3af"
            style={{ position: "absolute", left: 14, top: 15 }}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, ville ou département…"
            placeholderTextColor="#9ca3af"
            className="bg-gray-900 text-white rounded-2xl pl-10 pr-4 py-3 border border-gray-800"
          />
        </View>
      </View>

      {/* Liste */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-gray-400 mt-3">Chargement des clubs…</Text>
        </View>
      ) : err ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-400">{err}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered.slice(0, visibleCount)}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-10">
              Aucun club trouvé
            </Text>
          }
          renderItem={({ item }) => {
            const sexLabel = teamKindsLabel(item);
            const cats = (item.categories ?? []).filter(
              (x): x is string => typeof x === "string" && x.length > 0
            );
            return (
              <LinearGradient
                colors={[brand.blue, brand.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 18, padding: 1.5, marginBottom: 12 }}
              >
                <Pressable
                  onPress={() =>
                    navigation.navigate("ProfilClub", { club: item as any })
                  }
                  className="bg-[#0E0D0D] rounded-[16px] p-4"
                >
                  <View className="flex-row items-center justify-between">
                    {/* CONTENU CLUB */}
                    <View className="flex-row items-center flex-1">
                      {item.logo ? (
                        <Image
                          source={{ uri: item.logo }}
                          className="w-16 h-16 rounded-lg mr-4"
                        />
                      ) : (
                        <View className="w-16 h-16 rounded-lg mr-4 bg-gray-700 items-center justify-center">
                          <Ionicons name="image" size={20} color="#bbb" />
                        </View>
                      )}

                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap">
                          <Text className="text-white text-lg font-semibold">
                            {item.name || "Club sans nom"}
                          </Text>
                          {(item.premium || item.isPremium) && (
                            <View className="ml-2">
                              <PremiumBadge compact />
                            </View>
                          )}
                        </View>

                        <Text className="text-gray-400">{item.city || "—"}</Text>

                        {/* Équipes : sexe / fallback */}
                        <Text className="text-gray-400">
                          {sexLabel
                            ? `Équipes : ${sexLabel}`
                            : typeof item.teams === "number"
                              ? `Équipes : ${item.teams}`
                              : cats.length
                                ? `${cats.length} catégories`
                                : "—"}
                        </Text>

                        <View className="flex-row flex-wrap mt-1">
                          {cats.slice(0, 6).map((c) => (
                            <View
                              key={`${item.id}-${c}`}
                              className="px-2 py-0.5 mr-2 mb-1 bg-gray-700 rounded-full"
                            >
                              <Text className="text-xs text-gray-300">{c}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>

                    {/* ⭐ FAVORI */}
                    <TouchableOpacity
                      onPress={() => {
                        if (!isPremium) {
                          Alert.alert(
                            "Favoris Premium",
                            "Ajoute des clubs en favori en passant en Premium.",
                            [
                              { text: "Annuler", style: "cancel" },
                              { text: "Passer Premium", onPress: onUpgrade },
                            ]
                          );
                          return;
                        }
                        toggleFavorite(item.id);
                      }}
                      hitSlop={10}
                      className="ml-3"
                    >
                      <Ionicons
                        name={isFavorite(item.id) ? "star" : "star-outline"}
                        size={22}
                        color={isFavorite(item.id) ? "#FACC15" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </LinearGradient>
            );
          }}
          ListFooterComponent={
            visibleCount < filtered.length ? (
              <TouchableOpacity onPress={handleLoadMore} className="mt-3">
                <Text className="text-center text-orange-500 font-semibold">
                  Charger plus
                </Text>
              </TouchableOpacity>
            ) : filtered.length > 0 ? (
              <Text className="text-center text-gray-600 mt-3">
                Fin de la liste
              </Text>
            ) : null
          }
        />
      )}

      {/* Modal filtres */}
      <ClubFilter
        visible={filterVisible && isPremium}
        onClose={() => setFilterVisible(false)}
        onApply={(f) => setFilters(f)}
        allCategories={allCategories}
        initial={filters}
      />
    </SafeAreaView>
  );
}

type FirestoreOffer = {
  id: string;
  clubUid: string;
  title: string;
  description?: string;
  position?: string;
  team?: string;
  publishedAt?: string; // Timestamp string ou ISO
  gender?: "Homme" | "Femme" | "Mixte";
  ageRange?: string; // classe d'âge
  category?: string;
  championship?: string; // alias championnnat
  department?: string; // pour filtre département
  location?: string; // ville
};

// ======== Modal de filtres Offres (même UX que ClubFilter) ========
type OfferFilters = {
  categories?: string[];
  championships?: string[];
  ageClasses?: string[];
  departments?: string[];
  positions?: string[];
  genders?: string[];
};

function OffersFilter({
  visible,
  onClose,
  onApply,
  options,
  initial,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (f: OfferFilters) => void;
  options: {
    categories: string[];
    championships: string[];
    ageClasses: string[];
    departments: string[];
  };
  initial?: OfferFilters;
}) {
  const [categories, setCategories] = useState<string[]>(
    initial?.categories ?? []
  );
  const [championships, setChampionships] = useState<string[]>(
    initial?.championships ?? []
  );
  const [ageClasses, setAgeClasses] = useState<string[]>(
    initial?.ageClasses ?? []
  );
  const [departments, setDepartments] = useState<string[]>(
    initial?.departments ?? []
  );
  const [positions, setPositions] = useState<string[]>(
    initial?.positions ?? []
  );
  const [genders, setGenders] = useState<string[]>(initial?.genders ?? []);

  useEffect(() => {
    if (!visible) return;
    setCategories(initial?.categories ?? []);
    setChampionships(initial?.championships ?? []);
    setAgeClasses(initial?.ageClasses ?? []);
    setDepartments(initial?.departments ?? []);
    setPositions(initial?.positions ?? []);
    setGenders(initial?.genders ?? []);
  }, [visible]);

  const resetFilters = () => {
    setCategories([]);
    setChampionships([]);
    setAgeClasses([]);
    setDepartments([]);
    setPositions([]);
    setGenders([]);
  };

  const applyFilters = () => {
    onApply({
      categories,
      championships,
      ageClasses,
      departments,
      positions,
      genders,
    });
    onClose();
  };

  const toggleIn = (
    list: string[],
    setList: (n: string[]) => void,
    val: string
  ) => {
    setList(
      list.includes(val) ? list.filter((v) => v !== val) : [...list, val]
    );
  };

  const renderChips = (
    title: string,
    values: string[],
    selected: string[],
    onToggle: (val: string) => void,
    colorClass = "bg-gray-800",
    activeClass = "bg-orange-500"
  ) => (
    <View className="mb-5">
      <Text className="text-white text-lg font-semibold mb-3">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {values.map((val) => {
          const active = selected.includes(val);
          return (
            <TouchableOpacity
              key={val}
              onPress={() => onToggle(val)}
              className={`px-3 py-1 rounded-2xl ${active ? activeClass : colorClass}`}
            >
              <Text className="text-white">{val}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/50 justify-end pb-4">
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View className="bg-[#1a1b1f] p-5 pb-8 rounded-t-3xl max-h-[90%] border-t border-gray-800">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Filtres</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {renderChips("Catégories", options.categories, categories, (val) =>
              toggleIn(categories, setCategories, val)
            )}

            {renderChips(
              "Championnat",
              options.championships,
              championships,
              (val) => toggleIn(championships, setChampionships, val),
              "bg-gray-800",
              "bg-purple-600"
            )}

            {renderChips(
              "Classe d’âge",
              options.ageClasses,
              ageClasses,
              (val) => toggleIn(ageClasses, setAgeClasses, val),
              "bg-gray-800",
              "bg-green-600"
            )}

            {renderChips(
              "Poste",
              ["Meneur", "Arrière", "Ailier", "Ailier-Fort", "Pivot"],
              positions,
              (val) => toggleIn(positions, setPositions, val),
              "bg-gray-800",
              "bg-orange-500"
            )}

            {/* Sexe (strict) */}
            {renderChips(
              "Sexe",
              ["Garçon", "Fille", "Mixte"],
              genders,
              (val) => toggleIn(genders, setGenders, val),
              "bg-gray-800",
              "bg-blue-600"
            )}

            {/* Département */}
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Département
              </Text>
              <DepartmentSelect
                value={departments}
                onSelect={setDepartments}
                placeholder="Sélectionner un ou plusieurs départements"
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View className="flex-row justify-between mt-4">
            <TouchableOpacity
              onPress={resetFilters}
              className="flex-1 bg-gray-700 py-3 rounded-2xl mr-3"
            >
              <Text className="text-center text-white font-semibold">
                Réinitialiser
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={applyFilters}
              className="flex-1 bg-orange-500 py-3 rounded-2xl ml-3"
            >
              <Text className="text-center text-white font-semibold">
                Appliquer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OffersTab({ isPremium, onUpgrade }: PremiumProps) {
  const navigation = useNavigation<SearchNavProp>();

  // Recherche unique : titre OU ville
  const [query, setQuery] = useState("");

  const [offers, setOffers] = useState<FirestoreOffer[]>([]);
  const [filtered, setFiltered] = useState<FirestoreOffer[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filtres via modal (même logique que ClubFilter)
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<OfferFilters>({});

  // Index clubs → pour récupérer department si manquant sur l’offre
  const [clubsIndex, setClubsIndex] = useState<
    Record<string, { department?: string; name?: string; logo?: string }>
  >({});

  // Abonnement clubs (pour dept, affichage éventuel)
  useEffect(() => {
    const uq = fsQuery(collection(db, "clubs"), orderBy("name"));
    const unsub = onSnapshot(uq, (snap) => {
      const idx: Record<
        string,
        { department?: string; name?: string; logo?: string }
      > = {};
      snap.forEach((doc) => {
        const d = doc.data() as any;
        idx[doc.id] = {
          department: d?.department || "",
          name: d?.name || d?.nom || "",
          logo: d?.logo || "",
        };
      });
      setClubsIndex(idx);
    });
    return () => unsub();
  }, []);

  // Chargement de toutes les offres (collectionGroup)
  useEffect(() => {
    setLoading(true);
    setErr(null);

    const q = fsQuery(
      collectionGroup(db, "offres"),
      orderBy("publishedAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: FirestoreOffer[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          const clubUid = d.ref.parent.parent?.id || data.clubUid || "";
          list.push({
            id: d.id,
            clubUid,
            title: data.title || "",
            description: data.description || "",
            position: data.position || "",
            team: data.team || "",
            gender: (data.gender as FirestoreOffer["gender"]) || "Mixte",
            ageRange: data.ageRange || "",
            category: data.category || "",
            championship:
              data.championship || data.championnat || data.league || "",
            department: data.department || "", // fallback via clubsIndex au filtrage
            location: data.location || "",
            publishedAt: data.publishedAt || "",
          });
        });
        setOffers(list);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setErr("Impossible de charger les offres.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Listes dynamiques pour le modal (garanties string[])
  const allCategories = useMemo(() => {
    const s = new Set<string>();
    for (const o of offers) if (o.category) s.add(o.category);
    return Array.from(s).sort();
  }, [offers]);

  const allChampionships = useMemo(() => {
    const s = new Set<string>();
    for (const o of offers) if (o.championship) s.add(o.championship);
    return Array.from(s).sort();
  }, [offers]);

  const allAgeClasses = useMemo(() => {
    const s = new Set<string>();
    for (const o of offers) if (o.ageRange) s.add(o.ageRange);
    return Array.from(s).sort();
  }, [offers]);

  const allDepartments = useMemo(() => {
    const s = new Set<string>();
    for (const o of offers) {
      const dept = o.department || clubsIndex[o.clubUid]?.department || "";
      if (dept) s.add(dept);
    }
    return Array.from(s).sort();
  }, [offers, clubsIndex]);

  // Filtrage
  useEffect(() => {
    let res = offers;

    // Recherche unique : Titre OU Ville
    if (query.trim()) {
      const lower = query.trim().toLowerCase();
      res = res.filter(
        (o) =>
          (o.title || "").toLowerCase().includes(lower) ||
          (o.location || "").toLowerCase().includes(lower)
      );
    }

    // Catégories
    if (filters.categories && filters.categories.length > 0) {
      res = res.filter(
        (o) => !!o.category && filters.categories!.includes(o.category)
      );
    }

    // Championnat
    if (filters.championships && filters.championships.length > 0) {
      res = res.filter(
        (o) =>
          !!o.championship && filters.championships!.includes(o.championship)
      );
    }

    // Classe d’âge
    if (filters.ageClasses && filters.ageClasses.length > 0) {
      res = res.filter(
        (o) => !!o.ageRange && filters.ageClasses!.includes(o.ageRange)
      );
    }

    // Départements (avec fallback sur le club)
    if (filters.departments && filters.departments.length > 0) {
      res = res.filter((o) => {
        const effDept = o.department || clubsIndex[o.clubUid]?.department || "";
        return !!effDept && filters.departments!.includes(effDept);
      });
    }

    // Poste
    if (filters.positions && filters.positions.length > 0) {
      res = res.filter(
        (o) => !!o.position && filters.positions!.includes(o.position)
      );
    }

    // Sexe strict : Garçon → Homme, Fille → Femme, Mixte → Mixte
    if (filters.genders && filters.genders.length > 0) {
      const wantBoy = filters.genders.includes("Garçon");
      const wantGirl = filters.genders.includes("Fille");
      const wantMixte = filters.genders.includes("Mixte");

      res = res.filter((o) => {
        const g = o.gender || "Mixte";
        if (wantMixte && g === "Mixte") return true;
        if (wantBoy && g === "Homme") return true;
        if (wantGirl && g === "Femme") return true;
        return false;
      });
    }

    setFiltered(res);
    setVisibleCount(10);
  }, [offers, query, filters, clubsIndex]);

  const handleLoadMore = () => {
    if (visibleCount < filtered.length) setVisibleCount((v) => v + 10);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["left", "right"]}>
      <StatusBar barStyle="light-content" />
      <View className="px-4 pb-2">
        {/* Titre + bouton filtres */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="briefcase-outline" size={22} color="#F97316" />
            <Text className="text-white text-2xl font-bold ml-2">
              Rechercher une offre
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (!isPremium) {
                Alert.alert(
                  "Filtres Premium",
                  "Les filtres détaillés des offres sont réservés aux comptes Premium.",
                  [
                    { text: "Plus tard", style: "cancel" },
                    { text: "Passer Premium", onPress: onUpgrade },
                  ]
                );
                return;
              }
              setFilterVisible(true);
            }}
            className="p-2 rounded-xl"
          >
            <Ionicons name="filter-outline" size={26} color="#F97316" />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche unique (Titre OU Ville) */}
        <View className="relative mb-2">
          <Ionicons
            name="search"
            size={18}
            color="#9ca3af"
            style={{ position: "absolute", left: 14, top: 15 }}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Titre de l’offre ou ville…"
            placeholderTextColor="#9ca3af"
            className="bg-gray-900 text-white rounded-2xl pl-10 pr-4 py-3 border border-gray-800"
          />
        </View>
      </View>

      {/* Liste des offres */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-gray-400 mt-3">Chargement des offres…</Text>
        </View>
      ) : err ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-400">{err}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered.slice(0, visibleCount)}
          keyExtractor={(item) => `${item.clubUid}-${item.id}`}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-10">
              Aucune offre trouvée
            </Text>
          }
          renderItem={({ item }) => (
            <LinearGradient
              colors={[brand.orange, brand.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 1.5, marginBottom: 12 }}
            >
              <Pressable
                onPress={() =>
                  navigation.navigate("OfferDetail", {
                    offer: { ...item } as any,
                  })
                }
                className="bg-[#0E0D0D] rounded-[16px] p-4"
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text
                    className="text-white text-lg font-semibold flex-1"
                    numberOfLines={1}
                  >
                    {item.title || "Offre"}
                  </Text>
                  {!!item.publishedAt && (
                    <Text className="text-gray-500 text-xs">
                      {item.publishedAt}
                    </Text>
                  )}
                </View>

                {!!item.location && (
                  <View className="flex-row items-center mb-2">
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#D1D5DB" // équivalent text-gray-300
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-gray-300">{item.location}</Text>
                  </View>
                )}

                {!!item.description && (
                  <Text className="text-gray-300 mb-3" numberOfLines={3}>
                    {item.description}
                  </Text>
                )}

                <View className="flex-row flex-wrap gap-2">
                  {!!item.position && (
                    <View className="bg-orange-600/80 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs">{item.position}</Text>
                    </View>
                  )}
                  {!!item.gender && (
                    <View className="bg-blue-600/80 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs">{item.gender}</Text>
                    </View>
                  )}
                  {!!item.team && (
                    <View className="bg-green-600/80 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs">{item.team}</Text>
                    </View>
                  )}
                  {!!item.category && (
                    <View className="bg-purple-600/80 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs">{item.category}</Text>
                    </View>
                  )}
                  {!!item.championship && (
                    <View className="bg-indigo-600/80 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs">
                        {item.championship}
                      </Text>
                    </View>
                  )}
                  {!!item.ageRange && (
                    <View className="bg-gray-700 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs">{item.ageRange}</Text>
                    </View>
                  )}
                  {/* Département effectif pour affichage (offre ou club) */}
                  {(() => {
                    const effDept =
                      item.department ||
                      clubsIndex[item.clubUid]?.department ||
                      "";
                    return effDept ? (
                      <View className="bg-gray-700 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs">{effDept}</Text>
                      </View>
                    ) : null;
                  })()}
                </View>
              </Pressable>
            </LinearGradient>
          )}
          ListFooterComponent={
            visibleCount < filtered.length ? (
              <TouchableOpacity onPress={handleLoadMore} className="mt-3">
                <Text className="text-center text-orange-500 font-semibold">
                  Charger plus
                </Text>
              </TouchableOpacity>
            ) : filtered.length > 0 ? (
              <Text className="text-center text-gray-600 mt-3">
                Fin de la liste
              </Text>
            ) : null
          }
        />
      )}

      {/* Modal filtres — même UX que Clubs */}
      <OffersFilter
        visible={filterVisible && isPremium}
        onClose={() => setFilterVisible(false)}
        onApply={setFilters}
        options={{
          categories: allCategories,
          championships: allChampionships,
          ageClasses: allAgeClasses,
          departments: allDepartments,
        }}
        initial={filters}
      />
    </SafeAreaView>
  );
}

export default function Search() {
  const { isPremium } = usePremiumStatus();
  const navigation = useNavigation<SearchNavProp>();
  const goToPremium = () => {
    (navigation as any).navigate("Payment");
  };
  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
      <View className="px-4 pt-5 pb-2">
        <LinearGradient
          colors={[brand.blue, "#0D1324", brand.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(37,99,235,0.2)",
            overflow: "hidden",
          }}
        >
          <View
            className="absolute -right-10 -top-8 w-24 h-24 rounded-full"
            style={{ backgroundColor: "rgba(249,115,22,0.18)" }}
          />
          <View
            className="absolute -left-10 bottom-0 w-24 h-24 rounded-full"
            style={{ backgroundColor: "rgba(37,99,235,0.18)" }}
          />

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3">
              <Ionicons name="search-outline" size={18} color="#F8FAFC" />
            </View>
            <View>
              <Text className="text-white text-lg font-bold">Recherche</Text>
              <Text className="text-gray-200 text-xs mt-0.5">
                Clubs, offres et favoris
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      <Tab.Navigator
        tabBar={SearchTabsBar}
        screenOptions={{
          sceneStyle: { backgroundColor: "#000" },
        }}
      >
        <Tab.Screen name="Clubs">
          {() => (
            <ClubsTab isPremium={isPremium} onUpgrade={goToPremium} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Offres">
          {() => (
            <OffersTab isPremium={isPremium} onUpgrade={goToPremium} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Favoris">
          {() =>
            isPremium ? (
              <FavoriteClubsTab />
            ) : (
              <PremiumWall
                message="Les favoris sont réservés aux membres Premium."
                onPressUpgrade={goToPremium}
              />
            )
          }
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
}

function SearchTabsBar({
  state,
  descriptors,
  navigation,
}: MaterialTopTabBarProps) {
  const [tabsLayout, setTabsLayout] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const key = state.routes[state.index]?.key;
    const layout = key ? tabsLayout[key] : null;
    if (!layout) return;

    Animated.spring(translateX, {
      toValue: layout.x,
      speed: 18,
      bounciness: 6,
      useNativeDriver: false,
    }).start();

    Animated.spring(indicatorWidth, {
      toValue: layout.width,
      speed: 18,
      bounciness: 6,
      useNativeDriver: false,
    }).start();
  }, [state.index, tabsLayout, translateX, indicatorWidth]);

  return (
    <View className="px-4 py-1 my-2">
      <View className="w-full bg-[#1f2937] rounded-full px-4 py-2 overflow-hidden border border-white/10">
        <View className="relative w-full">
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: 999,
              backgroundColor: "#F97316",
              width: indicatorWidth,
              transform: [{ translateX }],
            }}
          />

          <View className="w-full flex-row items-center justify-between">
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const options = descriptors[route.key]?.options ?? {};
              const label =
                typeof options.tabBarLabel === "string"
                  ? options.tabBarLabel
                  : options.title ?? route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({ type: "tabLongPress", target: route.key });
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setTabsLayout((prev) => {
                      const current = prev[route.key];
                      if (
                        current &&
                        current.x === x &&
                        current.width === width
                      ) {
                        return prev;
                      }
                      return { ...prev, [route.key]: { x, width } };
                    });
                  }}
                  className="py-1.5 px-6 rounded-full items-center"
                >
                  <Text
                    className={`text-[15px] font-semibold ${
                      isFocused ? "text-white" : "text-gray-200"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
