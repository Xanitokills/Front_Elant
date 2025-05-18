// ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Corregido

// Interfaces
interface Submenu {
  id: number;
  nombre: string;
  url: string;
  icono: string;
  orden: number;
  estado: number;
}

interface Menu {
  id: number;
  nombre: string;
  url: string | null;
  icono: string;
  orden: number;
  estado: number;
  submenus: Submenu[];
}

const ProtectedRoute = ({ requiredUrl }: { requiredUrl: string }) => {
  const { isAuthenticated, userPermissions } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const normalizedRequiredUrl = requiredUrl.startsWith('/')
    ? requiredUrl.slice(1)
    : requiredUrl;

  const hasPermission = userPermissions.some((menu: Menu) => {
    if (menu.url && menu.url.slice(1) === normalizedRequiredUrl) {
      return true;
    }
    return menu.submenus.some(
      (submenu: Submenu) => submenu.url.slice(1) === normalizedRequiredUrl
    );
  });

  return hasPermission ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" replace state={{ from: location }} />
  );
};

export default ProtectedRoute;