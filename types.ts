export type RootStackParamList = {
    Home: undefined;
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
    Connexion: undefined;
    MainJoueur: undefined;
};
