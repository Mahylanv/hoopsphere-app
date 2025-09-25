export type RootStackParamList = {
    Home: undefined;
    Connexion: undefined;

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

    InscriptionClub: undefined;

    InscriptionClubStep2: {
        uid: string;
        email: string | null;
    };

    MainTabs: undefined;

    Chat: undefined;
    ChatDetail: {
        conversationId: string;
        name: string;
        avatar: number;
    };

    ClubProfile: { club: Club };
    Search: undefined;

    OfferDetail: {
        offer: {
            id: string;
            title: string;
            description: string;
            position: string;
            team: string;
            publishedAt: string;
            gender: 'Homme' | 'Femme' | 'Mixte';
            ageRange: string;
            category: string;
            location: string;
        };
    };

    Payment: undefined;
};

export type MainTabParamList = {
    MainJoueur: undefined;
    Chat: undefined;
    Profil: undefined;
    Search: undefined;
};

export type Club = {
    id: string;
    name: string;
    logo: any;
    city: string;
    teams: number;
    categories: string[];
};