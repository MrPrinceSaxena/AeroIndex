import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { UserProfile } from "../types/auth";
import { loginApi, signupApi, demoLoginApi, getCurrentUserApi } from "../api/auth";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; organization: string; role: string }) => Promise<void>;
  loginAsPersona: (personaKey: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "apix_auth_token";
const USER_KEY = "apix_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    async function validateSession() {
      if (token) {
        try {
          const freshProfile = await getCurrentUserApi(token);
          setUser(freshProfile);
          localStorage.setItem(USER_KEY, JSON.stringify(freshProfile));
        } catch {
          // If offline or dev fallback, keep cached user or reset if invalid
          if (!user) {
            logout();
          }
        }
      }
      setIsLoading(false);
    }
    validateSession();
  }, [token]);

  const saveAuthSession = (authToken: string, userProfile: UserProfile) => {
    setToken(authToken);
    setUser(userProfile);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userProfile));
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi(email, pass);
      saveAuthSession(res.token, res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { name: string; email: string; password: string; organization: string; role: string }) => {
    setIsLoading(true);
    try {
      const res = await signupApi(data);
      saveAuthSession(res.token, res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsPersona = async (personaKey: string) => {
    setIsLoading(true);
    try {
      const res = await demoLoginApi(personaKey);
      saveAuthSession(res.token, res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        signup,
        loginAsPersona,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
