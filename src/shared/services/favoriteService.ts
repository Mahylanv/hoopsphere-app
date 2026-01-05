import { db } from "../../config/firebaseConfig";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

/* ============================
   ADD FAVORITE
============================ */
export const addFavoriteClub = async (
  uid: string,
  clubUid: string
) => {
  console.log("➕ addFavoriteClub", { uid, clubUid });

  if (!uid) {
    throw new Error("addFavoriteClub: uid manquant");
  }

  await setDoc(
    doc(db, "joueurs", uid, "favoriteClubs", clubUid),
    {
      createdAt: serverTimestamp(),
    }
  );
};

/* ============================
   REMOVE FAVORITE
============================ */
export const removeFavoriteClub = async (
  uid: string,
  clubUid: string
) => {
  console.log("🗑 removeFavoriteClub", { uid, clubUid });

  if (!uid) {
    throw new Error("removeFavoriteClub: uid manquant");
  }

  await deleteDoc(
    doc(db, "joueurs", uid, "favoriteClubs", clubUid)
  );
};
