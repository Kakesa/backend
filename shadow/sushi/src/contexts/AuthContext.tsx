/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@/types";
import { api } from "@/services/api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  getRedirectPath: () => string;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ===== Utilitaire pour générer firstName / lastName depuis name =====
  const addNames = (userData: Partial<User> & { name?: string; _id?: string; isActive?: boolean; linkedProfile?: any }): User => {
    if (!userData) return {} as User;
    
    // Priorité au profil lié (Teacher, Student, Parent) s'il existe
    const profile = userData.linkedProfile || {};
    
    const [firstNameFromName = "", ...rest] = (userData.name || "").split(" ");
    const lastNameFromName = rest.join(" ") || "";
    
    return {
      ...userData,
      id: userData.id || userData._id || "",
      firstName: profile.firstName || userData.firstName || firstNameFromName,
      lastName: profile.lastName || userData.lastName || lastNameFromName,
      email: userData.email || profile.email || "",
      role: userData.role || "student",
      linkedId: userData.linkedId || profile.id || profile._id || "",
      schoolId: userData.schoolId || userData.school || profile.schoolId || profile.school || "",
      status: userData.status || (userData.isActive ? "active" : "inactive") || profile.status,
    } as User;
  };

  // ===== Récupération utilisateur depuis l'API =====
  const fetchUser = React.useCallback(async (authToken?: string) => {
    const authHeader = authToken || token || localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!authHeader) {
      setIsLoading(false);
      return;
    }

    try {
      // On s'assure que le token est dans le localStorage pour l'intercepteur Axios
      if (authHeader && !localStorage.getItem("authToken")) {
        localStorage.setItem("authToken", authHeader);
      }

      const res = await api.get<User>("/auth/me");
      const userData = res.data.data;
      if (!userData) throw new Error("No user data");

      const typedUser = addNames(userData);
      
      setUser(typedUser);
      setToken(authHeader);
      localStorage.setItem("user", JSON.stringify(typedUser));
      localStorage.setItem("token", authHeader);
      localStorage.setItem("authToken", authHeader);
      
      if (typedUser.schoolId) {
        localStorage.setItem("currentSchoolId", typedUser.schoolId);
      }
    } catch (err: any) {
      console.error("Auth initialization error:", err);
      // Ne déconnecter que si c'est vraiment une erreur 401/403
      // L'intercepteur s'en occupe déjà normalement
      if (err?.status === 401) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // ===== Chargement initial depuis localStorage =====
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token") || localStorage.getItem("authToken");

      if (storedToken) {
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(addNames(parsedUser));
            setToken(storedToken);
          } catch (e) {
            console.error("Error parsing stored user", e);
          }
        }
        // Toujours rafraîchir pour être sûr
        await fetchUser(storedToken);
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUser]);

  // ===== Login =====
  const login = (user: User, token: string) => {
    const userWithNames = addNames(user);
    setUser(userWithNames);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(userWithNames));
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
    if (userWithNames.schoolId) {
      localStorage.setItem("currentSchoolId", userWithNames.schoolId);
    }
  };

  // ===== Logout =====
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentSchoolId");
  };

  const getRedirectPath = (): string => {
    if (!user) return "/login";
    switch (user.role) {
      case "superadmin":
        return "/superadmin";
      case "admin":
        return "/dashboard";
      case "teacher":
        return "/teacher";
      case "student":
        return "/student";
      case "parent":
        return "/parent";
      case "accountant":
        return "/accountant";
      default:
        return "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        getRedirectPath,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
