import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ requiredPermission }: { requiredPermission: string }) => {
  const { isAuthenticated, userPermissions } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no se requiere permiso específico, permitir acceso a usuarios autenticados
  if (!requiredPermission) {
    return <Outlet />;
  }

  // Verificar si el usuario tiene el permiso requerido
  const hasPermission = userPermissions.includes(requiredPermission);

  return hasPermission ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;