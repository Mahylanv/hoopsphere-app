import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
    ActivityIndicator,
    Alert,
    ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../types";
import clsx from "clsx";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";

type Nav = NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;

const backgroundImage = require("../../../../assets/mdp-oublié.jpg");

export default function ForgotPassword() {
    const navigation = useNavigation<Nav>();
    const [email, setEmail] = useState("");
    const [focused, setFocused] = useState<"email" | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Asset.fromModule(backgroundImage).downloadAsync().catch(() => null);
    }, []);

    const onSubmit = async () => {
        if (!email.trim()) return;
        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email.trim());
            Alert.alert(
                "Email envoyé",
                "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
            );
            navigation.goBack();
        } catch (e: any) {
            console.error("reset error:", e);
            let msg = "Impossible d’envoyer l’email de réinitialisation.";
            if (e?.code === "auth/invalid-email") msg = "Adresse email invalide.";
            if (e?.code === "auth/user-not-found")
                msg = "Aucun utilisateur trouvé avec cet email.";
            Alert.alert("Erreur", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" translucent />
            <ImageBackground
                source={backgroundImage}
                resizeMode="cover"
                className="flex-1"
                imageStyle={{ opacity: 0.6 }}
            >
                <View className="absolute inset-0 bg-black/55" />
                <View className="flex-1 px-6 justify-center space-y-6">
                    <Text className="text-white text-3xl font-bold text-center mb-2">
                        Réinitialiser le mot de passe
                    </Text>
                    <Text className="text-gray-300 text-center mb-8">
                        Renseignez votre adresse e-mail de récuperation
                    </Text>

                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused(null)}
                        className={clsx(
                            "border-2 rounded-lg h-14 px-4 text-white text-base mb-3 bg-[#1A1A1A]",
                            focused === "email" ? "border-orange-500" : "border-white/20"
                        )}
                    />

                    <Pressable
                        onPress={onSubmit}
                        disabled={!email.trim() || loading}
                        className={clsx(
                            "py-4 rounded-2xl items-center",
                            !email.trim() || loading
                                ? "bg-gray-600 opacity-60"
                                : "bg-orange-500"
                        )}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">
                                Envoyer le lien
                            </Text>
                        )}
                    </Pressable>

                    <Pressable
                        className="items-center mt-6 flex-row justify-center gap-2"
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={18} color="#fff" />
                        <Text className="text-white underline">Retour</Text>
                    </Pressable>
                </View>
            </ImageBackground>
        </View>
    );
}
