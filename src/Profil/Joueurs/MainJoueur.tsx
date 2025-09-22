// screens/MainJoueur.tsx
import React from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
    ScrollView,
    FlatList,
    Image,
    ImageBackground,
    Pressable,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';

type MainNavProp = NativeStackNavigationProp<RootStackParamList, 'Payment'>;

const RANKING = [
    { id: '1', name: 'Julien', points: 98, avatar: require('../../../assets/avatar.png'), change: +2 },
    { id: '2', name: 'Camille', points: 92, avatar: require('../../../assets/avatar.png'), change: -1 },
    { id: '3', name: 'Antoine', points: 88, avatar: require('../../../assets/avatar.png'), change: +3 },
    { id: '4', name: 'Emma', points: 85, avatar: require('../../../assets/avatar.png'), change: 0 },
    { id: '5', name: 'Lucas', points: 82, avatar: require('../../../assets/avatar.png'), change: -2 },
];

const VIDEOS = [
    { id: 'v1', thumb: require('../../../assets/background.png'), title: 'Dunk by Lucas' },
    { id: 'v2', thumb: require('../../../assets/alleyoop.jpg'), title: 'Mon Alleyoop' },
    { id: 'v3', thumb: require('../../../assets/entrainement-basket.jpg'), title: 'Entrainement du jour' },
];

export default function MainJoueur() {
    const { width } = Dimensions.get('window');
    const navigation = useNavigation<MainNavProp>();

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text className="text-2xl font-bold text-white mb-4">
                    Classement de la semaine
                </Text>
                <FlatList
                    data={RANKING}
                    keyExtractor={i => i.id}
                    scrollEnabled={false}
                    renderItem={({ item, index }) => {
                        const up = item.change > 0;
                        const down = item.change < 0;
                        return (
                            <View className="flex-row items-center bg-gray-800 rounded-lg p-3 mb-2">
                                <Text className="text-xl text-white w-6 text-center">{index + 1}</Text>
                                <Image source={item.avatar} className="w-12 h-12 rounded-full mx-3" />
                                <View className="flex-1">
                                    <Text className="text-white font-semibold">{item.name}</Text>
                                    <Text className="text-gray-400 text-sm">{item.points} pts</Text>
                                </View>
                                {up && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="arrow-up" size={20} color="#4ade80" />
                                        <Text className="text-green-400 ml-1">{item.change}</Text>
                                    </View>
                                )}
                                {down && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="arrow-down" size={20} color="#f87171" />
                                        <Text className="text-red-400 ml-1">{Math.abs(item.change)}</Text>
                                    </View>
                                )}
                                {!up && !down && <Text className="text-gray-500">–</Text>}
                            </View>
                        );
                    }}
                />

                {/* Statistiques perso (verrouillées) */}
                <View className="mb-6 relative">
                    <BlurView intensity={60} className="rounded-lg overflow-hidden">
                        <View className="bg-gray-800 p-4" style={{ height: 120 }}>
                            <Text className="text-white font-bold text-xl">
                                Suivi de vos statistiques amélioré 
                            </Text>
                            <Text className="text-gray-400 mt-2">
                                Consultez vos évolutions hebdo, vos moyennes de points, rebonds…
                            </Text>
                        </View>
                    </BlurView>
                    <Pressable
                        onPress={() => navigation.navigate('Payment')}
                        className="absolute inset-0 justify-center items-center"
                    >
                        <Ionicons name="lock-closed" size={40} color="white" />
                    </Pressable>
                </View>

                <Text className="text-2xl font-bold text-white my-4">
                    À regarder
                </Text>

                {VIDEOS.map((video, idx) => (
                    <React.Fragment key={video.id}>
                        {/* Fake pub */}
                        {idx === 2 && (
                            <View className="mb-6 relative rounded-lg overflow-hidden">
                                <ImageBackground
                                    source={require('../../../assets/pub.png')}
                                    style={{ width: width - 32, height: (width - 32) * 0.4 }}
                                />
                                <Pressable
                                    onPress={() => navigation.navigate('Payment')}
                                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full"
                                >
                                    <Ionicons name="close" size={20} color="white" />
                                </Pressable>
                            </View>
                        )}

                        <View className="mb-6">
                            <Pressable className="rounded-lg overflow-hidden">
                                <ImageBackground
                                    source={video.thumb}
                                    style={{ width: width - 32, height: (width - 32) * 0.56 }}
                                >
                                    <View className="absolute inset-0 bg-black/40 justify-center items-center">
                                        <Ionicons name="play-circle" size={64} color="white" />
                                    </View>
                                </ImageBackground>
                            </Pressable>
                            <Text className="text-white mt-2 text-lg">{video.title}</Text>
                        </View>
                    </React.Fragment>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
