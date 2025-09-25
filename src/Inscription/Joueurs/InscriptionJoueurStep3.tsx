import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { Feather } from '@expo/vector-icons';
import clsx from 'clsx';

import paris from '../../../assets/paris.png';
import monaco from '../../../assets/monaco.png';
import csp from '../../../assets/csp.png';

const CLUBS = [
  { name: 'Paris Basket - U18 Féminin (Régional 3)', logo: paris },
  { name: 'Monaco - U20 Masculin (National 2)', logo: monaco },
  { name: 'CSP Limoges - Seniors (Élite)', logo: csp },
];

const tailles = Array.from({ length: 71 }, (_, i) => `${150 + i} cm`);
const poidsOptions = Array.from({ length: 101 }, (_, i) => `${40 + i} kg`);
const postes = ['Meneur', 'Arrière', 'Ailier', 'Ailier fort', 'Pivot'];
const DEPARTEMENTS = [
  '01 - Ain', '02 - Aisne', '03 - Allier', '04 - Alpes-de-Haute-Provence', '05 - Hautes-Alpes',
  '06 - Alpes-Maritimes', '07 - Ardèche', '08 - Ardennes', '09 - Ariège', '10 - Aube',
  '11 - Aude', '12 - Aveyron', '13 - Bouches-du-Rhône', '14 - Calvados', '15 - Cantal',
  '16 - Charente', '17 - Charente-Maritime', '18 - Cher', '19 - Corrèze', '2A - Corse-du-Sud',
  '2B - Haute-Corse', '21 - Côte-d\'Or', '22 - Côtes-d\'Armor', '23 - Creuse', '24 - Dordogne',
  '25 - Doubs', '26 - Drôme', '27 - Eure', '28 - Eure-et-Loir', '29 - Finistère',
  '30 - Gard', '31 - Haute-Garonne', '32 - Gers', '33 - Gironde', '34 - Hérault',
  '35 - Ille-et-Vilaine', '36 - Indre', '37 - Indre-et-Loire', '38 - Isère', '39 - Jura',
  '40 - Landes', '41 - Loir-et-Cher', '42 - Loire', '43 - Haute-Loire', '44 - Loire-Atlantique',
  '45 - Loiret', '46 - Lot', '47 - Lot-et-Garonne', '48 - Lozère', '49 - Maine-et-Loire',
  '50 - Manche', '51 - Marne', '52 - Haute-Marne', '53 - Mayenne', '54 - Meurthe-et-Moselle',
  '55 - Meuse', '56 - Morbihan', '57 - Moselle', '58 - Nièvre', '59 - Nord',
  '60 - Oise', '61 - Orne', '62 - Pas-de-Calais', '63 - Puy-de-Dôme', '64 - Pyrénées-Atlantiques',
  '65 - Hautes-Pyrénées', '66 - Pyrénées-Orientales', '67 - Bas-Rhin', '68 - Haut-Rhin',
  '69 - Rhône', '70 - Haute-Saône', '71 - Saône-et-Loire', '72 - Sarthe', '73 - Savoie',
  '74 - Haute-Savoie', '75 - Paris', '76 - Seine-Maritime', '77 - Seine-et-Marne',
  '78 - Yvelines', '79 - Deux-Sèvres', '80 - Somme', '81 - Tarn', '82 - Tarn-et-Garonne',
  '83 - Var', '84 - Vaucluse', '85 - Vendée', '86 - Vienne', '87 - Haute-Vienne',
  '88 - Vosges', '89 - Yonne', '90 - Territoire de Belfort', '91 - Essonne',
  '92 - Hauts-de-Seine', '93 - Seine-Saint-Denis', '94 - Val-de-Marne', '95 - Val-d\'Oise',
  '971 - Guadeloupe', '972 - Martinique', '973 - Guyane', '974 - La Réunion', '976 - Mayotte'
];

type Nav3Prop = NativeStackNavigationProp<RootStackParamList, 'InscriptionJoueurStep3'>;

