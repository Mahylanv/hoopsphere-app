import React from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
} from 'react-native';

export default function Chat() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <View className="flex-1 justify-center items-center px-8">
                <Text className="text-2xl font-bold mb-4">Discussion</Text>
                <Text className="text-gray-500">
                    Ici s’afficheront vos conversations en temps réel.
                </Text>
            </View>
        </SafeAreaView>
    );
}
