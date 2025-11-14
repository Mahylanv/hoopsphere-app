import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StatusBar,
  FlatList,
  Pressable,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

const conversations = [
  {
    id: '1',
    name: 'CSP Limoges',
    avatar: require('../../assets/csp.png'),
    lastMessage: 'Bonjour, merci beaucoup',
    time: '1h',
  },
  {
    id: '2',
    name: 'Paris Basket',
    avatar: require('../../assets/paris.png'),
    lastMessage: 'Pourquoi pas',
    time: '3h',
  },
  {
    id: '3',
    name: 'CSKA Moscou',
    avatar: require('../../assets/cska.png'),
    lastMessage: 'À très vite !',
    time: '2j',
  },
];

export default function Chat() {
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = useState('');

  const data = useMemo(
    () =>
      conversations.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-white mb-4">Discussions</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher"
          placeholderTextColor="#6b7280"
          className="border border-gray-700 rounded-lg px-4 py-2 mb-4 bg-gray-900 text-white"
        />

        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('ChatDetail', {
                  conversationId: item.id,
                  name: item.name,
                  avatar: item.avatar,
                })
              }
              className="flex-row items-center justify-between bg-gray-900 rounded-lg p-4 mb-3"
            >
              <View className="flex-row items-center flex-1">
                <Image
                  source={item.avatar}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <View className="flex-shrink">
                  <Text className="text-lg font-semibold text-white">
                    {item.name}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {item.lastMessage}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-500 text-xs ml-2">{item.time}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-10">
              Aucune conversation trouvée
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}
