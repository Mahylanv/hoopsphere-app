import React from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
    Image,
    TextInput,
    Pressable,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    const { conversationId, name, avatar } = route.params;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
                <Pressable onPress={() => navigation.goBack()} className="p-2">
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </Pressable>
                <Image
                    source={avatar}          
                    className="w-10 h-10 rounded-full ml-2"
                />
                <Text className="ml-3 text-lg font-semibold text-gray-800">
                    {name}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16 }}
                className="flex-1 bg-gray-50"
            >
                <View className="max-w-[75%] bg-gray-300 rounded-tl-lg rounded-tr-lg rounded-br-lg p-3 mb-4">
                    <Text className="text-gray-800">
                        Bonjour Julien, ton profil m'a interpellé, tes vidéos sont vraiment différentes des autres et tes statistiques sont impressionnantes, es tu libre pour un entretien ?
                    </Text>
                </View>

                <View className="items-end">
                    <View className="max-w-[75%] bg-blue-600 rounded-tl-lg rounded-tr-lg rounded-bl-lg p-3">
                        <Text className="text-white">
                            Bonjour, merci beaucoup, je travaille dur depuis 5 ans pour cela. Je suis dispo mardi prochain si cela vous convient.
                        </Text>
                        <View className="flex-row justify-end items-center mt-1">
                            <Text className="text-white text-xs mr-1">15:20</Text>
                            <Ionicons name="checkmark-done" size={14} color="white" />
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View className="flex-row items-center px-4 py-2 border-t border-gray-200">
                <TextInput
                    placeholder="Ton message"
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-800"
                />
                <Pressable className="ml-3 p-2">
                    <Ionicons name="send" size={24} color="#3578E5" />
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
