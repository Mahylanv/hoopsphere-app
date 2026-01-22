// src/features/payments/services/paymentService.ts

import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

const functions = getFunctions(getApp());

export async function testPaymentIntent() {
  const createIntent = httpsCallable(
    functions,
    "createPaymentIntent"
  );

  const res: any = await createIntent();
  console.log("clientSecret:", res.data.clientSecret);

  return res.data.clientSecret;
}
