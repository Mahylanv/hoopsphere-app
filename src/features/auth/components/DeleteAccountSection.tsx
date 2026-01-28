// src/Profil/Joueur/components/DeleteAccountSection.tsx

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Modal, TextInput } from "react-native";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { deleteUserAccount } from "../services/userService";
import { RootStackParamList } from "../../../types";

export default function DeleteAccountSection() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  // Suppression du compte
  const handleDelete = () => {
    Alert.alert(
      "Supprimer mon compte",
      "Cette action est irréversible. Es-tu sûr de vouloir supprimer ton compte ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteUserAccount();
              Alert.alert("Compte supprimé", "Ton compte a été supprimé avec succès");
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
              });
            } catch (e: any) {
              const code = e?.code || "";
              if (code === "auth/requires-recent-login") {
                setPassword("");
                setPasswordError("");
                setPasswordVisible(true);
                return;
              }
              Alert.alert(
                "Erreur",
                "Impossible de supprimer ton compte. Réessaie plus tard."
              );
              console.error(e);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const confirmWithPassword = async () => {
    if (!password.trim()) {
      setPasswordError("Mot de passe requis.");
      return;
    }
    try {
      setLoading(true);
      await deleteUserAccount(password.trim());
      setPasswordVisible(false);
      Alert.alert("Compte supprimé", "Ton compte a été supprimé 👋");
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (e: any) {
      const code = e?.code || "";
      if (code === "auth/wrong-password") {
        setPasswordError("Mot de passe incorrect.");
        return;
      }
      Alert.alert(
        "Erreur",
        "Impossible de supprimer ton compte. Réessaie plus tard."
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="px-6 mb-10">
      <TouchableOpacity
        onPress={handleDelete}
        activeOpacity={0.9}
        className="flex-row items-center justify-center py-3.5 px-6 rounded-2xl bg-[#1A0F0F] border border-red-500/70 shadow-lg shadow-black/40"
      >
        <Ionicons name="trash-outline" size={18} color="#F87171" />
        <Text className="text-white text-base font-semibold text-center ml-2">
          {loading ? "Suppression..." : "Supprimer mon compte"}
        </Text>
      </TouchableOpacity>

      <Modal transparent visible={passwordVisible} animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full bg-[#111] border border-white/10 rounded-2xl p-5">
            <Text className="text-white text-lg font-semibold">
              Confirme ton mot de passe
            </Text>
            <Text className="text-gray-400 text-sm mt-2">
              Pour des raisons de sécurité, reconnecte-toi avant de supprimer ton compte.
            </Text>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setPasswordError("");
              }}
              placeholder="Mot de passe"
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="mt-4 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
            />
            {passwordError ? (
              <Text className="text-red-400 text-xs mt-2">{passwordError}</Text>
            ) : null}
            <View className="flex-row justify-end mt-5">
              <TouchableOpacity
                onPress={() => setPasswordVisible(false)}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/10 mr-2"
              >
                <Text className="text-white font-semibold">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmWithPassword}
                className="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/50"
              >
                <Text className="text-white font-semibold">Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
