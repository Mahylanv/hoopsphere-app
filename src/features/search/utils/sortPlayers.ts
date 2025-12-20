// src/utils/sortPlayers.ts
import { RankingPlayer } from "../../home/hooks/usePlayerRanking";

export type RankingFilter =
  | "rating"
  | "points"
  | "threes"
  | "twoInt"
  | "twoExt"
  | "lf"
  | "discipline";

export function sortPlayers(players: RankingPlayer[], filter: RankingFilter) {
  const sorted = [...players];

  switch (filter) {
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);

    case "points":
      return sorted.sort((a, b) => b.stats.pts - a.stats.pts);

    case "threes":
      return sorted.sort((a, b) => b.stats.threes - a.stats.threes);

    case "twoInt":
      return sorted.sort((a, b) => b.stats.twoInt - a.stats.twoInt);

    case "twoExt":
      return sorted.sort((a, b) => b.stats.twoExt - a.stats.twoExt);

    case "lf":
      return sorted.sort((a, b) => b.stats.lf - a.stats.lf);

    case "discipline":
      return sorted.sort((a, b) => a.stats.fouls - b.stats.fouls);

    default:
      return sorted;
  }
}
