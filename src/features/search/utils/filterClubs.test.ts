import test from "node:test";
import assert from "node:assert/strict";

import { filterClubs, type SearchClub } from "./filterClubs";

const clubs: SearchClub[] = [
  {
    id: "c1",
    name: "Élan Béarnais",
    city: "Pau",
    department: "Pyrénées-Atlantiques",
    categories: ["U18"],
    teams: "Masculines",
  },
  {
    id: "c2",
    name: "Limoges CSP",
    city: "Limoges",
    department: "Haute-Vienne",
    categories: ["Senior"],
    teams: "Féminines",
  },
];

test("filterClubs recherche sans tenir compte des accents ni de la casse", () => {
  const result = filterClubs(clubs, "ELAN BEARNAIS", {});

  assert.deepEqual(
    result.map((club) => club.id),
    ["c1"]
  );
});

test("filterClubs conserve les filtres categories et equipes", () => {
  const result = filterClubs(clubs, "", {
    categories: ["Senior"],
    teamKinds: ["Féminines"],
  });

  assert.deepEqual(
    result.map((club) => club.id),
    ["c2"]
  );
});
