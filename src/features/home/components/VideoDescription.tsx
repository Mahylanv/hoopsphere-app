// src/features/home/components/VideoDescription.tsx

import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";

/* ============================================================
   TYPES
============================================================ */
type Props = {
  description?: string | null;
  location?: string | null;
  createdAt?: any;
  skills?: string[];
};

/* ============================================================
   UTILS
============================================================ */
function toDate(input: any): Date | null {
  if (!input) return null;

  // Firestore Timestamp { seconds, nanoseconds } or has toDate()
  if (typeof input === "object") {
    if (typeof input.toDate === "function") {
      return input.toDate();
    }
    if (typeof input.seconds === "number") {
      return new Date(input.seconds * 1000);
    }
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(dateLike?: any) {
  const d = toDate(dateLike);
  if (!d) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatRelativeDate(dateLike?: any) {
  const d = toDate(dateLike);
  if (!d) return null;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mois`;
  const years = Math.floor(days / 365);
  return `${years} an${years > 1 ? "s" : ""}`;
}

function normalizeSkill(skill: string) {
  // Pick&Roll → PickRoll / Fast Break → FastBreak
  return skill.replace(/[^a-zA-Z0-9]/g, "");
}

function truncateWords(text: string, limit: number) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text || "";
  return `${words.slice(0, limit).join(" ")} ...`;
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

  const hasContent =
    Boolean(description?.trim()) ||
    Boolean(location) ||
    (skills?.length ?? 0) > 0;

  if (!hasContent) return null;

  const WORD_LIMIT = 8;

  const { cleanText, displayText, hashtags, shouldShowMore } = useMemo(() => {
    const words = (description || "").split(/\s+/).filter(Boolean);

    const textTags = words.filter((w) => w.startsWith("#"));
    const cleanWords = words.filter((w) => !w.startsWith("#"));
    const clean = cleanWords.join(" ");

    const skillTags = skills.map((skill) => `#${normalizeSkill(skill)}`);

    const mergedTags = Array.from(new Set([...textTags, ...skillTags]));

    const shouldShowMore = cleanWords.length > WORD_LIMIT;
    const baseText = shouldShowMore
      ? cleanWords.slice(0, WORD_LIMIT).join(" ")
      : clean;
    const displayText = expanded
      ? clean
      : shouldShowMore
        ? `${baseText} ...`
        : baseText;

    return {
      cleanText: clean,
      displayText,
      hashtags: mergedTags,
      shouldShowMore,
    };
  }, [description, skills, expanded]);

  const locationDisplay = useMemo(() => {
    if (!location) return null;
    return expanded ? location : truncateWords(location, WORD_LIMIT);
  }, [expanded, location]);

  const relativeDate = formatRelativeDate(createdAt);
  const exactDate = formatDate(createdAt);

  return (
    <View className="absolute bottom-12 left-0 right-0">
      <View className="bg-black/40 px-4 py-3.5 border-t border-white/12">
        {/* 📝 DESCRIPTION */}
        {!!cleanText && (
          <Text className="text-white text-[15px] leading-5">
            {displayText}
          </Text>
        )}

        {/* 🔹 VOIR PLUS */}
        {shouldShowMore && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            className="mt-1"
            hitSlop={8}
          >
            <Text className="text-orange-400 text-sm font-semibold">
              {expanded ? "Voir moins" : "Voir plus"}
            </Text>
          </TouchableOpacity>
        )}

        {/* #️⃣ HASHTAGS (DESCRIPTION + SKILLS) */}
        {hashtags.length > 0 && (
          <View className="flex-row flex-wrap gap-x-2 gap-y-1 mt-2">
            {hashtags.map((tag) => (
              <Text key={tag} className="text-orange-300 text-sm font-semibold">
                {tag}
              </Text>
            ))}
          </View>
        )}

        {/* 📅 DATE */}
        {createdAt && (
          <View className="flex-row items-center mt-3">
            <Text className="text-gray-400 text-xs">
              {relativeDate || exactDate}
            </Text>
            {relativeDate && exactDate && (
              <Text className="text-gray-600 text-xs ml-2">· {exactDate}</Text>
            )}
          </View>
        )}

        {/* 📍 LIEU */}
        {locationDisplay ? (
          <View className="flex-row items-center mt-2">
              <Text
              className="text-white font-semibold ml-2 flex-shrink"
              numberOfLines={expanded ? undefined : 1}
            >
              {locationDisplay}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
