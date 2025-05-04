import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    TextInput,
    FlatList,
    Text,
    StatusBar,
} from 'react-native';

export default function Search() {
    const [query, setQuery] = useState('');
    const data = ['Paris', 'Lyon', 'Marseille', 'Toulouse']; 
    const filtered = data.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <View className="p-4">
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Rechercher..."
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
                />
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <View className="py-2 border-b border-gray-200">
                            <Text className="text-base">{item}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text className="text-gray-500 text-center mt-8">
                            Aucun résultat
                        </Text>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
