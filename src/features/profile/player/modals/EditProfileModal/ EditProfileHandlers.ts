// src/Profil/Joueurs/components/modals/EditProfileHandlers.ts

/* -------------------------------------------------
    📌 VALIDATION EMAIL
--------------------------------------------------- */
export const validateEmail = (email: string): boolean => {
  const normalized = email.trim().toLowerCase();

  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  return emailRegex.test(normalized);
};

/* -------------------------------------------------
      📌 FORMATAGE NUMÉRO DE TÉLÉPHONE
      Gère :
      - 06 XX XX XX XX
      - 07 XX XX XX XX
      - +33 6 XX XX XX XX
  --------------------------------------------------- */
export const formatPhone = (raw: string): string => {
  // On garde uniquement les chiffres + le + au début
  raw = raw.replace(/[^\d+]/g, "");

  /* ---------- FORMAT +33 ---------- */
  if (raw.startsWith("+33")) {
    let digits = raw.replace("+33", "");

    // On limite à 9 chiffres après +33
    digits = digits.substring(0, 9);

    // Construction progressive du format
    let out = "+33";
    if (digits.length > 0) out += " " + digits[0];
    if (digits.length > 1) out += " " + digits.substring(1, 3);
    if (digits.length > 3) out += " " + digits.substring(3, 5);
    if (digits.length > 5) out += " " + digits.substring(5, 7);
    if (digits.length > 7) out += " " + digits.substring(7, 9);

    return out;
  }

  /* ---------- FORMAT 06 / 07 ---------- */
  raw = raw.replace(/\D/g, ""); // seulement chiffres
  raw = raw.substring(0, 10); // max 10 chiffres FR

  let out = "";
  if (raw.length >= 2) out = raw.substring(0, 2);
  if (raw.length > 2) out += " " + raw.substring(2, 4);
  if (raw.length > 4) out += " " + raw.substring(4, 6);
  if (raw.length > 6) out += " " + raw.substring(6, 8);
  if (raw.length > 8) out += " " + raw.substring(8, 10);

  return out;
};

/* -------------------------------------------------
      📌 VALIDATION DU NUMÉRO DE TÉLÉPHONE FR
  --------------------------------------------------- */
export const validatePhone = (formatted: string): boolean => {
  const cleaned = formatted.replace(/\D/g, ""); // chiffres uniquement

  // Exemple :
  // 06XXXXXXXX ou 07XXXXXXXX
  const mobileFR = /^0[67]\d{8}$/;

  // +33 6XXXXXXXX ⇒ devient 336XXXXXXXX
  const mobileINT = /^33[67]\d{8}$/;

  return mobileFR.test(cleaned) || mobileINT.test(cleaned);
};

/* -------------------------------------------------
      📌 HANDLER COMPLET — À UTILISER DANS LE MODAL
      (si tu veux, sinon tu peux gérer dans EditProfileModal)
  --------------------------------------------------- */
  export const handlePhoneInput = (
    rawText: string,
    setEditField: (key: string, value: string) => void,
    setPhoneError: (msg: string) => void,
    cursor?: number
  ) => {
    // Nettoyage
    const digits = rawText.replace(/\D/g, "").slice(0, 10);
  
    // Format WhatsApp-like
    let formatted = "";
    let parts = [
      digits.slice(0, 2),
      digits.slice(2, 4),
      digits.slice(4, 6),
      digits.slice(6, 8),
      digits.slice(8, 10),
    ];
    formatted = parts.filter((p) => p !== "").join(" ");
  
    // Calcul curseur après ajout d'espace
    if (cursor !== undefined) {
      const spacesBefore = (formatted.slice(0, cursor).match(/ /g) || []).length;
      cursor += spacesBefore;
    }
  
    // MAJ champ
    setEditField("phone", formatted);
  
    // Validation
    if (digits.length < 10) {
      setPhoneError("");
    } else {
      setPhoneError(/^0[67]\d{8}$/.test(digits) ? "" : "Numéro invalide");
    }
  
    return formatted;
  };
  

/* -------------------------------------------------
      📌 HANDLER EMAIL
  --------------------------------------------------- */
export const handleEmailInput = (
  text: string,
  setEditField: (key: string, value: string) => void,
  setEmailError: (msg: string) => void
) => {
  const email = text.trim().toLowerCase();
  setEditField("email", email);

  if (email === "") {
    setEmailError("");
    return;
  }

  setEmailError(validateEmail(email) ? "" : "Email invalide");
};
