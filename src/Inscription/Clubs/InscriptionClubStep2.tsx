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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';

type NavProps = NativeStackNavigationProp<RootStackParamList, 'InscriptionClubStep2'>;

export default function InscriptionClubStep2() {
  const navigation = useNavigation<NavProps>();

  const [clubName, setClubName] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [selection, setSelection] = useState<'masculines' | 'feminines' | 'les deux' | null>(null);

  const isValid = clubName && department && city && selection;

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
            placeholder="Departement"
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
          {['masculines', 'feminines', 'les deux'].map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setSelection(option as any)}
              className={`px-4 py-3 rounded-lg border ${
                selection === option
                  ? 'border-orange-500 text-orange-500'
                  : 'border-gray-500'
              }`}
              style={{
                backgroundColor: selection === option ? '#1f1f1f' : 'transparent',
              }}
            >
              <Text
                className={`text-white ${
                  selection === option ? 'text-orange-500 font-semibold' : ''
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

          {/* Bouton continuer */}
          <Pressable
            disabled={!isValid}
            onPress={() => navigation.navigate('Home')} // à changer si une étape 3 existe
            className={`mt-4 py-4 rounded-xl items-center ${
              isValid ? 'bg-orange-500' : 'bg-gray-600'
            }`}
          >
            <Text className="text-white font-bold text-base">Continuer</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
