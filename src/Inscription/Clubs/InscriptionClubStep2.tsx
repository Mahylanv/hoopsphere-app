import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';

// Firebase
import { db } from '../../config/firebaseConfig'; 
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'InscriptionClubStep2'>;
type RouteProps = RouteProp<RootStackParamList, 'InscriptionClubStep2'>;

export default function InscriptionClubStep2() {
  const navigation = useNavigation<NavProps>();
  const { params } = useRoute<RouteProps>();

  const uid = params.uid;
  const emailFromAuth = params.email;

  const [clubName, setClubName] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [selection, setSelection] =
    useState<'masculines' | 'feminines' | 'les deux' | null>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isValid = Boolean(clubName && department && city && selection && uid);

  const saveClub = async () => {
    if (!uid) {
      setErr('Session expirée. Merci de recommencer l’inscription.');
      return;
    }
    if (!isValid || saving) return;

    setSaving(true);
    setErr(null);

    try {
      await setDoc(
        doc(db, 'clubs', uid),
        {
          uid,
          email: emailFromAuth,
          name: clubName.trim(),
          department: department.trim(),
          city: city.trim(),
          teams: selection,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigation.navigate('Home');
    } catch (e) {
      console.error(e);
      setErr("Impossible d'enregistrer les infos du club. Réessaie.");
      Alert.alert('Erreur', "Impossible d'enregistrer les infos du club. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-6">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
        {/* Header */}
        <View className="flex-row items-center mt-4 mb-8">
          <Pressable onPress={() => navigation.goBack()}>
            <Image
              source={require('../../../assets/arrow-left.png')}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </Pressable>
          <Text className="text-white text-xl font-semibold ml-4">Infos de club</Text>
        </View>

        {/* Form */}
        <View className="space-y-5">
          <TextInput
            placeholder="Nom de club"
            placeholderTextColor="#ccc"
            value={clubName}
            onChangeText={setClubName}
            className="border border-gray-500 rounded-lg px-4 py-3 text-white"
          />
          <TextInput
            placeholder="Département"
            placeholderTextColor="#ccc"
            value={department}
            onChangeText={setDepartment}
            className="border border-gray-500 rounded-lg px-4 py-3 text-white"
          />
          <TextInput
            placeholder="Ville"
            placeholderTextColor="#ccc"
            value={city}
            onChangeText={setCity}
            className="border border-gray-500 rounded-lg px-4 py-3 text-white"
          />

          {/* Boutons de sélection */}
          {(['masculines', 'feminines', 'les deux'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setSelection(option)}
              className={`px-4 py-3 rounded-lg border ${selection === option ? 'border-orange-500 text-orange-500' : 'border-gray-500'
                }`}
              style={{ backgroundColor: selection === option ? '#1f1f1f' : 'transparent' }}
            >
              <Text
                className={`text-white ${selection === option ? 'text-orange-500 font-semibold' : ''
                  }`}
              >
                {option === 'masculines'
                  ? 'équipes masculines'
                  : option === 'feminines'
                    ? 'équipes féminines'
                    : 'les deux'}
              </Text>
            </TouchableOpacity>
          ))}

          {err ? <Text className="text-red-400">{err}</Text> : null}

          <Pressable
            disabled={!isValid || saving}
            onPress={saveClub}
            className={`mt-4 py-4 rounded-xl items-center ${isValid ? 'bg-orange-500' : 'bg-gray-600'
              }`}
          >
            <Text className="text-white font-bold text-base">
              {saving ? '...' : 'Continuer'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
