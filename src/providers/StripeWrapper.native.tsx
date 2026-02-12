import React from "react";

let StripeProvider:
  | React.ComponentType<{
      publishableKey: string;
      children: React.ReactNode;
    }>
  | null = null;

try {
  StripeProvider =
    require("@stripe/stripe-react-native").StripeProvider || null;
} catch {
  StripeProvider = null;
}

export default function StripeWrapper({
  children,
}: {
  children: React.ReactElement | React.ReactElement[];
}) {
  if (!StripeProvider) {
    return <>{children}</>;
  }
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    >
      <>{children}</>
    </StripeProvider>
  );
}
