import React from 'react';
import { SafeAreaView, View, Text, StatusBar } from 'react-native';

export default function Profil() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <View className="flex-1 justify-center items-center">
                <Text className="text-2xl font-bold">Mon Profil</Text>
                {/* … contenu profil … */}
            </View>
        </SafeAreaView>
    );
}
