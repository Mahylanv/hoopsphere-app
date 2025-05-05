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
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* En-tête */}
            <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
                <Pressable onPress={() => navigation.goBack()} className="p-2">
                    <Text className="text-blue-600">← Retour</Text>
                </Pressable>
                <Image
                    source={club.logo}
                    className="w-10 h-10 rounded-full ml-2"
                />
                <Text className="ml-3 text-lg font-semibold">{club.name}</Text>
            </View>

            {/* Onglets */}
            <Tab.Navigator
                screenOptions={{
                    tabBarIndicatorStyle: { backgroundColor: '#1d4ed8' },
                    tabBarLabelStyle: { fontWeight: 'bold' },
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
