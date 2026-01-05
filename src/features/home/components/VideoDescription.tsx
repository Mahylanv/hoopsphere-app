import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";

/* ============================================================
   TYPES
============================================================ */
type Props = {
  description?: string | null;
  location?: string | null;
  createdAt?: Date | null;
  skills?: string[];
};

/* ============================================================
   UTILS
============================================================ */
function formatDate(date?: Date | null) {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeSkill(skill: string) {
  // Pick&Roll → PickRoll / Fast Break → FastBreak
  return skill.replace(/[^a-zA-Z0-9]/g, "");
}

/* ============================================================
   COMPONENT
============================================================ */
export default function VideoDescription({
  description,
  location,
  createdAt,
  skills = [],
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!description) return null;

  const MAX_CHARS = 50;

  const { cleanText, hashtags, shouldShowMore } = useMemo(() => {
    const words = description.split(/\s+/);

    const textTags = words.filter((w) => w.startsWith("#"));
    const clean = words.filter((w) => !w.startsWith("#")).join(" ");

    const skillTags = skills.map(
      (skill) => `#${normalizeSkill(skill)}`
    );

    const mergedTags = Array.from(
      new Set([...textTags, ...skillTags])
    );

    return {
      cleanText: clean,
      hashtags: mergedTags,
      shouldShowMore:
        clean.length > MAX_CHARS || description.includes("\n"),
    };
  }, [description, skills]);

  return (
    <View className="absolute bottom-20 left-4 right-24">
      {/* 📍 LIEU */}
      {location && (
        <Text className="text-white font-semibold mb-1">
          📍 {location}
        </Text>
      )}

      {/* 📝 DESCRIPTION */}
      <Text
        className="text-white text-sm"
        numberOfLines={expanded ? undefined : 2}
      >
        {cleanText}
      </Text>

      {/* 🔹 VOIR PLUS */}
      {shouldShowMore && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text className="text-gray-400 text-sm mt-1">
            {expanded ? "Voir moins" : "Voir plus"}
          </Text>
        </TouchableOpacity>
      )}

      {/* #️⃣ HASHTAGS (DESCRIPTION + SKILLS) */}
      {hashtags.length > 0 && (
        <Text className="text-blue-400 text-sm mt-2">
          {hashtags.join(" ")}
        </Text>
      )}

      {/* 📅 DATE */}
      {createdAt && (
        <Text className="text-gray-400 text-xs mt-2">
          {formatDate(createdAt)}
        </Text>
      )}
    </View>
  );
}
