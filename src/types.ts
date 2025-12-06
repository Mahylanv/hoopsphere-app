import { NavigatorScreenParams } from "@react-navigation/native";

export type Joueur = {
  uid: string;
  prenom: string;
  nom: string;
  email: string;
  dob: string;
  taille?: string;
  poids?: string;
  poste?: string;
  main?: string;
  club?: string;
  genre?: string;
  departement?: string;
  avatar?: string;
  createdAt?: string;
};

export type Club = {
  id: string;
  name: string;
  logo: any;
  city: string;
  teams: number;
  categories: string[];
};

export type Match = {
  id: string;
  date: string;
  lieu: string;
  joueurs: string[];
  score?: {
    équipeA: number;
    équipeB: number;
  };
  statut: "Prévu" | "En cours" | "Terminé";
};

export type Message = {
  text: string;
  sender: string;
  timestamp: string;
};

// NAVIGATION STACK PRINCIPALE

export type RootStackParamList = {
  Home: undefined;
  Connexion: undefined;

  // --- Inscriptions Joueurs ---
  InscriptionJoueur: undefined;
  InscriptionJoueurStep1: undefined;
  InscriptionJoueurStep2: { email: string; password: string };
  InscriptionJoueurStep3: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    dob: string;
    genre: string;
  };

  // --- Inscriptions Clubs ---
  InscriptionClub: undefined;
  InscriptionClubStep2: {
    uid: string;
    email: string | null;
  };

  // --- Navigations principales (Tabs) ---
  MainTabs: NavigatorScreenParams<MainTabParamListJoueur>;
  MainTabsClub: NavigatorScreenParams<MainTabParamListClub>;

  // --- Pages communes ---
  Match: undefined;
  Chat: undefined;
  ChatDetail: {
    conversationId: string;
    name: string;
    avatar: string;
  };

  FullMediaViewer: {
    media: MediaItem[];
    startIndex: number;
  };
  
  ProfilClub: { club: Club };

  Search: undefined;

  OfferDetail: {
    offer: Offer; // <-- on réutilise le type directement
  };

  EditClubProfile: undefined;

  Payment: undefined;
  EditOffer: { offer: Offer }; // nouvelle page de modification
  SearchJoueur: undefined;
  JoueurDetail: { joueur: Joueur };
  ManageCandidatures: undefined;
  ClubTeamsList: undefined;
};

// NAVIGATION — JOUEUR

export type MainTabParamListJoueur = {
  MainJoueur: undefined;
  Match: undefined;
  Chat: undefined;
  Search: undefined;
  Profil: undefined;
};

// NAVIGATION — CLUB

export type MainTabParamListClub = {
  Home: undefined;
  Candidatures: undefined;  
  // Chat: undefined;
  SearchJoueur: undefined;
  ProfilClub: undefined;
};

// AUTRES TYPES (optionnels)

export type Offer = {
  id?: string; // <-- ici optionnel
  title: string;
  description: string;
  position: string;
  team: string;
  publishedAt: string;
  gender: "Homme" | "Femme" | "Mixte";
  ageRange: string;
  category: string;
  location: string;
  clubUid?: string;
};


// TYPES FIRESTORE — ÉQUIPES & JOUEURS

export type Team = {
  id?: string;
  label: string;
  createdAt?: string;
};

export type TeamPlayer = {
  id?: string;
  prenom: string;
  nom: string;
};

export type MediaItem = {
  url: string;
  type: "image" | "video";
};