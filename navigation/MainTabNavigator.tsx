import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MainJoueur from '../screens/MainJoueur';
import Chat from '../screens/Chat';
import Profil from '../screens/Profil';
import Search from '../screens/Search';

import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: '#f3f4f6', borderTopColor: '#d1d5db' },
                tabBarActiveTintColor: '#1d4ed8',
                tabBarInactiveTintColor: '#6b7280',
            }}
        >
            <Tab.Screen
                name="MainJoueur"
                component={MainJoueur}
                options={{ tabBarLabel: 'Accueil' }}
            />
            <Tab.Screen
                name="Chat"
                component={Chat}
                options={{ tabBarLabel: 'Chat' }}
            />
            <Tab.Screen
                name="Search"
                component={Search}
                options={{ tabBarLabel: 'Rechercher' }}
            />
            <Tab.Screen
                name="Profil"
                component={Profil}
                options={{ tabBarLabel: 'Profil' }}
            />
        </Tab.Navigator>
    );
}
