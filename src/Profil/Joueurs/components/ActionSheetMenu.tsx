import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onSetAvatar?: () => void;
  onDelete?: () => void;
};

export default function ActionSheetMenu({
  visible,
  onClose,
  onShare,
  onDownload,
  onSetAvatar,
  onDelete,
}: Props) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="slide">
      {/* Zone cliquable pour fermer */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          {/* PANEL */}
          <View
            style={{
              backgroundColor: "#1c1c1e",
              paddingVertical: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            {/* SHARE */}
            <TouchableOpacity
              onPress={() => {
                onShare?.();
                onClose();
              }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="share-outline" size={22} color="white" />
              <Text style={{ color: "white", fontSize: 17, marginLeft: 12 }}>
                Partager
              </Text>
            </TouchableOpacity>

            {/* DOWNLOAD */}
            <TouchableOpacity
              onPress={() => {
                onDownload?.();
                onClose();
              }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="cloud-download-outline" size={22} color="white" />
              <Text style={{ color: "white", fontSize: 17, marginLeft: 12 }}>
                Télécharger
              </Text>
            </TouchableOpacity>

            {/* SET AS AVATAR */}
            <TouchableOpacity
              onPress={() => {
                onSetAvatar?.();
                onClose();
              }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="person-circle-outline" size={22} color="white" />
              <Text style={{ color: "white", fontSize: 17, marginLeft: 12 }}>
                Définir comme avatar
              </Text>
            </TouchableOpacity>

            {/* DELETE */}
            <TouchableOpacity
              onPress={() => {
                onDelete?.();
                onClose();
              }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#ff4d4f" />
              <Text style={{ color: "#ff4d4f", fontSize: 17, marginLeft: 12 }}>
                Supprimer
              </Text>
            </TouchableOpacity>

            {/* CANCEL */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 18,
                marginTop: 10,
                backgroundColor: "#2c2c2e",
                alignItems: "center",
                borderRadius: 12,
                marginHorizontal: 12,
              }}
            >
              <Text style={{ color: "white", fontSize: 17 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
