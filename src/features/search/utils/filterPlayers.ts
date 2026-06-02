import type { Joueur } from "../../../types";
import type { JoueurFiltre } from "../components/JoueurFilter";

const parseTaille = (taille?: string) => {
  if (!taille) return 0;
  return parseInt(taille.replace("cm", "").replace(" ", ""), 10);
};

const parsePoids = (poids?: string) => {
  if (!poids) return 0;
  return parseInt(poids.replace("kg", "").replace(" ", ""), 10);
};

const normalizeText = (value?: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeRange = (
  min?: number | null,
  max?: number | null
): [number | null, number | null] => {
  if (min == null || max == null || min <= max) {
    return [min ?? null, max ?? null];
  }

  return [max, min];
};

export function filterPlayers(
  joueurs: Joueur[],
  search: string,
  filters: JoueurFiltre
) {
  let results = joueurs;
  const [tailleMin, tailleMax] = normalizeRange(
    filters.tailleMin,
    filters.tailleMax
  );
  const [poidsMin, poidsMax] = normalizeRange(
    filters.poidsMin,
    filters.poidsMax
  );

  if (search) {
    const lower = normalizeText(search);
    results = results.filter(
      (j) =>
        normalizeText(j.nom).includes(lower) ||
        normalizeText(j.prenom).includes(lower) ||
        normalizeText(j.club).includes(lower) ||
        normalizeText(j.departement).includes(lower)
    );
  }

  if (filters.poste && filters.poste.length > 0) {
    results = results.filter(
      (j) => j.poste && filters.poste!.includes(j.poste)
    );
  }

  if (filters.departement && filters.departement.length > 0) {
    results = results.filter(
      (j) => j.departement && filters.departement!.includes(j.departement)
    );
  }

  if (filters.genre && filters.genre.length > 0) {
    results = results.filter(
      (j) => j.genre && filters.genre!.includes(j.genre)
    );
  }

  if (filters.main && filters.main.length > 0) {
    results = results.filter(
      (j) => j.main && filters.main!.includes(j.main.trim())
    );
  }

  if (tailleMin != null) {
    results = results.filter(
      (j) => parseTaille(j.taille) >= tailleMin
    );
  }

  if (tailleMax != null) {
    results = results.filter(
      (j) => parseTaille(j.taille) <= tailleMax
    );
  }

  if (poidsMin != null) {
    results = results.filter((j) => parsePoids(j.poids) >= poidsMin);
  }

  if (poidsMax != null) {
    results = results.filter((j) => parsePoids(j.poids) <= poidsMax);
  }

  return results;
}
