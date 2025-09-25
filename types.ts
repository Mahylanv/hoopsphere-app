export type RootStackParamList = {
    Home: undefined;
    Connexion: undefined;
<<<<<<< HEAD
=======

>>>>>>> origin/feature/club-bdd
    InscriptionJoueurStep1: undefined;
    InscriptionJoueurStep2: { email: string; password: string };
    InscriptionJoueurStep3: {
        email: string;
        password: string;
        nom: string;
        prenom: string;
        dob: string;
<<<<<<< HEAD
    };
    InscriptionClub: undefined;

    MainTabs: undefined;
    Chat: undefined; 
    ChatDetail: {
        conversationId: string;
        name: string;
        avatar: number; 
    };
    ClubProfile: { club: Club }; 
    Search: undefined;  
=======
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
>>>>>>> origin/feature/club-bdd

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
<<<<<<< HEAD
=======

    Payment: undefined;
>>>>>>> origin/feature/club-bdd
};

export type MainTabParamList = {
    MainJoueur: undefined;
<<<<<<< HEAD
    Chat: undefined; 
    Profil: undefined;
    Search: undefined;  
=======
    Chat: undefined;
    Profil: undefined;
    Search: undefined;
>>>>>>> origin/feature/club-bdd
};

export type Club = {
    id: string;
    name: string;
    logo: any;
    city: string;
    teams: number;
    categories: string[];
<<<<<<< HEAD
};
=======
};
>>>>>>> origin/feature/club-bdd
