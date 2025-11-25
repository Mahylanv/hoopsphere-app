// src/Profil/Joueur/profiljoueur.tsx

import React from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AvatarSection from "./components/AvatarSection";
import BioSection from "./components/BioSection";
import GallerySection from "./components/GallerySection";
import DeleteAccountSection from "./components/DeleteAccountSection";
import LogoutButton from "./components/LogoutButton";

import usePlayerProfile from "./hooks/usePlayerProfile";

export default function ProfilJoueur() {
  const {
    user,
    loading,
    editMode,
    setEditMode,
    avatarLoading,
    handleAvatarChange,
    saveProfile,
    fields,
    setField,
  } = usePlayerProfile();

  if (loading || !user) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* --- AVATAR --- */}
        <AvatarSection
          user={user}
          onEditAvatar={handleAvatarChange}
          avatarLoading={avatarLoading}
        />

        {/* --- BIO + INFOS JOUEUR --- */}
        <BioSection
          editMode={editMode}
          birthYear={fields.dob}
          setBirthYear={(v) => setField("dob", v)}
          height={fields.taille}
          setHeight={(v) => setField("taille", v)}
          onSelectHeight={() => {}}
          weight={fields.poids}
          setWeight={(v) => setField("poids", v)}
          onSelectWeight={() => {}}
          position={fields.poste}
          setPosition={(v) => setField("poste", v)}
          onSelectPoste={() => {}}
          strongHand={fields.main}
          setStrongHand={(v) => setField("main", v)}
          departement={fields.departement}
          onSelectDepartement={() => {}}
          club={fields.club}
          onSelectClub={() => {}}
          // Champs non encore implémentés → on laisse vide pour éviter toute erreur
          phone={""}
          setPhone={() => {}}
          level={""}
          onSelectLevel={() => {}}
          experience={""}
          setExperience={() => {}}
          bio={fields.description}
          setBio={(v) => setField("description", v)}
          onSave={saveProfile}
        />

        {/* --- GALERIE (version simple pour le moment) --- */}
        <GallerySection />

        {/* --- Déconnexion --- */}
        <LogoutButton />

        {/* --- SUPPRESSION COMPTE --- */}
        <DeleteAccountSection />
      </ScrollView>
    </SafeAreaView>
  );
}
