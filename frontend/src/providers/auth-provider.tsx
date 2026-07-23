// frontend/src/providers/auth-provider.tsx
"use client"; // Because we use hooks and localStorage

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import api from "@/lib/axios";
import { getToken, setToken, setRefreshToken, clearAuth } from "@/lib/auth";

// ─── Types ──────────────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// ─── Context ────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Check authentication status on mount ──────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Optionally: fetch user profile to validate token
    // For now, we'll assume token is valid if present.
    // In production, you might call /auth/me to get user data.
    // We'll just parse the JWT payload (if you want) or rely on login response.
    // Since our login/register returns user data, we could store it in localStorage.
    // Let's store user in localStorage as well.

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // invalid JSON, clear
        clearAuth();
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // ─── Login ───────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { access_token, refresh_token, user } = response.data;

    setToken(access_token);
    setRefreshToken(refresh_token);
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // ─── Register ────────────────────────────────────────────────────────
  const register = async (email: string, password: string, name?: string) => {
    const response = await api.post("/auth/register", {
      email,
      password,
      name,
    });
    const { access_token, refresh_token, user } = response.data;

    setToken(access_token);
    setRefreshToken(refresh_token);
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // ─── Logout ──────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate refresh token on server
      await api.post("/auth/logout");
    } catch (error: unknown) {
      // Ignore errors (user might already be logged out)
      if (axios.isAxiosError(error)) {
        console.warn("Logout request failed:", error.response?.data?.message);
      }
    } finally {
      clearAuth();
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
