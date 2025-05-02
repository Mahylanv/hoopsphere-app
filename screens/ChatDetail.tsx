// screens/ChatDetail.tsx
import React from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;
type ChatDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'ChatDetail'>;

export default function ChatDetail({
    route,
    navigation,
}: {
    route: ChatDetailRouteProp;
    navigation: ChatDetailNavProp;
}) {
    const { conversationId, name } = route.params;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <View className="flex-1 p-6">
                <Text className="text-2xl font-bold mb-2">
                    Conversation avec {name}
                </Text>
                <Text className="text-gray-500 mb-4">
                    ID : {conversationId}
                </Text>

                {/* Ici tu pourras afficher tes messages… */}
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-400">
                        (Ici les messages de la conversation…)
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
