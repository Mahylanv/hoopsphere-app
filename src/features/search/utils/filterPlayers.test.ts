import test from "node:test";
import assert from "node:assert/strict";

import type { Joueur } from "../../../types";
import { filterPlayers } from "./filterPlayers";

const players: Joueur[] = [
  {
    uid: "j1",
    prenom: "Nina",
    nom: "Martin",
    email: "nina@example.test",
    dob: "2001-01-01",
    taille: "188 cm",
    poids: "74 kg",
    poste: "Ailier",
    main: "Droite",
    club: "Paris Basket",
    genre: "Equipe feminine",
    departement: "Paris",
  },
  {
    uid: "j2",
    prenom: "Leo",
    nom: "Durand",
    email: "leo@example.test",
    dob: "1999-01-01",
    taille: "201 cm",
    poids: "96 kg",
    poste: "Pivot",
    main: "Gauche",
    club: "Limoges CSP",
    genre: "Equipe masculine",
    departement: "Hérault",
  },
];

test("filterPlayers conserve la recherche texte existante", () => {
  const result = filterPlayers(players, "paris", {});

  assert.deepEqual(
    result.map((player) => player.uid),
    ["j1"]
  );
});

test("filterPlayers applique les filtres de taille et de poste", () => {
  const result = filterPlayers(players, "", {
    poste: ["Pivot"],
    tailleMin: 190,
    tailleMax: 210,
  });

  assert.deepEqual(
    result.map((player) => player.uid),
    ["j2"]
  );
});

test("filterPlayers garde les joueurs dans la plage quand les bornes taille sont inversees", () => {
  const result = filterPlayers(players, "", {
    tailleMin: 200,
    tailleMax: 180,
  });

  assert.deepEqual(
    result.map((player) => player.uid),
    ["j1"]
  );
});

test("filterPlayers recherche sans tenir compte des accents ni de la casse", () => {
  const result = filterPlayers(players, "HERAULT", {});

  assert.deepEqual(
    result.map((player) => player.uid),
    ["j2"]
  );
});
