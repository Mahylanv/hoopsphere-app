import React from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
} from 'react-native';

export default function MainJoueur() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <View className="flex-1 justify-center items-center px-8">
                <Text className="text-3xl font-bold text-center">
                    Bienvenue dans votre espace joueur !
                </Text>
            </View>
        </SafeAreaView>
    );
}
