import React from 'react';
import { SafeAreaView, Pressable, Text, View, StatusBar, Image } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import ClubPresentation from './ClubPresentation';
import ClubTeams from './ClubTeams';
import ClubOffers from './ClubOffers';

type ClubProfileRouteProp = RouteProp<RootStackParamList, 'ClubProfile'>;
type ClubProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'ClubProfile'>;

const Tab = createMaterialTopTabNavigator();

export default function ClubProfile() {
    const { params } = useRoute<ClubProfileRouteProp>();
    const navigation = useNavigation<ClubProfileNavProp>();
    const { club } = params;

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" />

            <View className="items-center px-4 py-6 border-b border-gray-700">
                <Pressable onPress={() => navigation.goBack()} className="absolute left-4 top-6 p-2">
                    <Text className="text-white text-lg">←</Text>
                </Pressable>
                <Image
                    source={club.logo}
                    className="w-20 h-20 rounded-full mb-2"
                />
                <Text className="text-xl font-bold text-white">{club.name}</Text>
                <Text className="text-sm text-gray-400">{club.city}</Text>
            </View>

            <Tab.Navigator
                screenOptions={{
                    tabBarStyle: { backgroundColor: '#1f2937' },   
                    tabBarIndicatorStyle: { backgroundColor: '#3b82f6', height: 3 },
                    tabBarActiveTintColor: '#fff',
                    tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
                    tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'none' },
                }}
            >
                <Tab.Screen
                    name="Présentation"
                    component={ClubPresentation}
                    initialParams={{ club }}
                />
                <Tab.Screen
                    name="Équipes"
                    component={ClubTeams}
                    initialParams={{ club }}
                />
                <Tab.Screen
                    name="Offres"
                    component={ClubOffers}
                    initialParams={{ club }}
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
}
