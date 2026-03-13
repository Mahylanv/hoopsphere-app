# Plan de Tests Beta - Hoopsphere

## . Objectifs de la phase beta

- Valider l'utilite des parcours joueurs et clubs en conditions reelles.
- Detecter les anomalies avant diffusion large.
- Mesurer la stabilite technique et la satisfaction utilisateur.
- Confirmer la capacite de conversion vers les actions cibles (activation, premium).
- Tester le Parser OCR

## . Perimetre de test

- Authentification (inscription, connexion, mot de passe oublie)
- Parcours profil joueur/club
- Publication/consultation de contenus
- Recherche/filtres/favoris
- Candidatures cote club
- Parcours abonnement Premium
- Analyse de PDF

## . Echantillon beta et organisation

- Taille cible : 12 testeurs
- Repartition recommandee :
- 60% joueurs
- 30% clubs/coachs
- 10% profils supports (encadrants, observateurs)
- Duree de campagne : 2 a 3 semaines
- Canaux de feedback : messagerie réseaux sociaux/ adresse email
- Nombre de feuilles de match testées > 10

## . Environnements et pre-requis

| Element | Valeur |
|---|---|
| Plateformes | Android |
| Build | Beta |
| Donnees | Comptes de test + donnees anonymisees + feuilles de matchs officielles|
| Tracabilite | ID testeur + ID cas de test + ID anomalie |

## . Cas de test (plan formel)

 Scenario | Preconditions | Etapes (resume) | Resultat attendu | Criticite |
 Inscription joueur | App installee | Completer les etapes d'inscription | Compte cree et session active | Critique |
Inscription club | App installee | Completer formulaire club | Compte club cree | Critique |
 Connexion/deconnexion | Compte existant | Se connecter puis se deconnecter | Session geree sans erreur | Critique |
 Mot de passe oublie | Compte valide | Demander reset depuis ecran dedie | Email de reset recu | Majeure |
 Edition profil | Session active | Modifier infos et sauvegarder | Donnees persistantes | Majeure |
Publication contenu | Session joueur | Publier un contenu | Contenu visible dans le flux | Critique |
 Like / unlike | Contenu disponible | Liker puis retirer le like | Compteur et etat coherents | Majeure |
 Recherche + filtres | Donnees de test chargees | Appliquer filtres metier | Resultats pertinents | Majeure |
 Favoris | Profil cible disponible | Ajouter et retirer favori | Etat persiste apres reload | Majeure |
Candidatures club | Session club | Consulter et traiter candidatures | Liste et actions fonctionnelles | Critique |
 Parcours Premium | Session active | Lancer paiement test | Retour de statut coherent | Critique |
 Navigation globale | Session active | Parcourir onglets/ecrans | Aucun blocage ni crash | Critique |
 Fiabilité Parser | Session active | Analyser un faux pdf | Mauvais pdf detecté | Critique |
 Fonctionnabilité parser | Session active | Analyser un vrai pdf | PDF detecté, stats extraites | Critique |


## . Criteres d'acceptation (go/no-go)

La beta est acceptee si tous les criteres suivants sont respectes :

- Taux de reussite des cas **critiques >= 95%**
- **0 anomalie bloquante** ouverte en fin de campagne
- Anomalies majeures restantes : corrigees ou planifiees avec ETA validee
- Stabilite : taux de crash session **< 1%**
- Satisfaction beta testeurs : note moyenne **>= 3.5/5**

