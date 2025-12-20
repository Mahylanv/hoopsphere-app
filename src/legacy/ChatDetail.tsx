import React from 'react';
import {
    View,
    Text,
    StatusBar,
    ImageBackground,
    Image,
    TextInput,
    Pressable,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    const { name, avatar } = route.params;
    const { width } = Dimensions.get('window');

    return (
        <ImageBackground
            source={require('../../assets/background.png')}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
        >
            <View className="absolute inset-0 bg-black/70" />

            <SafeAreaView className="flex-1">
                <StatusBar barStyle="light-content" />

                <View className="flex-row items-center px-4 py-2">
                    <Pressable onPress={() => navigation.goBack()} className="p-2">
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </Pressable>
                    <Image
                        source={avatar}
                        className="w-10 h-10 rounded-full ml-2 border border-gray-600"
                    />
                    <Text className="ml-3 text-lg font-semibold text-white">
                        {name}
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                    className="flex-1"
                >
                    <View
                        style={{ maxWidth: width * 0.75 }}
                        className="bg-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg p-3 mb-4"
                    >
                        <Text className="text-gray-200">
                            Salut, comment ça va ? Je voulais savoir si tu es dispo ce week-end pour un match amical.
                        </Text>
                        <Text className="text-gray-400 text-xs mt-1">14:05</Text>
                    </View>

                    <View className="items-end">
                        <View
                            style={{ maxWidth: width * 0.75 }}
                            className="bg-blue-600 rounded-tl-lg rounded-tr-lg rounded-bl-lg p-3 mb-4"
                        >
                            <Text className="text-white">
                                Ça va bien, merci ! Oui je suis dispo samedi après-midi.
                            </Text>
                            <View className="flex-row justify-end items-center mt-1">
                                <Text className="text-white text-xs mr-1">14:07</Text>
                                <Ionicons name="checkmark-done" size={14} color="white" />
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View className="absolute bottom-0 w-full flex-row items-center px-4 py-2 bg-gray-900 border-t border-gray-700">
                    <TextInput
                        placeholder="Écrire un message…"
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-white"
                    />
                    <Pressable className="ml-3 p-2 bg-blue-600 rounded-full">
                        <Ionicons name="send" size={20} color="#fff" />
                    </Pressable>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}
