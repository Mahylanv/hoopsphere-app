import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { auth, db } from "../../config/firebaseConfig";
import { collection, doc, setDoc } from "firebase/firestore";

export async function registerPushTokenForUser(
  userType: "club" | "joueur" | null
) {
  if (!userType) return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  const uid = auth.currentUser?.uid;
  if (!uid || !token) return;

  const root = userType === "club" ? "clubs" : "joueurs";
  await setDoc(
    doc(collection(db, root, uid, "devices"), token),
    {
      token,
      platform: Platform.OS,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

// Backward compatibility (legacy call sites)
export async function registerPushTokenForClub() {
  return registerPushTokenForUser("club");
}
