// screens/Chat.tsx
import React from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
    FlatList,
    Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

// données factices
const conversations = [
    { id: '1', name: 'Alice Dupont' },
    { id: '2', name: 'Bob Martin' },
    { id: '3', name: 'Clara Thomas' },
];

export default function Chat() {
    const navigation = useNavigation<NavProp>();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            <View className="px-4 py-2">
                <Text className="text-2xl font-bold mb-4">Discussions</Text>

                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() =>
                                navigation.navigate('ChatDetail', {
                                    conversationId: item.id,
                                    name: item.name,
                                })
                            }
                            className="bg-gray-100 rounded-lg p-4 mb-3"
                        >
                            <Text className="text-lg font-medium">{item.name}</Text>
                            <Text className="text-gray-500 text-sm">
                                Dernier message simulé…
                            </Text>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <Text className="text-gray-500 text-center mt-10">
                            Aucune conversation
                        </Text>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
