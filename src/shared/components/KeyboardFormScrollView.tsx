import React from "react";
import { Platform } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

export default function KeyboardFormScrollView(
  props: KeyboardAwareScrollViewProps
) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={Platform.OS === "ios" ? 24 : 16}
      extraKeyboardSpace={Platform.OS === "ios" ? 24 : 12}
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
}
