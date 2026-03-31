## Prompt a donner a Gemini

Agis comme un expert UML et conception fonctionnelle.

Je veux que tu produises le diagramme de cas d'usage UML le plus pertinent possible pour mon application mobile "Hoopsphere", en privilegiant la clarte, la lisibilite et la coherence metier plutot qu'une exhaustivite technique inutile.

Contexte general de l'application :
Hoopsphere est une application mobile orientee basket qui met en relation des joueurs et des clubs.
L'application permet a un joueur de creer son profil, publier du contenu, enregistrer ses statistiques de match, rechercher des clubs, ajouter des clubs en favoris et postuler a des offres.
L'application permet a un club de creer son profil, gerer ses equipes, publier des offres de recrutement, rechercher des joueurs, ajouter des joueurs en favoris, consulter les candidatures et acceder a des fonctionnalites premium.
L'application propose aussi un abonnement premium avec paiement Stripe.

Objectif du diagramme :
Je veux un use case diagram UML academique, propre et optimise.
Il doit representer les interactions metier principales de l'application, sans entrer dans les details techniques Firestore, Firebase, collections, sous-collections ou logique interne de synchronisation.
Tu dois vraiment realiser le diagramme final, pas seulement me conseiller ou me proposer une structure theorique.
Je veux obtenir a la fin un vrai visuel exploitable dans mon rendu final.

Consignes de modelisation :
1. Le systeme doit s'appeler "Hoopsphere".
2. Le diagramme doit rester lisible sur une page.
3. Regroupe les actions trop fines en cas d'usage metier de haut niveau.
4. N'affiche pas les details purement techniques :
   - stockage Firestore
   - sous-collections
   - generation de thumbnail
   - synchronisation interne
   - tokens push
5. Utilise les relations UML intelligemment :
   - <<include>> pour les sous-actions obligatoires
   - <<extend>> pour les actions optionnelles ou conditionnelles
6. Ne cree pas un diagramme surcharge. Si plusieurs micro-actions peuvent etre fusionnees, fusionne-les.
7. Si pertinent, tu peux utiliser une generalisation d'acteurs entre "Utilisateur authentifie", "Joueur" et "Club".
8. Le diagramme doit etre centre sur les parcours utiles pour un dossier de conception / soutenance.
9. Le diagramme final doit etre visuellement propre :
   - disposition equilibree
   - libelles lisibles
   - pas de chevauchement
   - style sobre et professionnel
   - fond clair ou neutre adapte a une capture/export
10. Le resultat doit etre pense pour etre exporte en image dans un rendu final de dossier ou soutenance.

Acteurs a prendre en compte :
- Visiteur
- Joueur
- Club
- Systeme de paiement Stripe

Acteurs a ne pas mettre comme acteurs principaux sauf si indispensable :
- Firebase
- Firestore
- Storage
- Notifications push
- OCR / parser

Fonctionnalites metier principales cote visiteur :
- Consulter les profils publics
- Consulter les offres publiees
- Se connecter
- S'inscrire en tant que joueur
- S'inscrire en tant que club

Fonctionnalites metier principales cote joueur :
- Gerer son profil joueur
- Ajouter/modifier son avatar et sa galerie
- Publier un post
- Modifier ou supprimer un post
- Consulter le fil de contenus
- Liker un post
- Rechercher des clubs
- Ajouter un club en favori
- Consulter ses favoris
- Consulter une offre
- Postuler a une offre
- Enregistrer / importer ses statistiques de match
- Consulter ses visiteurs si premium
- Souscrire a Premium
- Gerer son abonnement

Fonctionnalites metier principales cote club :
- Gerer son profil club
- Gerer ses equipes
- Ajouter des joueurs dans une equipe
- Rechercher des joueurs
- Ajouter un joueur en favori
- Consulter ses favoris
- Publier une offre
- Modifier ou supprimer une offre
- Consulter les candidatures
- Accepter ou refuser une candidature
- Consulter les posts des joueurs
- Liker un post
- Consulter les visiteurs si premium
- Souscrire a Premium
- Gerer son abonnement

Contraintes de synthese importantes :
- "Gerer son profil joueur" peut inclure modifier infos personnelles, photo, bio, informations sportives.
- "Gerer son profil club" peut inclure modifier infos du club, logo, description, categories.
- "Gerer ses equipes" peut inclure creer une equipe, modifier l'effectif, supprimer un membre.
- "Publier un post" peut inclure televerser un media et definir la visibilite.
- "Postuler a une offre" peut inclure envoyer un message / email de motivation.
- "Souscrire a Premium" doit interagir avec l'acteur Stripe.
- "Gerer son abonnement" peut inclure consulter son statut, changer de formule ou resilier selon le niveau de detail que tu juges utile.
- "Consulter les visiteurs" doit apparaitre comme une fonctionnalite conditionnelle liee au premium.

Ce que je veux en sortie :
1. Une courte justification de tes choix de modelisation.
2. La liste finale des acteurs retenus.
3. La liste finale des cas d'usage retenus.
4. Un diagramme UML en code PlantUML, propre et directement renderable.
5. Un visuel final propre du use case diagram, pret a etre capture, exporte ou integre comme image dans un rendu final.
6. Si ton interface permet un rendu graphique, affiche directement le diagramme visuel en plus du code.
7. Si tu hesites entre deux variantes, choisis la version la plus lisible pour un dossier et explique en une phrase pourquoi.

Important :
- Ne t'arrete pas a une simple analyse.
- Ne me rends pas seulement une liste de cas d'usage.
- Ne me rends pas seulement du code brut sans mise en forme.
- Je veux bien le diagramme final ET un rendu visuel propre.
- Le visuel doit etre suffisamment propre pour etre reutilise comme image dans mon dossier final.

Attendu qualite :
- Diagramme elegant
- Intitules de cas d'usage courts, professionnels et homogenes
- Pas de redondances inutiles
- Vision metier claire
- Niveau de detail ni trop faible ni trop technique
- Mise en page finale presentable dans un document academique

Si le diagramme devient trop charge, priorise les cas d'usage metier suivants :
- Authentification / inscription
- Gestion de profil
- Publication / consultation de contenu
- Recherche / favoris
- Recrutement via offres et candidatures
- Premium / paiement

Produis la meilleure version possible..
