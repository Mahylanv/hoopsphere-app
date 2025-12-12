import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { auth, db } from "../../config/firebaseConfig";
import { collection, doc, setDoc } from "firebase/firestore";

export async function registerPushTokenForClub() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    const uid = auth.currentUser?.uid;
    if (!uid || !token) return;

    // on stocke sous clubs/{uid}/devices/{token}
    await setDoc(doc(collection(db, "clubs", uid, "devices"), token), {
        token,
        platform: Platform.OS,
        updatedAt: Date.now()
    }, { merge: true });
}
