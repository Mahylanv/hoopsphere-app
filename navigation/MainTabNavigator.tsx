// navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MainJoueur from '../screens/MainJoueur';
import Chat from '../screens/Chat';
import Search from '../screens/Search';
import Profil from '../screens/Profil';

import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1f2937',  // gris foncé
                    borderTopColor: '#111827',
                },
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarIcon: ({ color, size }) => {
                    let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'home-outline';

                    switch (route.name) {
                        case 'MainJoueur':
                            iconName = 'home-outline';
                            break;
                        case 'Chat':
                            iconName = 'chatbubble-outline';
                            break;
                        case 'Search':
                            iconName = 'search-outline';
                            break;
                        case 'Profil':
                            iconName = 'person-outline';
                            break;
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="MainJoueur"
                component={MainJoueur}
                options={{ tabBarLabel: 'Accueil' }}
            />
            <Tab.Screen
                name="Chat"
                component={Chat}
                options={{ tabBarLabel: 'Message' }}
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