export default function InscriptionJoueurStep3() {
  const navigation = useNavigation<Nav3Prop>();

  const [taille, setTaille] = useState('');
  const [poids, setPoids] = useState('');
  const [main, setMain] = useState('');
  const [poste, setPoste] = useState('');
  const [departement, setDepartement] = useState('');
  const [club, setClub] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showDepartementModal, setShowDepartementModal] = useState(false);
  const [searchDepartement, setSearchDepartement] = useState('');
  const [showClubModal, setShowClubModal] = useState(false);
  const [searchClub, setSearchClub] = useState('');

  const isValid = taille && poids && main && poste && departement && club;

  const renderModal = (
    title: string,
    options: string[],
    onSelect: (val: string) => void,
    showSearch?: boolean,
    searchValue?: string,
    setSearchValue?: (val: string) => void
  ) => (
    <Modal visible={true} transparent animationType="slide">
      <View className="flex-1 justify-center bg-black/70">
        <View className="bg-zinc-900 mx-5 rounded-xl p-4">
          <Text className="text-white text-lg font-bold mb-3">{title}</Text>

          {showSearch && setSearchValue && (
            <TextInput
              placeholder="Rechercher..."
              placeholderTextColor="#999"
              value={searchValue}
              onChangeText={setSearchValue}
              className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-3"
            />
          )}

          <ScrollView className="max-h-80">
            {options
              .filter((val) =>
                !showSearch || !searchValue
                  ? true
                  : val.toLowerCase().includes(searchValue.toLowerCase())
              )
              .map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    onSelect(val);
                    if (setSearchValue) setSearchValue('');
                    setFocusedInput(null);
                    setShowDepartementModal(false);
                    setShowClubModal(false);
                  }}
                  className="py-3"
                >
                  <Text className="text-white">{val}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              if (setSearchValue) setSearchValue('');
              setFocusedInput(null);
              setShowDepartementModal(false);
              setShowClubModal(false);
            }}
            className="mt-4 bg-gray-700 rounded-lg py-3 items-center"
          >
            <Text className="text-white">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderClubModal = () => (
    <Modal visible={true} transparent animationType="slide">
      <View className="flex-1 justify-center bg-black/70">
        <View className="bg-zinc-900 mx-5 rounded-xl p-4">
          <Text className="text-white text-lg font-bold mb-3">Sélectionne ton club</Text>

          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor="#999"
            value={searchClub}
            onChangeText={setSearchClub}
            className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-3"
          />

          <ScrollView className="max-h-80">
            {CLUBS.filter(c =>
              c.name.toLowerCase().includes(searchClub.toLowerCase())
            ).map((clubItem) => (
              <TouchableOpacity
                key={clubItem.name}
                onPress={() => {
                  setClub(clubItem.name);
                  setSearchClub('');
                  setShowClubModal(false);
                }}
                className="flex-row items-center space-x-3 py-2"
              >
                <Image source={clubItem.logo} className="w-8 h-8 rounded-full" />
                <Text className="text-white text-base ml-2">{clubItem.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              setSearchClub('');
              setShowClubModal(false);
            }}
            className="mt-4 bg-gray-700 rounded-lg py-3 items-center"
          >
            <Text className="text-white">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0E0D0D]">
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 mt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          className="flex-row items-center space-x-3"
        >
          <Image source={require('../../../assets/arrow-left.png')} className="w-9 h-9" />
          <Text className="text-white text-xl ml-3">Inscription joueur</Text>
        </Pressable>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
          <Text className="text-white">plus tard</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View className="items-center my-8">
        <View className="relative w-28 h-28 rounded-full bg-zinc-600 items-center justify-center">
          <Feather name="user" size={56} color="#aaa" />
          <View className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full">
            <Feather name="edit-2" size={16} color="white" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} className="px-6 pt-10">
        <TouchableOpacity onPress={() => setFocusedInput('taille')} className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white">
          <Text className={clsx('text-base', taille ? 'text-white' : 'text-gray-400')}>
            {taille || 'Sélectionne ta taille'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setFocusedInput('poids')} className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white">
          <Text className={clsx('text-base', poids ? 'text-white' : 'text-gray-400')}>
            {poids || 'Sélectionne ton poids'}
          </Text>
        </TouchableOpacity>

        <Text className="text-white text-base mb-2">Main forte</Text>
        <View className="flex-row justify-between mb-5">
          {['Gauche', 'Droite'].map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setMain(opt)}
              className={clsx(
                'rounded-lg py-3 px-5 flex-1',
                main === opt ? 'border-2 border-orange-500' : 'border-2 border-white',
                opt === 'Gauche' ? 'mr-2' : ''
              )}
            >
              <Text className="text-white text-center text-base">{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => setFocusedInput('poste')} className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white">
          <Text className={clsx('text-base', poste ? 'text-white' : 'text-gray-400')}>
            {poste || 'Sélectionne ton poste'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowDepartementModal(true)} className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white">
          <Text className={clsx('text-base', departement ? 'text-white' : 'text-gray-400')}>
            {departement || 'Sélectionne ton département'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowClubModal(true)} className="border-2 rounded-lg h-14 px-4 justify-center mb-5 border-white">
          <Text className={clsx('text-base', club ? 'text-white' : 'text-gray-400')}>
            {club || 'Sélectionne ton club'}
          </Text>
        </TouchableOpacity>

        <Pressable
          disabled={!isValid}
          onPress={() => navigation.navigate('MainTabs')}
          className={clsx(
            'py-4 rounded-2xl items-center',
            isValid ? 'bg-orange-500' : 'bg-gray-600 opacity-60'
          )}
        >
          <Text className="text-white font-bold text-lg">Continuer</Text>
        </Pressable>
      </ScrollView>

      {focusedInput === 'taille' && renderModal('Sélectionne ta taille', tailles, setTaille)}
      {focusedInput === 'poids' && renderModal('Sélectionne ton poids', poidsOptions, setPoids)}
      {focusedInput === 'poste' && renderModal('Sélectionne ton poste', postes, setPoste)}
      {showDepartementModal &&
        renderModal(
          'Sélectionne ton département',
          DEPARTEMENTS,
          setDepartement,
          true,
          searchDepartement,
          setSearchDepartement
        )}
      {showClubModal && renderClubModal()}
    </SafeAreaView>
  );
}
