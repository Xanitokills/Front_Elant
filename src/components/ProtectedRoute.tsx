import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ requiredPermission }: { requiredPermission: string }) => {
  const { isAuthenticated, userPermissions, isLoading } = useAuth();

  console.log("ProtectedRoute - Required Permission:", requiredPermission);
  console.log("ProtectedRoute - User Permissions:", userPermissions);
  console.log("ProtectedRoute - Is Loading:", isLoading);
  console.log("ProtectedRoute - Is Authenticated:", isAuthenticated);

  // Mostrar un estado de carga mientras se valida la sesión
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold text-gray-700">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute - No autenticado, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  // Si no se requiere permiso específico, permitir acceso a usuarios autenticados
  if (!requiredPermission) {
    console.log("ProtectedRoute - No se requiere permiso, permitiendo acceso");
    return <Outlet />;
  }

  // Verificar si el usuario tiene el permiso requerido comparando con menu.nombre o submenu.nombre
  const hasPermission = userPermissions.some((menu) =>
    menu.nombre === requiredPermission ||
    menu.submenus.some((submenu) => submenu.nombre === requiredPermission)
  );

  console.log("ProtectedRoute - Has Permission:", hasPermission);

  return hasPermission ? <Outlet /> : (
    <Navigate to="/unauthorized" replace />
  );
};

export default ProtectedRoute;