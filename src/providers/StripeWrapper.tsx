import React from "react";
import { Platform } from "react-native";

type Props = {
  children: React.ReactElement | React.ReactElement[];
};

const Impl =
  Platform.OS === "web"
    ? require("./StripeWrapper.web").default
    : require("./StripeWrapper.native").default;

export default function StripeWrapper(props: Props) {
  return <Impl {...props} />;
}
