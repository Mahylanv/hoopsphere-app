// src/Profil/Joueurs/components/EditProfileModal/EditProfileConstants.ts

/* ---------------------------------------------------------
   CONSTANTES UTILISÉES DANS LE MODAL D'ÉDITION PROFIL
--------------------------------------------------------- */

/* 🔸 Tailles disponibles (140 → 209 cm) */
export const TAILLES = Array.from({ length: 70 }, (_, i) => 140 + i);

/* 🔸 Poids disponibles (40 → 159 kg) */
export const POIDS = Array.from({ length: 120 }, (_, i) => 40 + i);

/* 🔸 Liste des postes possibles */
export const POSTES = [
  { code: "MEN", label: "Meneur" },
  { code: "ARR", label: "Arrière" },
  { code: "AIL", label: "Ailier" },
  { code: "AF", label: "Ailier fort" },
  { code: "PIV", label: "Pivot" },
];

/* 🔸 Mains fortes */
export const MAINS = ["Gauche", "Droite", "Ambidextre"];


export const LEVELS = [
    "D4",
    "D3",
    "D2",
    "D1",
    "R3",
    "R2",
    "R1",
    "Pré-Nationale",
    "NM3",
    "NM2",
    "NM1",
    "NF3",
    "NF2",
    "NF1",
  ];
  
