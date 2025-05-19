
import { createContext, useState, useContext, useEffect, ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if user is logged in on component mount
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const storedUsername = localStorage.getItem("username");
    
    console.log("AuthProvider: Verificando login:", loggedIn);
    console.log("AuthProvider: Username encontrado:", storedUsername);
    
    setIsLoggedIn(loggedIn);
    setUsername(storedUsername);
    setIsInitialized(true);
  }, []);

  const logout = () => {
    console.log("AuthProvider: Realizando logout");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUsername(null);
    window.location.href = "/login";
  };

  // Adicionando logs para debug
  useEffect(() => {
    if (isInitialized) {
      console.log("AuthProvider: Estado atualizado:", { isLoggedIn, username });
    }
  }, [isLoggedIn, username, isInitialized]);

  const value = {
    isLoggedIn,
    username,
    logout
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
