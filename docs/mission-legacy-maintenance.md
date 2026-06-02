# Mission legacy - maintenance et modernisation

Date: 2026-06-02
Projet: Hoopsphere
Branche de travail: `feature/parser`

## 1. Reprise en main

Le projet est une application Expo / React Native avec plusieurs sous-projets Node:

- app principale: `hoopsphere-app`
- cloud functions Stripe: `stripe`
- functions historiques: `functions`
- sync auth: `auth-sync`

Frictions observees:

- le typecheck global de l'app echoue deja avant intervention (`npx tsc --noEmit`) sur des erreurs de navigation/types preexistantes;
- `stripe/package-lock.json` est ignore par `.gitignore`, donc l'upgrade du sous-projet `stripe` n'est pas verrouille dans Git tant que cette regle n'est pas corrigee;
- les commandes `npm audit` / `npm outdated` ont besoin du reseau npm et echouent dans le sandbox sans acces reseau.

## 2. Tableau de bord avant

| Indicateur | Avant |
| --- | --- |
| `npm audit` app principale | 43 vulnerabilites: 1 low, 31 moderate, 9 high, 2 critical |
| `npm audit` sous-projet `stripe` | 24 vulnerabilites: 1 low, 14 moderate, 7 high, 2 critical |
| `npm audit` sous-projet `functions` | 19 vulnerabilites: 1 low, 13 moderate, 3 high, 2 critical |
| `npm outdated` app principale | nombreuses deps Expo/RN/Stripe/Victory obsoletes; ex. `expo` 54.0.10 -> 56.0.8, `victory-native` 36.9.2 -> 41.22.0 |
| Build `stripe` | OK: `npm run build` |
| Tests app | aucun script `test` avant intervention |
| Typecheck app globale | KO preexistant: imports `StripeCheckout` / `InAppWebView`, routes `ClubLikedVideos` / `ClubVisitors`, etc. |

## 3. Fiche de cadrage

| Chantier | Detail | Fait quand |
| --- | --- | --- |
| C1 - Mise a jour | `stripe`: `firebase-admin` 12.7.0 -> 13.10.0, `firebase-functions` 6.0.1 -> 7.2.5, `nodemailer` 6.10.1 -> 8.0.10, `stripe` 20.1.2 -> 22.2.0, `@types/nodemailer` 7 -> 8 | build `stripe` vert, audit reduit, adaptations Stripe v22 appliquees |
| C2 - Correctif | Bug filtres joueurs: si l'utilisateur croise les sliders (`tailleMin > tailleMax`), la liste devient vide | test de reproduction rouge puis vert, bornes normalisees |
| C3 - Evolutif | Recherche joueurs et clubs sans tenir compte des accents ni de la casse | tests verts, recherche `HERAULT` trouve `Hérault`, recherche `ELAN BEARNAIS` trouve `Élan Béarnais` |

Plan de rollback C1:

- revert du commit C1;
- ou restaurer dans `stripe/package.json`: `firebase-admin@^12.7.0`, `firebase-functions@^6.0.1`, `nodemailer@^6.10.1`, `stripe@^20.1.2`, `@types/nodemailer@^7.0.5`, puis `npm install`;
- redeployer uniquement apres `npm run build` vert dans `stripe`.

## 4. C1 - Mise a jour et adaptation

Commandes avant:

```bash
cd stripe
npm audit
npm outdated
npm run build
```

Montées effectuees:

- `firebase-functions` 6 -> 7: changement majeur. Le guide/reference Firebase indique que `functions.config()` est retire en v7. Le code utilise deja `defineSecret` depuis `firebase-functions/params`, donc pas de migration de configuration runtime a faire.
- `stripe` 20 -> 22: changement majeur. Le changelog Stripe v22 indique un changement de version API pinnee vers `2026-05-27.dahlia` et des changements de types/exports. Le code a ete adapte: `apiVersion` explicite mise a jour et types ressources importes depuis les entrees typees v22.
- `nodemailer` 6 -> 8: corrige les alertes d'audit Nodemailer. Le code existant `createTransport`, `verify`, `sendMail` reste compatible.

Sources lues:

- Firebase Functions reference: https://firebase.google.com/docs/reference/functions/firebase-functions
- Firebase Admin Node.js release notes: https://firebase.google.com/support/release-notes/admin/node
- Stripe Node changelog: https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md

Resultat apres:

