// src/shared/components/AddressAutocomplete.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";

type AddressResult = {
  fulltext?: string;
  properties?: {
    label?: string;
    city?: string;
    postcode?: string;
  };
  x?: number;
  y?: number;
};

type Props = {
  value?: string;
  placeholder?: string;
  onSelect: (address: {
    label: string;
    city?: string;
    postcode?: string;
    lat?: number;
    lng?: number;
  }) => void;
};

export default function AddressAutocomplete({
  value = "",
  placeholder = "Adresse",
  onSelect,
}: Props) {
  const [input, setInput] = useState(value);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async (text: string) => {
    setInput(text);

    if (text.trim().length < 3) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `https://data.geopf.fr/geocodage/completion/?text=${encodeURIComponent(
          text
        )}&type=StreetAddress&maximumResponses=5`
      );

      const data = await res.json();
      setResults(data?.results || data?.features || []);
    } catch (e) {
      console.log("Adresse autocomplete error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: AddressResult) => {
    const label =
      item.fulltext || item.properties?.label || input;

    onSelect({
      label,
      city: item.properties?.city,
      postcode: item.properties?.postcode,
      lat: item.y,
      lng: item.x,
    });

    setInput(label);
    setResults([]);
  };

  return (
    <View>
      <TextInput
        value={input}
        onChangeText={fetchSuggestions}
        placeholder={placeholder}
        placeholderTextColor="#888"
        className="bg-[#1A1A1A] text-white px-4 py-3 rounded-xl"
      />

      {loading && (
        <View className="mt-2">
          <ActivityIndicator size="small" color="#F97316" />
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(_, i) => i.toString()}
        className="mt-2"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item)}
            className="bg-[#1A1A1A] px-4 py-3 rounded-lg mb-2"
          >
            <Text className="text-white">
              {item.fulltext || item.properties?.label}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
