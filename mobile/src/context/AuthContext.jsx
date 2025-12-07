import { createContext, useContext, useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { loadStoredToken, setAuthToken } from "../api/client";
import { getMe, login as apiLogin } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await loadStoredToken();
        if (token) {
          try {
            const me = await getMe();
            setUser(me);
          } catch (err) {
            console.log("Token inválido no boot:", err?.message);
            await setAuthToken(null);
            setUser(null);
          }
        }
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, []);

  async function signIn({ email, senha }) {
    await apiLogin({ email, senha });
    const me = await getMe();
    setUser(me);
  }

  async function signOut() {
    await setAuthToken(null);
    setUser(null);
  }

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
