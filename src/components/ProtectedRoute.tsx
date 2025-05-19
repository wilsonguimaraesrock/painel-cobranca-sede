
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoggedIn, username } = useAuth();
  const location = useLocation();
  
  // Adicionar logs para debug
  useEffect(() => {
    console.log("ProtectedRoute: isLoggedIn =", isLoggedIn);
    console.log("ProtectedRoute: username =", username);
    console.log("ProtectedRoute: location =", location.pathname);
  }, [isLoggedIn, username, location]);
  
  if (!isLoggedIn) {
    console.log("Redirecionando para /login");
    return <Navigate to="/login" replace />;
  }
  
  console.log("Renderizando conteúdo protegido");
  return <>{children}</>;
};

export default ProtectedRoute;
