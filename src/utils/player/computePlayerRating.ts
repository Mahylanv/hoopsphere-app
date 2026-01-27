// src/utils/computePlayerRating.ts

import { PlayerAverages } from "./computePlayerStats";

export function computePlayerRating(stats: PlayerAverages, poste?: string): number {
  if (!stats || !poste) return 50; // note minimale

  // Normaliser le poste (labels FR + codes)
  const p = poste.toLowerCase();
  const normalized = p
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]/g, "");

  // --------------------------------
  // ⭐ SOUS-NOTES /100 (FUT AMATEUR)
  // --------------------------------

  // SCORING : 10 pts de moyenne → 100
  const scorePTS = Math.min(100, stats.pts * 10);

  // INSIDE : 3 tirs int → 90, 4 → 100
  const scoreInside = Math.min(100, stats.twoInt * 30);

  // OUTSIDE : 1 tir ext/3pts → 50 (amateur)
  let scoreOutside = Math.min(100, (stats.threes + stats.twoExt) * 50);

  // Bonus : un joueur amateur à 0 tir extérieur → note de 20
  if (scoreOutside === 0) scoreOutside = 20;

  // LF : 3 lancers par match → 100
  const scoreLF = Math.min(100, stats.lf * 40);

  // DISCIPLINE : fautes (amateur → malus très léger)
  const scoreF = Math.max(0, 100 - stats.fouls * 10);

  // --------------------------------
  // ⭐ NOTE PAR POSTE
  // --------------------------------

  let overall = 0;

  if (normalized.includes("meneur") || normalized.includes("men") || normalized.includes("pg")) {
    // Meneur : extérieur + scoring léger
    overall =
      scorePTS * 0.30 +
      scoreOutside * 0.40 +
      scoreInside * 0.10 +
      scoreLF * 0.10 +
      scoreF * 0.10;
  }

  else if (normalized.includes("arriere") || normalized.includes("arr") || normalized.includes("sg")) {
    // Arrière : scoring + tir extérieur
    overall =
      scorePTS * 0.40 +
      scoreOutside * 0.35 +
      scoreInside * 0.10 +
      scoreLF * 0.10 +
      scoreF * 0.05;
  }

  else if (normalized.includes("ailier") || normalized.includes("ail") || normalized.includes("sf") || normalized.includes("af") || normalized.includes("pf")) {
    // Ailier : polyvalence
    overall =
      scorePTS * 0.35 +
      scoreInside * 0.20 +
      scoreOutside * 0.25 +
      scoreLF * 0.10 +
      scoreF * 0.10;
  }

  else if (normalized.includes("pivot") || normalized.includes("piv") || normalized.includes("c")) {
    // Pivot : 2INT et discipline
    overall =
      scorePTS * 0.20 +
      scoreInside * 0.50 +
      scoreOutside * 0.05 +
      scoreLF * 0.15 +
      scoreF * 0.10;
  }

  else {
    // Poste inconnu → neutre
    overall =
      scorePTS * 0.35 +
      scoreInside * 0.25 +
      scoreOutside * 0.20 +
      scoreLF * 0.10 +
      scoreF * 0.10;
  }

  // --------------------------------
  // ⭐ BONUS NOMBRE DE MATCHS
  // --------------------------------

  const bonusMatchs = Math.min(10, stats.gamesPlayed * 2);
  overall += bonusMatchs;

  // --------------------------------
  // ⭐ NOTE MINIMALE 50
  // --------------------------------

  overall = Math.max(50, overall); // ne jamais descendre sous 50
  overall = Math.min(100, Math.round(overall)); // clamp final

  return overall;
}
