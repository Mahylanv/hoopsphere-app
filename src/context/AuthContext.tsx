import React, { createContext, useEffect, useState, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userType: string | null;
  setUserType: (type: string | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userType: null,
  setUserType: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      try {
        const savedType = await AsyncStorage.getItem("userType");
        if (savedType) setUserType(savedType);
      } catch (e) {
        console.error("Erreur lecture type utilisateur", e);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userType, setUserType }}>
      {children}
    </AuthContext.Provider>
  );
};
