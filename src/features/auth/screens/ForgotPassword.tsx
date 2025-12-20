import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StatusBar,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../types";
import clsx from "clsx";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../config/firebaseConfig";

type Nav = NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;

export default function ForgotPassword() {
    const navigation = useNavigation<Nav>();
    const [email, setEmail] = useState("");
    const [focused, setFocused] = useState<"email" | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        if (!email.trim()) return;
        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email.trim());
            Alert.alert(
                "Email envoyé ✅",
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
        <SafeAreaView className="flex-1 bg-[#0E0D0D] px-6 justify-center">
            <StatusBar barStyle="light-content" />
            <View className="space-y-6">
                <Text className="text-white text-3xl font-bold text-center mb-4">
                    Réinitialiser le mot de passe
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
                        "border-2 rounded-lg h-14 px-4 text-white text-base mb-3",
                        focused === "email" ? "border-orange-500" : "border-white"
                    )}
                />

                <Pressable
                    onPress={onSubmit}
                    disabled={!email.trim() || loading}
                    className={clsx(
                        "py-4 rounded-2xl items-center",
                        !email.trim() || loading ? "bg-gray-600 opacity-60" : "bg-orange-500"
                    )}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Envoyer le lien</Text>
                    )}
                </Pressable>

                <Pressable className="items-center mt-2" onPress={() => navigation.goBack()}>
                    <Text className="text-white underline">Retour</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
