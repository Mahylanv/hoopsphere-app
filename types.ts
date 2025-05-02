export type RootStackParamList = {
    Home: undefined;
    Connexion: undefined;
    InscriptionJoueurStep1: undefined;
    InscriptionJoueurStep2: { email: string; password: string };
    InscriptionJoueurStep3: {
        email: string;
        password: string;
        nom: string;
        prenom: string;
        dob: string;
    };
    InscriptionClub: undefined;

    MainTabs: undefined;

    ChatDetail: {
        conversationId: string;
        name: string;
    };
};

export type MainTabParamList = {
    MainJoueur: undefined;
    Chat: undefined; 
    Profil: undefined;
};
