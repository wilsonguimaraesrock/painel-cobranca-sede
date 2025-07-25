
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { AuthUser } from "@/services/authService";

interface AuthContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  username: string | null; // Mantido para compatibilidade
  logout: () => void;
  login: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if user is logged in on component mount
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const storedUser = localStorage.getItem("user");
    const storedUsername = localStorage.getItem("username");
    
    console.log("AuthProvider: Verificando login:", loggedIn);
    console.log("AuthProvider: Usuário armazenado:", storedUser);
    
    if (loggedIn && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setUsername(parsedUser.name || parsedUser.email);
      } catch (error) {
        console.error("Erro ao parsear usuário armazenado:", error);
        // Fallback para username antigo
        setUsername(storedUsername);
      }
    }
    
    setIsLoggedIn(loggedIn);
    setIsInitialized(true);
  }, []);

  const login = (authUser: AuthUser) => {
    console.log("AuthProvider: Realizando login com usuário:", authUser);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", JSON.stringify(authUser));
    localStorage.setItem("username", authUser.name || authUser.email);
    
    setIsLoggedIn(true);
    setUser(authUser);
    setUsername(authUser.name || authUser.email);
  };

  const logout = () => {
    console.log("AuthProvider: Realizando logout");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUser(null);
    setUsername(null);
    window.location.href = "/login";
  };

  // Adicionando logs para debug
  useEffect(() => {
    if (isInitialized) {
      console.log("AuthProvider: Estado atualizado:", { 
        isLoggedIn, 
        user: user?.name, 
        role: user?.role 
      });
    }
  }, [isLoggedIn, user, isInitialized]);

  const value = {
    isLoggedIn,
    user,
    username,
    logout,
    login
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
