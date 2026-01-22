// src/types.ts

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
    premium?: boolean;
    cardStyle?: "normal" | "premium";
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
  ForgotPassword: undefined; 
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
  
  ProfilClub: { club?: Club; openCreateOffer?: boolean };

  Search: undefined;

  OfferDetail: {
    offer: Offer; // <-- on réutilise le type directement
  };

  EditClubProfile: undefined;

  Payment: undefined;
  SubscriptionSettings: undefined;
  StripeCheckout: { interval: "month" | "year" };
  EditOffer: { offer: Offer }; // nouvelle page de modification
  SearchJoueur: undefined;
  // JoueurDetail: { joueur: Joueur };
  JoueurDetail: { uid: string };
  ManageCandidatures: undefined;
  ClubTeamsList: undefined;
   VideoFeed: {
    videos: {
      id: string;
      url: string;
      playerUid: string;
      likeCount: number;
      thumbnailUrl?: string | null;
      isLikedByMe: boolean;
    }[];
    startIndex: number;
  };
  Visitors: undefined;
  TestPrenium: undefined;
  CreatePost: undefined;
  EditPost: undefined;
  
  LikedPosts: undefined;
  PostLikes: undefined;
};

// NAVIGATION — JOUEUR

export type MainTabParamListJoueur = {
  HomeScreen: undefined;
  Match: undefined;
  // Chat: undefined;
  TestPrenium: undefined;
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
  SearchJoueurTabs: undefined;
  ClubPremium: undefined;
  ClubLikedVideos: undefined;
  ClubVisitors: undefined;
};

// AUTRES TYPES (optionnels)

export type Offer = {
  id?: string; // <-- ici optionnel
  title: string;
  description: string;
  position: string[];
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

export type VideoItem = {
  id: string;
  url: string;
  cachedUrl?: string | null;
  mediaType?: "image" | "video";
  avatar?: string | null;
  playerUid: string;
  likeCount: number;
  isLikedByMe: boolean;
  thumbnailUrl?: string | null;
  description?: string;
  createdAt?: any;
  location?: string | null;
  skills?: string[];
};
