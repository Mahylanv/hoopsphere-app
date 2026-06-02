import type { ClubFiltre } from "../components/ClubFilters";

export type SearchClub = {
  id: string;
  name?: string;
  city?: string;
  department?: string;
  categories?: string[];
  teams?: string | number | string[] | Record<string, any>;
};

const normalizeText = (value?: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const hasMixte = (teams: SearchClub["teams"]): boolean => {
  if (!teams && teams !== 0) return false;
  const check = (team: string) =>
    /(^|\W)(mixte|les deux|both)(\W|$)/i.test(normalizeText(team));

  if (Array.isArray(teams)) {
    return teams.some((value) => typeof value === "string" && check(value));
  }
  if (typeof teams === "string") {
    return teams.split(/[,/|]/).some((part) => check(part));
  }
  if (typeof teams === "object") {
    return !!(teams.mixte || teams.both);
  }
  return false;
};

const extractTeamKinds = (
  teams: SearchClub["teams"]
): Set<"masculines" | "feminines"> => {
  const out = new Set<"masculines" | "feminines">();
  const pushFromToken = (team: string) => {
    const normalized = normalizeText(team);
    if (/(masculin|masculine|masculins|homme|men|male)/.test(normalized)) {
      out.add("masculines");
    }
    if (/(feminin|feminine|feminines|femme|women|female)/.test(normalized)) {
      out.add("feminines");
    }
  };

  if (!teams && teams !== 0) return out;

  if (Array.isArray(teams)) {
    teams.forEach((value) => typeof value === "string" && pushFromToken(value));
  } else if (typeof teams === "string") {
    teams.split(/[,/|]/).forEach((part) => pushFromToken(part));
  } else if (typeof teams === "object") {
    const teamRecord = teams as Record<string, any>;
    if (teamRecord.masculines || teamRecord.male || teamRecord.hommes) {
      out.add("masculines");
    }
    if (teamRecord.feminines || teamRecord.female || teamRecord.femmes) {
      out.add("feminines");
    }
  }

  return out;
};

export function filterClubs(
  clubs: SearchClub[],
  search: string,
  filters: ClubFiltre
) {
  let results = clubs;

  if (search.trim()) {
    const lower = normalizeText(search);
    results = results.filter(
      (club) =>
        normalizeText(club.name).includes(lower) ||
        normalizeText(club.city).includes(lower) ||
        normalizeText(club.department).includes(lower)
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    results = results.filter((club) =>
      (club.categories || []).some((cat) => filters.categories!.includes(cat))
    );
  }

  if (filters.departments && filters.departments.length > 0) {
    results = results.filter(
      (club) =>
        !!club.department && filters.departments!.includes(club.department)
    );
  }

  if (filters.teamKinds && filters.teamKinds.length > 0) {
    const wantM = filters.teamKinds.some((value) => /masculin/i.test(value));
    const wantF = filters.teamKinds.some((value) =>
      /feminin|féminin/i.test(value)
    );
    const wantX = filters.teamKinds.some((value) =>
      /(mixte|les deux)/i.test(value)
    );

    results = results.filter((club) => {
      const kinds = extractTeamKinds(club.teams);
      const hasM = kinds.has("masculines");
      const hasF = kinds.has("feminines");
      const isMixte = hasMixte(club.teams);

      if (wantX && isMixte) return true;
      if (wantM && hasM) return true;
      if (wantF && hasF) return true;
      return false;
    });
  }

  return results;
}
