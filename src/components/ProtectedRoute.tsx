import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    console.log("ProtectedRoute: isLoading es true, mostrando pantalla de carga...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-xl">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Usuario no autenticado, redirigiendo a /login...");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute: Usuario autenticado, renderizando children...");
  return <>{children}</>;
};

export default ProtectedRoute;