- `npm run build` dans `stripe`: OK.
- `npm audit` dans `stripe`: 9 vulnerabilites moderees restantes, toutes liees a `uuid` via Firebase Admin / Google Cloud. `npm audit fix --force` propose un downgrade `firebase-admin@10.3.0`, refuse pour eviter une regression majeure.
- `npm outdated` dans `stripe`: restent surtout les outils de lint/TS (`eslint`, `@typescript-eslint/*`, `typescript`) et `firebase-functions-test`.

## 5. C2 - Correctif

Symptome:

- dans la recherche joueurs, deux sliders separes permettent de mettre une borne minimum au-dessus de la borne maximum;
- exemple reproduit par test: `tailleMin=200`, `tailleMax=180` excluait un joueur de `188 cm`.

Cause racine:

- la logique appliquait successivement `taille >= min` puis `taille <= max` sans normaliser les bornes.

Correction:

- extraction du filtrage dans `src/features/search/utils/filterPlayers.ts`;
- ajout de `normalizeRange(min, max)` qui inverse les bornes si necessaire;
- `SearchJoueur.tsx` utilise cette fonction pure.

Preuve:

```bash
npm test
```

Le test de reproduction a d'abord echoue, puis passe apres correction.

## 6. C3 - Evolutif

Besoin:

- rendre la recherche joueurs et clubs plus tolerante: un utilisateur qui tape sans accents ou en majuscules doit retrouver les noms/departements accentues.

Implementation:

- ajout de `normalizeText()` dans `filterPlayers.ts` avec normalisation Unicode NFD, suppression des diacritiques et mise en minuscules;
- ajout de `filterClubs.ts` pour appliquer la meme logique a la recherche clubs;
- tests: recherche `HERAULT` retrouve un joueur avec departement `Hérault`; recherche `ELAN BEARNAIS` retrouve `Élan Béarnais`.

Preuve:

```bash
npm test
```

## 7. Tableau de bord apres

| Indicateur | Avant | Apres |
| --- | --- | --- |
| `npm audit` sous-projet `stripe` | 24 vuln. (1 low, 14 moderate, 7 high, 2 critical) | 9 vuln. moderate |
| `npm outdated` sous-projet `stripe` | Firebase/Admin/Functions, Nodemailer, Stripe, TS/ESLint obsoletes | plus de retard sur Firebase/Admin/Functions, Nodemailer, Stripe; restent TS/ESLint/test |
| Build `stripe` | OK | OK |
| Tests app | aucun script | `npm test` OK |
| Typecheck app globale | KO preexistant | KO preexistant non traite dans ce perimetre |

Commandes finales:

```bash
cd stripe && npm run build
cd .. && npm test
cd stripe && npm audit
cd stripe && npm outdated
```

## 8. Journal de bord

- 14h00 - Etat des lieux: detection app Expo/RN + sous-projets `stripe` et `functions`.
- 14h05 - `npm audit` app: 43 vulnerabilites; `stripe`: 24; `functions`: 19.
- 14h10 - Build `stripe` avant upgrade: OK.
- 14h15 - Typecheck app globale: KO preexistant, non retenu comme filet C1.
- 14h20 - Ajout script `npm test`, extraction `filterPlayers`, tests de comportement existant: vert.
- 14h25 - Reproduction bug sliders croises: test rouge.
- 14h28 - Correction par normalisation des bornes: test vert.
- 14h30 - Ajout recherche sans accents/casse: test vert.
- 14h32 - Upgrade `stripe` deps: Firebase, Nodemailer, Stripe.
- 14h34 - Build casse sur Stripe v22: types namespace et `apiVersion`.
- 14h37 - Adaptation imports types Stripe v22 + `apiVersion: 2026-05-27.dahlia`: build vert.
- 14h39 - `npm audit fix` non force: audit `stripe` reduit a 9 vulnerabilites moderees restantes.

## 9. Bilan legacy

Le cout principal vient du manque de filet initial et du lockfile ignore dans `stripe`. L'upgrade Stripe a casse au niveau TypeScript, ce qui est sain: le build a signale precisement les APIs/types a adapter. Pour eviter ce cout plus tard, il faudrait:

- versionner les lockfiles utiles;
- garder un script `test` minimal des fonctions pures;
- lancer `npm audit` et `npm outdated` regulierement, pas seulement en fin de projet;
- corriger progressivement le typecheck global de l'app pour en faire un vrai garde-fou.
